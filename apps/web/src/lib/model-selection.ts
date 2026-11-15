import type { StudioModel } from "@/hooks/use-models";

/**
 * Slugs usually end with a task-specific suffix (for example `-edit` on an
 * image-to-image variant). Stripping it gives older API responses a best-effort
 * family key when `provider_model` is unavailable.
 */
const TASK_VARIANT_SUFFIX =
  /-(?:text-to-video|image-to-video|text-to-image|image-to-image|img2img|txt2img|img2vid|txt2vid|edit|i2i|t2i|i2v|t2v|image|video)$/i;

function slugFamilyKey(model: StudioModel): string {
  return `${model.provider_id}:${model.slug.replace(TASK_VARIANT_SUFFIX, "")}`;
}

/**
 * Identifies the underlying model family across task-specific variants.
 * Variants of one provider model share `provider_model` even when their slugs
 * differ (`replicate-flux-2-pro` vs `replicate-flux-2-pro-edit`).
 */
export function modelFamilyKey(model: StudioModel): string {
  const providerModel = model.provider_model?.trim();
  if (providerModel) return `${model.provider_id}:${providerModel}`;

  return slugFamilyKey(model);
}

/** Find a same-family model in another task list, if one exists. */
export function findRelatedModel(
  models: StudioModel[],
  previous: StudioModel | null | undefined
): StudioModel | null {
  if (!previous) return null;

  const family = modelFamilyKey(previous);
  const exact = models.find(
    (candidate) => candidate.slug !== previous.slug && modelFamilyKey(candidate) === family
  );
  if (exact) return exact;

  // Some providers use different `provider_model` paths per task
  // (e.g. .../kling-video/v2/standard/text-to-video vs .../image-to-video).
  const slugFamily = slugFamilyKey(previous);
  return (
    models.find(
      (candidate) =>
        candidate.slug !== previous.slug && slugFamilyKey(candidate) === slugFamily
    ) ?? null
  );
}

export interface ResolvedModelSelection {
  model: StudioModel;
  /** True when the previous model was missing and a same-family variant replaced it. */
  migrated: boolean;
}

/**
 * Keep the current selection when it still exists in the list. Otherwise prefer
 * a same-family variant (e.g. FLUX.2 Pro → FLUX.2 Pro Edit) before falling back
 * to the first available model.
 */
export function resolveModelSelection(
  models: StudioModel[],
  currentSlug: string | null,
  previous: StudioModel | null | undefined
): ResolvedModelSelection | null {
  if (models.length === 0) return null;

  if (currentSlug) {
    const current = models.find((model) => model.slug === currentSlug);
    if (current) return { model: current, migrated: false };
  }

  const related = findRelatedModel(models, previous);
  return { model: related ?? models[0], migrated: related !== null };
}
