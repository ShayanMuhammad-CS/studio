-- Migration 0011: Recover projects blocked by stale upload drafts.
--
-- Before this change, failed or pending upload drafts kept their original
-- filename as ``assets.name``. Because the per-project (project_id, kind, name)
-- unique index only excludes soft-deleted rows, a failed draft permanently
-- occupied its name and made re-uploading the same file impossible.
--
-- 1. Soft-delete drafts whose upload never completed (status pending,
--    processing, or failed) so the index frees their names.
-- 2. Also clean up any orphaned storage objects tied to those drafts is
--    best-effort and left to the worker/garbage collector; this migration only
--    touches database rows.
update public.assets as a
set
  deleted_at = coalesce(a.deleted_at, now()),
  metadata = a.metadata || jsonb_build_object('status', 'failed', 'error', 'Stale upload draft cleaned up by migration 0011')
where
  a.deleted_at is null
  and coalesce(a.metadata ->> 'status', 'ready') in ('pending', 'processing', 'failed')
  and a.origin = 'upload';

-- Ensure the partial unique index exists (it does since 0009; idempotent guard).
create unique index if not exists idx_assets_project_kind_name
  on public.assets (project_id, kind, name)
  where deleted_at is null;
