# ADR-003: Initial Model Selection

**Status:** Accepted  
**Date:** 2026-10-28  
**Decision makers:** Engineering team  

## Context

The MVP needs one or two real models per task type (text→image, image→image, text→video, image→video) from our supported providers (Replicate and Fal.ai). We need models that are:

1. **Stable** — actively maintained, unlikely to be deprecated soon.
2. **Cost-effective** — reasonable cost for an MVP where users get a credit budget.
3. **High quality** — state-of-the-art or near-SOTA results for their task type.
4. **Webhook-capable** — support asynchronous completion notifications.

## Decision

### Text → Image

| Model | Provider | Slug | Rationale |
|-------|----------|------|-----------|
| FLUX Schnell (BFL) | Replicate | `replicate-flux-schnell` | Very fast (~2s), high quality, widely used, cost-effective (~$0.003/image). Excellent text rendering and prompt adherence. |
| FLUX.1 [schnell] | Fal.ai | `fal-flux-schnell` | Same underlying model via Fal's infrastructure. Provides provider redundancy. |

### Image → Image

| Model | Provider | Slug | Rationale |
|-------|----------|------|-----------|
| FLUX Depth/Canny (BFL) | Replicate | `replicate-flux-depth` | ControlNet-style image-to-image with structural guidance. Good balance of fidelity and editability. |

### Text → Video

| Model | Provider | Slug | Rationale |
|-------|----------|------|-----------|
| MiniMax Video-01 (Hailuo) | Replicate | `replicate-minimax-video` | High-quality cinematic video from text. Strong motion coherence and physical realism. Supports 5s and 10s durations. |
| Kling v2 Standard | Fal.ai | `fal-kling-t2v` | Reliable text-to-video with good prompt adherence. Competitive quality at lower cost. |

### Image → Video

| Model | Provider | Slug | Rationale |
|-------|----------|------|-----------|
| MiniMax Video-01 I2V | Replicate | `replicate-minimax-i2v` | Excellent first-frame conditioning, smooth motion. |
| Kling v2 Standard I2V | Fal.ai | `fal-kling-i2v` | Robust image-to-video with `start_image_url` conditioning. Supports 5s and 10s. |

### Fal.ai tier expansion (migration 0007)

The initial catalog only exposed one Fal.ai option per flow. Migration 0007
adds a budget and a higher-fidelity option for each task type so users can
trade cost against quality without switching providers:

| Task type | Budget option | Mid/high option |
|-----------|---------------|-----------------|
| Text → Image | FLUX.1 [schnell] (`fal-flux-schnell`, 1 credit) | FLUX.1 [dev] (`fal-flux-dev`, 3 credits), FLUX1.1 [pro] (`fal-flux-pro-1-1`, 5 credits) |
| Image → Image | FLUX.1 [dev] remix (`fal-flux-dev-i2i`, 3 credits) | FLUX.1 Kontext [pro] (`fal-flux-kontext-pro`, 5 credits) |
| Text → Video | H3 Max Turbo (`fal-h3-max-turbo-t2v`, 10 credits) | Kling v2 Standard (`fal-kling-t2v`, 20 credits), Kling 2.5 Turbo Pro (`fal-kling-2-5-turbo-t2v`, 40 credits) |
| Image → Video | H3 Max Turbo (`fal-h3-max-turbo-i2v`, 10 credits) | Kling v2 Standard (`fal-kling-i2v`, 20 credits), Kling 2.5 Turbo Pro (`fal-kling-2-5-turbo-i2v`, 40 credits) |

Prices are rounded to whole credits using the same formula as above. The
composer groups every model by provider so these tiers stay easy to scan.

### Replicate tier expansion (migration 0008)

