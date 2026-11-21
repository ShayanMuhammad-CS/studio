"""Per-model media input capabilities.

The composer needs to know which media slots a model accepts and how many
files each slot allows. This module is the single source of truth used by the
models endpoint (to advertise capabilities to the browser) and by
:class:`studio_core.generation.GenerationService` (to enforce them).

Capabilities fall back to sensible per-task defaults, so catalog models keep
working without any extra data. Only models with unusual inputs (multiple
source images, first/last frames) need an explicit override below.
"""

from pydantic import BaseModel

from studio_core.models import AssetKind, InputRole, Model, TaskType


class InputCapability(BaseModel):
    """One media slot accepted by a model.

    Capabilities can be grouped into mutually exclusive input modes. Models
    such as Seedance and Veo accept either a first/last frame pair *or* a list
    of reference images, but never both. A capability with ``required_group``
    makes its group one of the acceptable choices: at least one input from one
    of those groups must be present.
    """

    role: InputRole
    kind: AssetKind = AssetKind.IMAGE
    required: bool = False
    max_count: int = 1
    label: str
    # Capabilities that share a group are alternatives to every other group.
    group: str | None = None
    # At least one input from this capability's group is required. Several
    # groups can set this to express "one of these modes is required".
    required_group: bool = False
    # Another role that must be present whenever this role is used.
    requires: InputRole | None = None
    # Short helper text shown next to the slot in the composer.
    description: str | None = None


# Safe defaults for every task type. These preserve the original behaviour:
# image-to-image needs one init image and image-to-video needs one first frame.
DEFAULT_CAPABILITIES: dict[TaskType, tuple[InputCapability, ...]] = {
    TaskType.TEXT_TO_IMAGE: (),
    TaskType.IMAGE_TO_IMAGE: (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=1,
            label="Source image",
        ),
    ),
    TaskType.TEXT_TO_VIDEO: (),
    TaskType.IMAGE_TO_VIDEO: (
        InputCapability(
            role=InputRole.FIRST_FRAME,
            required=True,
            max_count=1,
            label="First frame",
        ),
    ),
}


def _frames_or_references(max_references: int) -> tuple[InputCapability, ...]:
    """Slots for models that accept frames *or* reference images, not both.

    Seedance and Veo expose a first/last frame pair and a separate list of
    reference images. The provider rejects requests that mix the two modes, so
    both groups are mutually exclusive and at least one of them is required.
    """

    return (
        InputCapability(
            role=InputRole.FIRST_FRAME,
            max_count=1,
            label="First frame",
            group="frames",
            required_group=True,
            description="Starting image for the shot.",
        ),
        InputCapability(
            role=InputRole.LAST_FRAME,
            max_count=1,
            label="Last frame",
            group="frames",
            required_group=True,
            requires=InputRole.FIRST_FRAME,
            description="Optional ending image; requires a first frame.",
        ),
        InputCapability(
            role=InputRole.REFERENCE_IMAGE,
            max_count=max_references,
            label="Reference images",
            group="references",
            required_group=True,
            description="Characters, props, or environments to keep consistent.",
        ),
    )


# Models whose provider accepts more than the task default.
# Keyed by the catalog's stable model slug.
MODEL_CAPABILITY_OVERRIDES: dict[str, tuple[InputCapability, ...]] = {
    # Replicate passes image inputs as a list for these models.
    "replicate-flux-2-pro-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=4,
            label="Source images",
        ),
    ),
    "replicate-nano-banana-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=4,
            label="Source images",
        ),
    ),
    "replicate-gpt-image-2-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=8,
            label="Source images",
        ),
    ),
    "replicate-seedream-4-5-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=15,
            label="Source images",
        ),
    ),
    "replicate-seedream-4-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=15,
            label="Source images",
        ),
    ),
    "replicate-nano-banana-pro-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=14,
            label="Source images",
        ),
    ),
    "replicate-flux-2-max-edit": (
        InputCapability(
            role=InputRole.INIT_IMAGE,
            required=True,
            max_count=8,
            label="Source images",
        ),
    ),
    # Kling image-to-video models accept a tail/last-frame image.
    "fal-kling-i2v": (
        InputCapability(
            role=InputRole.FIRST_FRAME,
            required=True,
            max_count=1,
            label="First frame",
        ),
        InputCapability(
            role=InputRole.LAST_FRAME,
            required=False,
            max_count=1,
            label="Last frame",
        ),
    ),
    "fal-kling-2-5-turbo-i2v": (
        InputCapability(
            role=InputRole.FIRST_FRAME,
            required=True,
            max_count=1,
            label="First frame",
        ),
        InputCapability(
            role=InputRole.LAST_FRAME,
            required=False,
            max_count=1,
            label="Last frame",
        ),
    ),
    # Seedance and Veo image-to-video models accept either frames or a list of
    # reference images. The provider rejects requests that mix the two.
    "replicate-seedance-2-5-i2v": _frames_or_references(max_references=30),
    "replicate-seedance-2-i2v": _frames_or_references(max_references=9),
    "replicate-seedance-1-pro-i2v": (
        InputCapability(
            role=InputRole.FIRST_FRAME,
            required=True,
            max_count=1,
            label="First frame",
        ),
        InputCapability(
            role=InputRole.LAST_FRAME,
            required=False,
            max_count=1,
            label="Last frame",
        ),
    ),
    "replicate-veo-3-1-i2v": _frames_or_references(max_references=3),
    "replicate-veo-3-1-fast-i2v": _frames_or_references(max_references=3),
}


def get_input_capabilities(model: Model) -> list[InputCapability]:
    """Return the media slots accepted by ``model``.

    A model-specific override wins; otherwise the task default applies. The
    returned objects are copies so callers cannot mutate the registry.
    """
    capabilities = MODEL_CAPABILITY_OVERRIDES.get(
        model.slug,
        DEFAULT_CAPABILITIES.get(model.task_type, ()),
    )
    return [capability.model_copy() for capability in capabilities]
