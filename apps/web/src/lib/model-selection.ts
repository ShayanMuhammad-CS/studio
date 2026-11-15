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

/** A model family and the task-specific variants that implement it. */
export interface ModelFamily {
  /** Stable identifier used as the picker value. */
  key: string;
  providerId: string;
  /** Display name with task descriptors removed, e.g. "FLUX.2 Pro". */
  name: string;
  variants: StudioModel[];
  textVariant?: StudioModel;
  imageVariant?: StudioModel;
}

function isImageTask(taskType: string): boolean {
  return taskType.startsWith("image_");
}

function familyDisplayName(model: StudioModel): string {
  const cleaned = model.display_name.replace(/\s*\([^()]*\)\s*$/, "").trim();
  return cleaned || model.display_name;
}

/**
 * Group models into unique families. Variants can be linked either by a shared
 * `provider_model` (FLUX.2 Pro / FLUX.2 Pro Edit) or by a shared slug family
 * (fal-kling-t2v / fal-kling-i2v, whose provider model paths differ).
 */
export function groupModelFamilies(models: StudioModel[]): ModelFamily[] {
  const byKey = new Map<string, ModelFamily>();
  const links = new Map<ModelFamily, Set<string>>();

  function mergeInto(target: ModelFamily, source: ModelFamily) {
    target.variants.push(...source.variants);
    const targetKeys = links.get(target) ?? new Set<string>();
    const sourceKeys = links.get(source);
    if (sourceKeys) {
      sourceKeys.forEach((key) => {
        targetKeys.add(key);
        byKey.set(key, target);
      });
    }
    links.set(target, targetKeys);
    links.delete(source);
  }

  for (const model of models) {
    const keys = Array.from(
      new Set([modelFamilyKey(model), slugFamilyKey(model)])
    );

    let family: ModelFamily | undefined;
    for (const key of keys) {
      family = byKey.get(key);
      if (family) break;
    }

    if (!family) {
      family = {
        key: keys[0],
        providerId: model.provider_id,
        name: familyDisplayName(model),
        variants: [],
      };
    }

    for (const key of keys) {
      const existing = byKey.get(key);
      if (existing && existing !== family) mergeInto(family, existing);
      byKey.set(key, family);
    }

    family.variants.push(model);
    const registered = links.get(family) ?? new Set<string>();
    for (const key of keys) registered.add(key);
    links.set(family, registered);
  }

  const families: ModelFamily[] = [];
  links.forEach((_keys, family) => families.push(family));
  for (const family of families) {
    for (const variant of family.variants) {
      if (isImageTask(variant.task_type)) {
        family.imageVariant ??= variant;
      } else {
        family.textVariant ??= variant;
      }
    }
    const anchor =
      family.textVariant ?? family.imageVariant ?? family.variants[0];
    // Derive the key from the text variant when possible so it does not depend
    // on the order returned by the API.
    family.key = modelFamilyKey(anchor);
    family.name = familyDisplayName(anchor);
  }

  return families;
}

/**
 * Resolve the variant that should run for the current input state. References
 * select the image-to-x variant; no references select the text-to-x variant.
 */
export function pickFamilyVariant(
  family: ModelFamily,
  hasInputs: boolean
): StudioModel | null {
  return hasInputs
    ? (family.imageVariant ?? family.textVariant ?? family.variants[0] ?? null)
    : (family.textVariant ?? family.imageVariant ?? family.variants[0] ?? null);
}

/**
 * Pick a sensible first family for the current input state. With references
 * attached, prefer a family that can consume them; otherwise prefer a family
 * that can generate from text alone.
 */
export function pickDefaultFamily(
  families: ModelFamily[],
  hasInputs: boolean
): ModelFamily | null {
  if (families.length === 0) return null;

  const preferred = families.find((family) =>
    hasInputs ? family.imageVariant !== undefined : family.textVariant !== undefined
  );
  return (
    preferred ??
    families.find((family) => family.imageVariant !== undefined) ??
    families[0]
  );
}

/**
 * Build the synthetic picker entry for a family. The picker works with
 * `StudioModel` values, so the resolved variant supplies task metadata and cost
 * while the family key and cleaned name provide a stable option.
 */
export function familyPickerModel(
  family: ModelFamily,
  hasInputs: boolean
): StudioModel {
  const variant =
    pickFamilyVariant(family, hasInputs) ?? family.variants[0];
  return {
    ...variant,
    id: family.key,
    slug: family.key,
    display_name: family.name,
    task_type: variant.task_type,
  };
}
