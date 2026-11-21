-- Migration 0010: Add mainstream image and video models from Replicate.
--
-- Image generation / editing:
--   * openai/gpt-image-2              GPT Image 2 (text and edit)
--   * bytedance/seedream-4.5          Seedream 4.5 (text and edit)
--   * bytedance/seedream-4            Seedream 4.0 (text and edit)
--   * google/nano-banana-pro          Nano Banana Pro (text and edit)
--   * black-forest-labs/flux-2-max    FLUX.2 Max (text and edit)
--
-- Video generation:
--   * bytedance/seedance-2.5          Seedance 2.5 (text/image -> video)
--   * bytedance/seedance-2.0          Seedance 2.0 (text/image -> video)
--   * bytedance/seedance-1-pro        Seedance 1.0 Pro (text/image -> video)
--   * google/veo-3.1                  Veo 3.1 (text/image -> video)
--   * google/veo-3.1-fast             Veo 3.1 Fast (text/image -> video)
--   * kwaivgi/kling-v2.6              Kling 2.6 (text/image -> video)
--   * wan-video/wan-2.5-t2v           Wan 2.5 (text -> video)
--   * wan-video/wan-2.5-i2v           Wan 2.5 (image -> video)
--   * minimax/hailuo-2.3              Hailuo 2.3 (text/image -> video)
--
-- cost_credits follows ADR-003: 1 credit ~= $0.01 USD of provider cost, based
-- on each model's default resolution/quality/duration settings at the time of
-- writing, rounded to whole credits for UX clarity.
--
-- Idempotent: ON CONFLICT ... DO UPDATE keeps re-runs safe.

-- ═══════════════════════════════════════════════════════════════════════════
-- TEXT → IMAGE
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.models (
  provider_id, provider_model, slug, display_name, task_type,
  input_schema, default_params, cost_credits, enabled
) VALUES
  (
    'replicate',
    'openai/gpt-image-2',
    'replicate-gpt-image-2',
    'GPT Image 2 (Text to Image)',
    'text_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "aspect_ratio": {
          "type": "string",
          "enum": ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "auto", "1024x1024", "1536x1024", "1024x1536", "1536x1152", "1152x1536", "2048x2048", "2048x1152", "1152x2048", "3840x2160", "2160x3840"],
          "default": "1:1"
        },
        "quality": {
          "type": "string",
          "enum": ["low", "medium", "high", "auto"],
          "default": "auto"
        },
        "background": {
          "type": "string",
          "enum": ["auto", "opaque"],
          "default": "auto"
        },
        "moderation": {
          "type": "string",
          "enum": ["auto", "low"],
          "default": "auto"
        },
        "number_of_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 1
        },
        "output_format": {
          "type": "string",
          "enum": ["webp", "png", "jpeg"],
          "default": "webp"
        },
        "output_compression": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "default": 90
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"aspect_ratio": "1:1", "quality": "auto", "background": "auto", "moderation": "auto", "number_of_images": 1, "output_format": "webp", "output_compression": 90}'::jsonb,
    13.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedream-4.5',
    'replicate-seedream-4-5',
    'Seedream 4.5 (Text to Image)',
    'text_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "size": {
          "type": "string",
          "enum": ["2K", "4K", "custom"],
          "default": "2K"
        },
        "width": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "4:3", "3:4", "4:5", "5:4", "16:9", "9:16", "3:2", "2:3", "21:9", "9:21"],
          "default": "1:1"
        },
        "max_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 15,
          "default": 1
        },
        "disable_safety_checker": {
          "type": "boolean",
          "default": false
        },
        "sequential_image_generation": {
          "type": "string",
          "enum": ["disabled", "auto"],
          "default": "disabled"
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"size": "2K", "aspect_ratio": "1:1", "max_images": 1, "disable_safety_checker": false, "sequential_image_generation": "disabled"}'::jsonb,
    4.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedream-4',
    'replicate-seedream-4',
    'Seedream 4.0 (Text to Image)',
    'text_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "size": {
          "type": "string",
          "enum": ["1K", "2K", "4K", "custom"],
          "default": "2K"
        },
        "width": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
          "default": "1:1"
        },
        "max_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 15,
          "default": 1
        },
        "enhance_prompt": {
          "type": "boolean",
          "default": true
        },
        "sequential_image_generation": {
          "type": "string",
          "enum": ["disabled", "auto"],
          "default": "disabled"
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"size": "2K", "aspect_ratio": "1:1", "max_images": 1, "enhance_prompt": true, "sequential_image_generation": "disabled"}'::jsonb,
    3.00,
    true
  ),
  (
    'replicate',
    'google/nano-banana-pro',
    'replicate-nano-banana-pro',
    'Google Nano Banana Pro (Text to Image)',
    'text_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "resolution": {
          "type": "string",
          "enum": ["1K", "2K", "4K"],
          "default": "2K"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
          "default": "1:1"
        },
        "output_format": {
          "type": "string",
          "enum": ["jpg", "png"],
          "default": "jpg"
        },
        "safety_filter_level": {
          "type": "string",
          "enum": ["block_low_and_above", "block_medium_and_above", "block_only_high"],
          "default": "block_only_high"
        },
        "allow_fallback_model": {
          "type": "boolean",
          "default": false
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"resolution": "2K", "aspect_ratio": "1:1", "output_format": "jpg", "safety_filter_level": "block_only_high", "allow_fallback_model": false}'::jsonb,
    15.00,
    true
  ),
  (
    'replicate',
    'black-forest-labs/flux-2-max',
    'replicate-flux-2-max',
    'FLUX.2 Max (Premium Image)',
    'text_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "custom", "1:1", "16:9", "3:2", "2:3", "4:5", "5:4", "9:16", "3:4", "4:3"],
          "default": "1:1"
        },
        "resolution": {
          "type": "string",
          "enum": ["match_input_image", "0.5 MP", "1 MP", "2 MP", "4 MP"],
          "default": "1 MP"
        },
        "width": {
          "type": "integer",
          "minimum": 256,
          "maximum": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 256,
          "maximum": 2048
        },
        "output_format": {
          "type": "string",
          "enum": ["webp", "jpg", "png"],
          "default": "webp"
        },
        "output_quality": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "default": 80
        },
        "safety_tolerance": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5,
          "default": 2
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"aspect_ratio": "1:1", "resolution": "1 MP", "output_format": "webp", "output_quality": 80, "safety_tolerance": 2}'::jsonb,
    7.00,
    true
  )
