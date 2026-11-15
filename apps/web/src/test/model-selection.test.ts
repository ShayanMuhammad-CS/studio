import { describe, expect, it } from "vitest";
import {
  findRelatedModel,
  modelFamilyKey,
  resolveModelSelection,
} from "@/lib/model-selection";
import type { StudioModel } from "@/hooks/use-models";

function model(overrides: Partial<StudioModel> & Pick<StudioModel, "slug">): StudioModel {
  return {
    id: overrides.slug,
    display_name: overrides.slug,
    task_type: "text_to_image",
    provider_id: "replicate",
    input_schema: { type: "object", properties: {} },
    default_params: {},
    cost_credits: "1.00",
    required_input_roles: [],
    ...overrides,
  };
}

const FLUX_TEXT = model({
  slug: "replicate-flux-2-pro",
  display_name: "FLUX.2 Pro (Premium Image)",
  task_type: "text_to_image",
  provider_model: "black-forest-labs/flux-2-pro",
});

const FLUX_EDIT = model({
  slug: "replicate-flux-2-pro-edit",
  display_name: "FLUX.2 Pro Edit (Image to Image)",
  task_type: "image_to_image",
  provider_model: "black-forest-labs/flux-2-pro",
});

const CODEFORMER = model({
  slug: "replicate-codeformer",
  display_name: "CodeFormer (Face Restoration)",
  task_type: "image_to_image",
  provider_model: "sczhou/codeformer",
});

describe("model selection", () => {
  it("keys variants of the same provider model as one family", () => {
    expect(modelFamilyKey(FLUX_TEXT)).toBe(modelFamilyKey(FLUX_EDIT));
    expect(modelFamilyKey(FLUX_TEXT)).not.toBe(modelFamilyKey(CODEFORMER));
  });

  it("finds the same-family variant in another task list", () => {
    expect(findRelatedModel([CODEFORMER, FLUX_EDIT], FLUX_TEXT)?.slug).toBe(
      "replicate-flux-2-pro-edit"
    );
  });

  it("migrates the selection instead of jumping to the first model", () => {
    const resolved = resolveModelSelection([CODEFORMER, FLUX_EDIT], FLUX_TEXT.slug, FLUX_TEXT);

    expect(resolved).toMatchObject({
      migrated: true,
      model: { slug: "replicate-flux-2-pro-edit" },
    });
  });

  it("keeps an existing selection untouched", () => {
    const resolved = resolveModelSelection([CODEFORMER, FLUX_EDIT], CODEFORMER.slug, FLUX_EDIT);

    expect(resolved).toMatchObject({
      migrated: false,
      model: { slug: "replicate-codeformer" },
    });
  });

  it("falls back to the first model when there is no related variant", () => {
    const resolved = resolveModelSelection([CODEFORMER], FLUX_TEXT.slug, FLUX_TEXT);

    expect(resolved).toMatchObject({
      migrated: false,
      model: { slug: "replicate-codeformer" },
    });
  });

  it("derives a family key from the slug when provider_model is absent", () => {
    const text = model({ slug: "replicate-flux-2-pro" });
    const edit = model({ slug: "replicate-flux-2-pro-edit" });

    expect(modelFamilyKey(text)).toBe(modelFamilyKey(edit));
  });

  it("matches slug families when providers use different provider_model paths", () => {
    const text = model({
      slug: "fal-kling-t2v",
      provider_id: "fal",
      provider_model: "fal-ai/kling-video/v2/standard/text-to-video",
    });
    const animate = model({
      slug: "fal-kling-i2v",
      provider_id: "fal",
      provider_model: "fal-ai/kling-video/v2/standard/image-to-video",
    });

    expect(findRelatedModel([animate], text)?.slug).toBe("fal-kling-i2v");
  });
});