Migration 0008 broadens the Replicate catalog using the models currently
available from the [Try for Free](https://replicate.com/collections/try-for-free)
collection. The collection still links `google/imagen-4`, but that model has
been delisted, so `google/nano-banana` is exposed as the Google image option.

| Task type | Models |
|-----------|--------|
| Text → Image | FLUX 1.1 [pro] (`replicate-flux-1-1-pro`, 4 credits), FLUX.1 [dev] (`replicate-flux-dev`, 3 credits), FLUX.2 [pro] (`replicate-flux-2-pro`, 5 credits), Ideogram 3.0 Turbo (`replicate-ideogram-v3-turbo`, 3 credits), Nano Banana (`replicate-nano-banana`, 4 credits) |
| Image → Image | FLUX.1 Kontext [pro] (`replicate-flux-kontext-pro`, 5 credits), FLUX.2 [pro] edit (`replicate-flux-2-pro-edit`, 5 credits), Nano Banana edit (`replicate-nano-banana-edit`, 4 credits), Topaz Image Upscale (`replicate-image-upscale`, 2 credits), CodeFormer (`replicate-codeformer`, 1 credit), GFPGAN (`replicate-gfpgan`, 1 credit) |

The collection also lists video reframing/upscaling models
(`luma/reframe-video`, `topazlabs/video-upscale`), which are omitted because
the catalog only supports text/image → video, not video → video. MiniMax
Video-01 already covers both video flows.

A few of these models use non-standard input keys. The Replicate adapter maps
FLUX.1 Kontext to `input_image`, FLUX 1.1 [pro] to `image_prompt`, the
controlnet remix to `control_image`, `tencentarc/gfpgan` to `img`,
`black-forest-labs/flux-2-pro` and `google/nano-banana` to their list-style
image fields, and `minimax/video-01` to `first_frame_image` (and
`subject_reference` for reference images). Everything else falls back to the
generic `image` key used by Topaz, CodeFormer, and FLUX.1 [dev].

### Replicate mainstream expansion (migration 0010)

Migration 0010 adds the current mainstream Replicate image and video families,
including both text and image variants so the composer can switch tasks without
changing provider:

| Task type | Models |
|-----------|--------|
| Text → Image | GPT Image 2 (`replicate-gpt-image-2`, 13 credits), Seedream 4.5 (`replicate-seedream-4-5`, 4 credits), Seedream 4.0 (`replicate-seedream-4`, 3 credits), Nano Banana Pro (`replicate-nano-banana-pro`, 15 credits), FLUX.2 Max (`replicate-flux-2-max`, 7 credits) |
| Image → Image | GPT Image 2 edit (`replicate-gpt-image-2-edit`, 13 credits), Seedream 4.5 edit (`replicate-seedream-4-5-edit`, 4 credits), Seedream 4.0 edit (`replicate-seedream-4-edit`, 3 credits), Nano Banana Pro edit (`replicate-nano-banana-pro-edit`, 15 credits), FLUX.2 Max edit (`replicate-flux-2-max-edit`, 8 credits) |
| Text → Video | Seedance 2.5 (`replicate-seedance-2-5`, 116 credits), Seedance 2.0 (`replicate-seedance-2`, 90 credits), Seedance 1.0 Pro (`replicate-seedance-1-pro`, 75 credits), Veo 3.1 (`replicate-veo-3-1`, 320 credits), Veo 3.1 Fast (`replicate-veo-3-1-fast`, 120 credits), Kling 2.6 (`replicate-kling-2-6`, 70 credits), Wan 2.5 (`replicate-wan-2-5`, 50 credits), Hailuo 2.3 (`replicate-hailuo-2-3`, 28 credits) |
| Image → Video | Seedance 2.5 I2V (`replicate-seedance-2-5-i2v`, 116 credits), Seedance 2.0 I2V (`replicate-seedance-2-i2v`, 90 credits), Seedance 1.0 Pro I2V (`replicate-seedance-1-pro-i2v`, 75 credits), Veo 3.1 I2V (`replicate-veo-3-1-i2v`, 320 credits), Veo 3.1 Fast I2V (`replicate-veo-3-1-fast-i2v`, 120 credits), Kling 2.6 I2V (`replicate-kling-2-6-i2v`, 70 credits), Wan 2.5 I2V (`replicate-wan-2-5-i2v`, 50 credits), Hailuo 2.3 I2V (`replicate-hailuo-2-3-i2v`, 28 credits) |

The new models extend the input-key map: GPT Image 2 and FLUX.2 Max use
`input_images`, Seedream and Nano Banana Pro use `image_input`, Seedance and
Veo use `image` for the first frame, Kling 2.6 uses `start_image`, Wan 2.5 I2V
uses `image`, and Hailuo 2.3 uses `first_frame_image`. Seedance and Veo also
map the optional last frame to `last_frame_image` and `last_frame`
respectively.

Seedance 2.5/2.0 and Veo 3.1/3.1 Fast additionally accept a list of reference
images under the `reference_images` key. This slot is mutually exclusive with
the first/last frame pair: a generation request may use either frames or
references, never both. At least one of first frame or reference images is
required. Seedance 2.5 accepts up to 30 references, Seedance 2.0 up to 9, and
Veo 3.1 / 3.1 Fast up to 3.

### Credit pricing formula

Credits are a unitless internal currency. We set 1 credit ≈ \$0.01 USD in provider cost:

| Task type | Typical provider cost | Credits |
|-----------|----------------------|---------|
| text_to_image | \$0.003–\$0.05 | 1–5 |
| image_to_image | \$0.005–\$0.05 | 2–5 |
| text_to_video (5s) | \$0.05–\$0.50 | 10–50 |
| image_to_video (5s) | \$0.05–\$0.50 | 10–50 |

We round up to simple integers for UX clarity and margin.

## Consequences

- FakeProvider models remain enabled only when `ENVIRONMENT != 'production'` (enforced in seed migration).
- New models can be added via a database migration (idempotent upsert) without code changes — only a mapper entry is needed if the model's input schema differs from the default mapping.
- Provider redundancy (same task type across Replicate and Fal) lets us disable one provider during outages.