ON CONFLICT (provider_id, provider_model, task_type) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  input_schema = EXCLUDED.input_schema,
  default_params = EXCLUDED.default_params,
  cost_credits = EXCLUDED.cost_credits,
  enabled = EXCLUDED.enabled;

-- ═══════════════════════════════════════════════════════════════════════════
-- IMAGE → IMAGE
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.models (
  provider_id, provider_model, slug, display_name, task_type,
  input_schema, default_params, cost_credits, enabled
) VALUES
  (
    'replicate',
    'openai/gpt-image-2',
    'replicate-gpt-image-2-edit',
    'GPT Image 2 (Image Edit)',
    'image_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "aspect_ratio": {
          "type": "string",
          "enum": ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "auto", "1024x1024", "1536x1024", "1024x1536", "1536x1152", "1152x1536", "2048x2048", "2048x1152", "1152x2048", "3840x2160", "2160x3840"],
          "default": "1:1"
        },
        "quality": {
          "type": "string",
          "enum": ["low", "medium", "high", "auto"],
          "default": "auto"
        },
        "background": {
          "type": "string",
          "enum": ["auto", "opaque"],
          "default": "auto"
        },
        "moderation": {
          "type": "string",
          "enum": ["auto", "low"],
          "default": "auto"
        },
        "number_of_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 1
        },
        "output_format": {
          "type": "string",
          "enum": ["webp", "png", "jpeg"],
          "default": "webp"
        },
        "output_compression": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "default": 90
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"aspect_ratio": "1:1", "quality": "auto", "background": "auto", "moderation": "auto", "number_of_images": 1, "output_format": "webp", "output_compression": 90}'::jsonb,
    13.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedream-4.5',
    'replicate-seedream-4-5-edit',
    'Seedream 4.5 (Image Edit)',
    'image_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "size": {
          "type": "string",
          "enum": ["2K", "4K", "custom"],
          "default": "2K"
        },
        "width": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "4:3", "3:4", "4:5", "5:4", "16:9", "9:16", "3:2", "2:3", "21:9", "9:21"],
          "default": "match_input_image"
        },
        "max_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 15,
          "default": 1
        },
        "disable_safety_checker": {
          "type": "boolean",
          "default": false
        },
        "sequential_image_generation": {
          "type": "string",
          "enum": ["disabled", "auto"],
          "default": "disabled"
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"size": "2K", "aspect_ratio": "match_input_image", "max_images": 1, "disable_safety_checker": false, "sequential_image_generation": "disabled"}'::jsonb,
    4.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedream-4',
    'replicate-seedream-4-edit',
    'Seedream 4.0 (Image Edit)',
    'image_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "size": {
          "type": "string",
          "enum": ["1K", "2K", "4K", "custom"],
          "default": "2K"
        },
        "width": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 1024,
          "maximum": 4096,
          "default": 2048
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "3:4", "4:3", "16:9", "9:16", "3:2", "2:3", "21:9"],
          "default": "match_input_image"
        },
        "max_images": {
          "type": "integer",
          "minimum": 1,
          "maximum": 15,
          "default": 1
        },
        "enhance_prompt": {
          "type": "boolean",
          "default": true
        },
        "sequential_image_generation": {
          "type": "string",
          "enum": ["disabled", "auto"],
          "default": "disabled"
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"size": "2K", "aspect_ratio": "match_input_image", "max_images": 1, "enhance_prompt": true, "sequential_image_generation": "disabled"}'::jsonb,
    3.00,
    true
  ),
  (
    'replicate',
    'google/nano-banana-pro',
    'replicate-nano-banana-pro-edit',
    'Google Nano Banana Pro (Image Edit)',
    'image_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "resolution": {
          "type": "string",
          "enum": ["1K", "2K", "4K"],
          "default": "2K"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
          "default": "match_input_image"
        },
        "output_format": {
          "type": "string",
          "enum": ["jpg", "png"],
          "default": "jpg"
        },
        "safety_filter_level": {
          "type": "string",
          "enum": ["block_low_and_above", "block_medium_and_above", "block_only_high"],
          "default": "block_only_high"
        },
        "allow_fallback_model": {
          "type": "boolean",
          "default": false
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"resolution": "2K", "aspect_ratio": "match_input_image", "output_format": "jpg", "safety_filter_level": "block_only_high", "allow_fallback_model": false}'::jsonb,
    15.00,
    true
  ),
  (
    'replicate',
    'black-forest-labs/flux-2-max',
    'replicate-flux-2-max-edit',
    'FLUX.2 Max Edit (Image to Image)',
    'image_to_image',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "aspect_ratio": {
          "type": "string",
          "enum": ["match_input_image", "custom", "1:1", "16:9", "3:2", "2:3", "4:5", "5:4", "9:16", "3:4", "4:3"],
          "default": "match_input_image"
        },
        "resolution": {
          "type": "string",
          "enum": ["match_input_image", "0.5 MP", "1 MP", "2 MP", "4 MP"],
          "default": "match_input_image"
        },
        "width": {
          "type": "integer",
          "minimum": 256,
          "maximum": 2048
        },
        "height": {
          "type": "integer",
          "minimum": 256,
          "maximum": 2048
        },
        "output_format": {
          "type": "string",
          "enum": ["webp", "jpg", "png"],
          "default": "webp"
        },
        "output_quality": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "default": 80
        },
        "safety_tolerance": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5,
          "default": 2
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"aspect_ratio": "match_input_image", "resolution": "match_input_image", "output_format": "webp", "output_quality": 80, "safety_tolerance": 2}'::jsonb,
    8.00,
    true
  )
