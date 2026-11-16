import { describe, expect, it } from "vitest";
import {
  familyPickerModel,
  groupModelFamilies,
  modelFamilyKey,
  pickDefaultFamily,
  pickFamilyVariant,
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
  cost_credits: "5.00",
});

const FLUX_EDIT = model({
  slug: "replicate-flux-2-pro-edit",
  display_name: "FLUX.2 Pro Edit (Image to Image)",
  task_type: "image_to_image",
  provider_model: "black-forest-labs/flux-2-pro",
  cost_credits: "7.00",
});

const CODEFORMER = model({
  slug: "replicate-codeformer",
  display_name: "CodeFormer (Face Restoration)",
  task_type: "image_to_image",
  provider_model: "sczhou/codeformer",
});

const KLING_TEXT = model({
  slug: "fal-kling-t2v",
  display_name: "Kling v2 (Text to Video)",
  task_type: "text_to_video",
  provider_id: "fal",
  provider_model: "fal-ai/kling-video/v2/standard/text-to-video",
});

const KLING_IMAGE = model({
  slug: "fal-kling-i2v",
  display_name: "Kling v2 (Animate Image)",
  task_type: "image_to_video",
  provider_id: "fal",
  provider_model: "fal-ai/kling-video/v2/standard/image-to-video",
});

const IMAGEN_TEXT = model({
  slug: "google-imagen-3",
  display_name: "Google Imagen 3 (High Quality)",
  task_type: "text_to_image",
  provider_id: "google",
  provider_model: "imagen-3.0-generate-002",
});

const IMAGEN_EDIT = model({
  slug: "google-imagen-3-remix",
  display_name: "Google Imagen 3 (Image Remix)",
  task_type: "image_to_image",
  provider_id: "google",
  provider_model: "imagen-3.0-generate-002",
});

describe("model selection", () => {
  it("keys variants of the same provider model as one family", () => {
    expect(modelFamilyKey(FLUX_TEXT)).toBe(modelFamilyKey(FLUX_EDIT));
    expect(modelFamilyKey(FLUX_TEXT)).not.toBe(modelFamilyKey(CODEFORMER));
  });

  it("groups task variants into one family", () => {
    const families = groupModelFamilies([FLUX_TEXT, FLUX_EDIT, CODEFORMER]);

    expect(families).toHaveLength(2);
    const flux = families.find((family) =>
      family.variants.some((variant) => variant.slug === FLUX_TEXT.slug)
    );

    expect(flux?.variants.map((variant) => variant.slug)).toEqual([
      "replicate-flux-2-pro",
      "replicate-flux-2-pro-edit",
    ]);
    expect(flux?.textVariant?.slug).toBe("replicate-flux-2-pro");
    expect(flux?.imageVariant?.slug).toBe("replicate-flux-2-pro-edit");
    expect(flux?.name).toBe("FLUX.2 Pro");
  });

  it("groups variants when providers use different provider_model paths", () => {
    const families = groupModelFamilies([KLING_TEXT, KLING_IMAGE]);

    expect(families).toHaveLength(1);
    expect(families[0].textVariant?.slug).toBe("fal-kling-t2v");
    expect(families[0].imageVariant?.slug).toBe("fal-kling-i2v");
    expect(families[0].name).toBe("Kling v2");
  });

  it("keeps a stable family key regardless of catalog order", () => {
    const forward = groupModelFamilies([KLING_TEXT, KLING_IMAGE])[0];
    const reverse = groupModelFamilies([KLING_IMAGE, KLING_TEXT])[0];

    expect(forward.key).toBe(reverse.key);
    expect(forward.key).toBe(modelFamilyKey(KLING_TEXT));
  });

  it("groups variants that share a provider model but not a slug", () => {
    const families = groupModelFamilies([IMAGEN_TEXT, IMAGEN_EDIT]);

    expect(families).toHaveLength(1);
    expect(families[0].variants).toHaveLength(2);
    expect(families[0].name).toBe("Google Imagen 3");
  });

  it("derives a family key from the slug when provider_model is absent", () => {
    const text = model({ slug: "replicate-flux-2-pro" });
    const edit = model({ slug: "replicate-flux-2-pro-edit" });

    expect(modelFamilyKey(text)).toBe(modelFamilyKey(edit));
    expect(groupModelFamilies([text, edit])).toHaveLength(1);
  });

  it("resolves the text variant when no references are attached", () => {
    const [flux] = groupModelFamilies([FLUX_TEXT, FLUX_EDIT]);

    expect(pickFamilyVariant(flux, false)?.slug).toBe("replicate-flux-2-pro");
  });

  it("resolves the image variant when references are attached", () => {
    const [flux] = groupModelFamilies([FLUX_TEXT, FLUX_EDIT]);

    expect(pickFamilyVariant(flux, true)?.slug).toBe("replicate-flux-2-pro-edit");
  });

  it("falls back to the only variant when the preferred kind is missing", () => {
    const [codeformer] = groupModelFamilies([CODEFORMER]);

    expect(pickFamilyVariant(codeformer, false)?.slug).toBe("replicate-codeformer");
    expect(pickFamilyVariant(codeformer, true)?.slug).toBe("replicate-codeformer");
  });

  it("defaults to a text-capable family when no references are attached", () => {
    const families = groupModelFamilies([FLUX_TEXT, FLUX_EDIT, CODEFORMER]);

    expect(pickDefaultFamily(families, false)?.textVariant?.slug).toBe(
      "replicate-flux-2-pro"
    );
  });

  it("defaults to a reference-capable family when references are attached", () => {
    const referenceOnly = model({
      slug: "replicate-codeformer",
      task_type: "image_to_image",
      provider_model: "sczhou/codeformer",
    });
    const families = groupModelFamilies([FLUX_TEXT, referenceOnly]);

    expect(pickDefaultFamily(families, true)?.imageVariant?.slug).toBe(
      "replicate-codeformer"
    );
  });

  it("builds a picker entry keyed by family with a cleaned name", () => {
    const [flux] = groupModelFamilies([FLUX_TEXT, FLUX_EDIT]);

    const withoutRefs = familyPickerModel(flux, false);
    const withRefs = familyPickerModel(flux, true);

    expect(withoutRefs.slug).toBe(flux.key);
    expect(withoutRefs.display_name).toBe("FLUX.2 Pro");
    expect(withoutRefs.cost_credits).toBe("5.00");
    expect(withRefs.cost_credits).toBe("7.00");
  });
});
