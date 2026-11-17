"""Provider webhook receiver — POST /internal/webhooks/{provider}/{job_id}.

Security:
  - Per-job HMAC token in query param (constant-time compare)
  - Provider-level signature verification via the provider adapter

Idempotency:
  - Duplicate deliveries for a terminal job are 200 no-ops
  - Finalize is enqueued only once per running→finalizing edge
"""

import hashlib
import hmac
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from api.deps import DBConn
from studio_core.models import JobStatus
from studio_core.queue import TASK_FINALIZE_GENERATION, EnqueueError, enqueue
from studio_core.repositories import EventRepository, JobRepository
from studio_core.settings import get_settings
from studio_core.state_machine import JobStateMachine
from studio_providers.base import ProviderJobState
from studio_providers.registry import get_provider

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])

# A provider can deliver its terminal callback before the worker has committed
# the ``submitting -> running`` transition (or at all, when the worker stalls).
# Terminal callbacks therefore have to be able to advance a job on their own.
_EARLY_PROVIDER_STATES = {ProviderJobState.PENDING, ProviderJobState.RUNNING}


def _compute_job_token(job_id: UUID) -> str:
    """Derive a per-job HMAC token from the webhook signing secret."""
    settings = get_settings()
    return hmac.new(
        settings.webhook_signing_secret.encode(),
        msg=str(job_id).encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()


def _verify_job_token(job_id: UUID, token: str) -> bool:
    """Constant-time comparison of the expected and provided job tokens."""
    expected = _compute_job_token(job_id)
    return hmac.compare_digest(expected, token)


async def _advance_to_finalizing(
    request: Request,
    db: DBConn,
    job_id: UUID,
    provider: str,
) -> None:
    """Move a running job to finalizing and enqueue the finalize task once."""
    state_machine = JobStateMachine(db)
    updated = await state_machine.transition(
        job_id,
        expected=JobStatus.RUNNING,
        new=JobStatus.FINALIZING,
        event_payload={"triggered_by": "webhook", "provider": provider},
    )
    if updated is None:
        # Another webhook/worker already transitioned the job — fine.
        return

    redis_pool = getattr(request.app.state, "redis_pool", None)
    try:
        await enqueue(redis_pool, TASK_FINALIZE_GENERATION, job_id)
    except EnqueueError as exc:
        # Log but don't fail the webhook — reconciler will pick it up
        logger.error("Failed to enqueue finalize for job %s after webhook: %s", job_id, exc)


@router.post("/webhooks/{provider}/{job_id}", status_code=200)
async def receive_webhook(
    provider: str,
    job_id: UUID,
    request: Request,
    db: DBConn,
    token: str = Query(..., description="Per-job HMAC token"),
) -> dict[str, str]:
    """Receive a provider webhook, verify signatures, record the event, and enqueue finalize.

    Always returns 200 quickly.  The finalize task does the heavy lifting.
    """
    # 1. Verify per-job token (constant-time)
    if not _verify_job_token(job_id, token):
        raise HTTPException(status_code=401, detail="Invalid webhook token")

    # 2. Read raw body (needed for provider signature verification)
    body = await request.body()
    headers = dict(request.headers)

    # 3. Verify provider signature using the adapter
    try:
        provider_adapter = get_provider(provider)
        event = provider_adapter.verify_webhook(headers, body)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}") from exc
    except Exception as exc:
        logger.warning("Webhook signature verification failed for provider %s: %s", provider, exc)
        raise HTTPException(
            status_code=401, detail="Webhook signature verification failed"
        ) from exc

    # 4. Load the job
    job_repo = JobRepository(db)
    job = await job_repo.get_by_id(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    # 5. Record raw webhook event (always, even if terminal)
    import json as _json

    event_repo = EventRepository(db)
    await event_repo.append(
        job_id=job_id,
        event_type="webhook",
        payload={
            "provider": provider,
            "raw": _json.loads(body.decode("utf-8", errors="replace")) if body else {},
        },
    )

    # 6. Ignore callbacks that belong to a prediction this job no longer owns.
    # After a reconciler retry the job may be running a newer prediction; a late
    # delivery for the old one must not affect the current attempt.
    if job.provider_job_id and event.provider_job_id != job.provider_job_id:
        logger.warning(
            "Webhook for job %s references prediction %s but job owns %s; ignoring stale delivery",
            job_id,
            event.provider_job_id,
            job.provider_job_id,
        )
        return {"status": "no-op"}

    # 7. Idempotency: if already terminal, return 200 no-op
    terminal_statuses = {JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.CANCELED}
    if job.status in terminal_statuses:
        logger.info("Webhook for job %s already in terminal status %s; no-op", job_id, job.status)
        return {"status": "no-op"}

    state_machine = JobStateMachine(db)

    if job.status == JobStatus.RUNNING:
        # 8. Attempt running → finalizing transition; enqueue finalize if succeeded
        await _advance_to_finalizing(request, db, job_id, provider)
    elif job.status in (JobStatus.SUBMITTING, JobStatus.QUEUED):
        # 9. The provider finished before the worker persisted this attempt.
        # Advance the job ourselves and record the provider id, otherwise the
        # reconciler later treats the job as stuck and submits it again.
        if job.status == JobStatus.QUEUED:
            claimed = await state_machine.transition(
                job_id,
                expected=JobStatus.QUEUED,
                new=JobStatus.SUBMITTING,
                event_payload={"triggered_by": "webhook", "provider": provider},
            )
            if claimed is None:
                logger.info(
                    "Webhook for job %s could not claim queued job; another worker won", job_id
                )
                return {"status": "no-op"}

        advanced = await state_machine.transition(
            job_id,
            expected=JobStatus.SUBMITTING,
            new=JobStatus.RUNNING,
            provider_job_id=event.provider_job_id,
            event_payload={"triggered_by": "webhook", "provider": provider},
        )
        if advanced is None:
            logger.info(
                "Webhook for job %s could not advance submitting job (concurrent change); no-op",
                job_id,
            )
            return {"status": "no-op"}

        logger.info(
            "Webhook advanced job %s from %s to running with prediction %s",
            job_id,
            job.status,
            event.provider_job_id,
        )

        if event.state in _EARLY_PROVIDER_STATES:
            # Progress callback only; wait for the terminal one.
            return {"status": "ok"}

        await _advance_to_finalizing(request, db, job_id, provider)
    else:
        logger.info(
            "Webhook received for job %s in status %s; ignoring transition",
            job_id,
            job.status,
        )

    return {"status": "ok"}