ON CONFLICT (provider_id, provider_model, task_type) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  input_schema = EXCLUDED.input_schema,
  default_params = EXCLUDED.default_params,
  cost_credits = EXCLUDED.cost_credits,
  enabled = EXCLUDED.enabled;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEXT → VIDEO
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.models (
  provider_id, provider_model, slug, display_name, task_type,
  input_schema, default_params, cost_credits, enabled
) VALUES
  (
    'replicate',
    'bytedance/seedance-2.5',
    'replicate-seedance-2-5',
    'Seedance 2.5 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "minimum": -1,
          "maximum": 30,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p"],
          "default": "720p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
          "default": "16:9"
        },
        "output_format": {
          "type": "string",
          "enum": ["mp4", "mov"],
          "default": "mp4"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "watermark": {
          "type": "boolean",
          "default": false
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "resolution": "720p", "aspect_ratio": "16:9", "output_format": "mp4", "generate_audio": true, "watermark": false}'::jsonb,
    116.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedance-2.0',
    'replicate-seedance-2',
    'Seedance 2.0 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "minimum": -1,
          "maximum": 15,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p", "1080p", "4k"],
          "default": "720p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21", "adaptive"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "resolution": "720p", "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    90.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedance-1-pro',
    'replicate-seedance-1-pro',
    'Seedance 1.0 Pro (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "fps": {
          "type": "integer",
          "enum": [24],
          "default": 24
        },
        "duration": {
          "type": "integer",
          "minimum": 2,
          "maximum": 12,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
          "default": "16:9"
        },
        "camera_fixed": {
          "type": "boolean",
          "default": false
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"fps": 24, "duration": 5, "resolution": "1080p", "aspect_ratio": "16:9", "camera_fixed": false}'::jsonb,
    75.00,
    true
  ),
  (
    'replicate',
    'google/veo-3.1',
    'replicate-veo-3-1',
    'Google Veo 3.1 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [4, 6, 8],
          "default": 8
        },
        "resolution": {
          "type": "string",
          "enum": ["720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 8, "resolution": "1080p", "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    320.00,
    true
  ),
  (
    'replicate',
    'google/veo-3.1-fast',
    'replicate-veo-3-1-fast',
    'Google Veo 3.1 Fast (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [4, 6, 8],
          "default": 8
        },
        "resolution": {
          "type": "string",
          "enum": ["720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 8, "resolution": "1080p", "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    120.00,
    true
  ),
  (
    'replicate',
    'kwaivgi/kling-v2.6',
    'replicate-kling-2-6',
    'Kling 2.6 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [5, 10],
          "default": 5
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16", "1:1"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    70.00,
    true
  ),
  (
    'replicate',
    'wan-video/wan-2.5-t2v',
    'replicate-wan-2-5',
    'Wan 2.5 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "size": {
          "type": "string",
          "enum": ["832*480", "480*832", "1280*720", "720*1280", "1920*1080", "1080*1920"],
          "default": "1280*720"
        },
        "duration": {
          "type": "integer",
          "enum": [5, 10],
          "default": 5
        },
        "enable_prompt_expansion": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"size": "1280*720", "duration": 5, "enable_prompt_expansion": true}'::jsonb,
    50.00,
    true
  ),
  (
    'replicate',
    'minimax/hailuo-2.3',
    'replicate-hailuo-2-3',
    'Hailuo 2.3 (Text to Video)',
    'text_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [6, 10],
          "default": 6
        },
        "resolution": {
          "type": "string",
          "enum": ["768p", "1080p"],
          "default": "768p"
        },
        "prompt_optimizer": {
          "type": "boolean",
          "default": true
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 6, "resolution": "768p", "prompt_optimizer": true}'::jsonb,
    28.00,
    true
  )
ON CONFLICT (provider_id, provider_model, task_type) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  input_schema = EXCLUDED.input_schema,
  default_params = EXCLUDED.default_params,
  cost_credits = EXCLUDED.cost_credits,
  enabled = EXCLUDED.enabled;

-- ═══════════════════════════════════════════════════════════════════════════
-- IMAGE → VIDEO
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.models (
  provider_id, provider_model, slug, display_name, task_type,
  input_schema, default_params, cost_credits, enabled
) VALUES
  (
    'replicate',
    'bytedance/seedance-2.5',
    'replicate-seedance-2-5-i2v',
    'Seedance 2.5 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "minimum": -1,
          "maximum": 30,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p"],
          "default": "720p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
          "default": "adaptive"
        },
        "output_format": {
          "type": "string",
          "enum": ["mp4", "mov"],
          "default": "mp4"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "watermark": {
          "type": "boolean",
          "default": false
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "resolution": "720p", "aspect_ratio": "adaptive", "output_format": "mp4", "generate_audio": true, "watermark": false}'::jsonb,
    116.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedance-2.0',
    'replicate-seedance-2-i2v',
    'Seedance 2.0 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "minimum": -1,
          "maximum": 15,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p", "1080p", "4k"],
          "default": "720p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21", "adaptive"],
          "default": "adaptive"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "resolution": "720p", "aspect_ratio": "adaptive", "generate_audio": true}'::jsonb,
    90.00,
    true
  ),
  (
    'replicate',
    'bytedance/seedance-1-pro',
    'replicate-seedance-1-pro-i2v',
    'Seedance 1.0 Pro (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "fps": {
          "type": "integer",
          "enum": [24],
          "default": 24
        },
        "duration": {
          "type": "integer",
          "minimum": 2,
          "maximum": 12,
          "default": 5
        },
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
          "default": "16:9"
        },
        "camera_fixed": {
          "type": "boolean",
          "default": false
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"fps": 24, "duration": 5, "resolution": "1080p", "aspect_ratio": "16:9", "camera_fixed": false}'::jsonb,
    75.00,
    true
  ),
  (
    'replicate',
    'google/veo-3.1',
    'replicate-veo-3-1-i2v',
    'Google Veo 3.1 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [4, 6, 8],
          "default": 8
        },
        "resolution": {
          "type": "string",
          "enum": ["720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 8, "resolution": "1080p", "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    320.00,
    true
  ),
  (
    'replicate',
    'google/veo-3.1-fast',
    'replicate-veo-3-1-fast-i2v',
    'Google Veo 3.1 Fast (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [4, 6, 8],
          "default": 8
        },
        "resolution": {
          "type": "string",
          "enum": ["720p", "1080p"],
          "default": "1080p"
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 8, "resolution": "1080p", "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    120.00,
    true
  ),
  (
    'replicate',
    'kwaivgi/kling-v2.6',
    'replicate-kling-2-6-i2v',
    'Kling 2.6 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [5, 10],
          "default": 5
        },
        "aspect_ratio": {
          "type": "string",
          "enum": ["16:9", "9:16", "1:1"],
          "default": "16:9"
        },
        "generate_audio": {
          "type": "boolean",
          "default": true
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 5, "aspect_ratio": "16:9", "generate_audio": true}'::jsonb,
    70.00,
    true
  ),
  (
    'replicate',
    'wan-video/wan-2.5-i2v',
    'replicate-wan-2-5-i2v',
    'Wan 2.5 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "resolution": {
          "type": "string",
          "enum": ["480p", "720p", "1080p"],
          "default": "720p"
        },
        "duration": {
          "type": "integer",
          "enum": [5, 10],
          "default": 5
        },
        "enable_prompt_expansion": {
          "type": "boolean",
          "default": true
        },
        "seed": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"resolution": "720p", "duration": 5, "enable_prompt_expansion": true}'::jsonb,
    50.00,
    true
  ),
  (
    'replicate',
    'minimax/hailuo-2.3',
    'replicate-hailuo-2-3-i2v',
    'Hailuo 2.3 (Image to Video)',
    'image_to_video',
    '{
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "duration": {
          "type": "integer",
          "enum": [6, 10],
          "default": 6
        },
        "resolution": {
          "type": "string",
          "enum": ["768p", "1080p"],
          "default": "768p"
        },
        "prompt_optimizer": {
          "type": "boolean",
          "default": true
        }
      },
      "additionalProperties": false
    }'::jsonb,
    '{"duration": 6, "resolution": "768p", "prompt_optimizer": true}'::jsonb,
    28.00,
    true
  )
ON CONFLICT (provider_id, provider_model, task_type) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  input_schema = EXCLUDED.input_schema,
  default_params = EXCLUDED.default_params,
  cost_credits = EXCLUDED.cost_credits,
  enabled = EXCLUDED.enabled;
