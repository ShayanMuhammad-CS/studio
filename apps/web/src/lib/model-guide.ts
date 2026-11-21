import type { StudioModel, TaskType } from "@/hooks/use-models";

/**
 * Editorial guidance for the model catalog.
 *
 * The model registry only knows slugs, task types, and prices. This file adds
 * the human layer — what each model is good at, how fast it feels, and how
 * premium it is — so users can pick a model without understanding the
 * provider landscape. Prices stay live in the registry and are never stored
 * here.
 */

export type ModelSpeed = "fast" | "balanced" | "slow";
export type QualityTier = 1 | 2 | 3;

export interface ModelGuideEntry {
  /** One sentence describing the model's strength. */
  summary: string;
  /** Short use-case tags rendered as chips. */
  bestFor: string[];
  speed: ModelSpeed;
  /** 1 = draft, 2 = balanced, 3 = premium. */
  qualityTier: QualityTier;
  /** Optional practical advice shown in the comparison row. */
  tip?: string;
}

export const SPEED_LABELS: Record<ModelSpeed, string> = {
  fast: "Fast",
  balanced: "Balanced",
  slow: "Slow",
};

export const SPEED_RANK: Record<ModelSpeed, number> = {
  fast: 0,
  balanced: 1,
  slow: 2,
};

export const QUALITY_LABELS: Record<QualityTier, string> = {
  1: "Draft",
  2: "Balanced",
  3: "Premium",
};

/** Used for models added to the registry before they have editorial copy. */
export const FALLBACK_GUIDE_ENTRY: ModelGuideEntry = {
  summary: "Available in the model registry. No editorial notes yet.",
  bestFor: ["General use"],
  speed: "balanced",
  qualityTier: 2,
};

export function guideEntryFor(slug: string): ModelGuideEntry {
  return MODEL_GUIDE[slug] ?? FALLBACK_GUIDE_ENTRY;
}

export const MODEL_GUIDE: Record<string, ModelGuideEntry> = {
  // ── Text → Image ─────────────────────────────────────────────────────────
  "replicate-flux-schnell": {
    summary: "The fastest, cheapest way to explore prompt ideas.",
    bestFor: ["Rapid drafts", "Style exploration", "Bulk variations"],
    speed: "fast",
    qualityTier: 1,
    tip: "At 1 credit, run several prompts before committing to a premium model.",
  },
  "fal-flux-schnell": {
    summary: "FLUX Schnell speed and price on Fal.ai infrastructure.",
    bestFor: ["Rapid drafts", "Provider redundancy"],
    speed: "fast",
    qualityTier: 1,
  },
  "google-imagen-3": {
    summary: "Clean, natural-looking images with strong prompt understanding.",
    bestFor: ["Photoreal stills", "Product shots"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-flux-dev": {
    summary: "Balanced quality and speed for everyday images.",
    bestFor: ["General purpose", "Iteration"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-flux-pro-1-1": {
    summary: "High-fidelity stills with crisp, reliable detail.",
    bestFor: ["Hero images", "Print-ready detail"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-flux-1-1-pro": {
    summary: "High-fidelity stills with crisp, reliable detail.",
    bestFor: ["Hero images", "Marketing visuals"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-flux-dev": {
    summary: "Balanced FLUX quality at a mid-tier price.",
    bestFor: ["General purpose", "Concept art"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-flux-2-pro": {
    summary: "Premium FLUX generation with richer detail and depth.",
    bestFor: ["Photoreal", "Detailed scenes"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-ideogram-v3-turbo": {
    summary: "Best-in-class text rendering and graphic design.",
    bestFor: ["Logos", "Posters", "Text in image"],
    speed: "fast",
    qualityTier: 2,
    tip: "Pick this whenever the image must contain readable words.",
  },
  "replicate-nano-banana": {
    summary: "Fast, versatile Google image generation.",
    bestFor: ["Everyday images", "Quick concepts"],
    speed: "fast",
    qualityTier: 2,
  },
  "replicate-gpt-image-2": {
    summary: "Strong prompt adherence and unusually readable text.",
    bestFor: ["Complex prompts", "Infographics", "Accurate layouts"],
    speed: "slow",
    qualityTier: 3,
    tip: "Premium price — reserve it for prompts other models misread.",
  },
  "replicate-seedream-4-5": {
    summary: "Detailed, style-flexible images at a low price.",
    bestFor: ["Stylized art", "Character art"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-seedream-4": {
    summary: "Cheap, reliable generation for everyday use.",
    bestFor: ["Drafts", "Social visuals"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-nano-banana-pro": {
    summary: "Google's premium image model for detail and text.",
    bestFor: ["Premium stills", "Text-heavy scenes"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-flux-2-max": {
    summary: "Top-end FLUX quality for final assets.",
    bestFor: ["Final renders", "Fine detail"],
    speed: "slow",
    qualityTier: 3,
  },

  // ── Image → Image ────────────────────────────────────────────────────────
  "replicate-flux-depth": {
    summary: "Structural remix guided by the source image's depth.",
    bestFor: ["Pose-preserving remix", "Style transfer"],
    speed: "balanced",
    qualityTier: 2,
  },
  "google-imagen-3-remix": {
    summary: "Remix an image with Google Imagen quality.",
    bestFor: ["Stylized edits", "Photoreal remix"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-flux-dev-i2i": {
    summary: "Affordable image-to-image remixing.",
    bestFor: ["Quick edits", "Style changes"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-flux-kontext-pro": {
    summary: "Instruction-based edits that keep the subject intact.",
    bestFor: ["Targeted edits", "Restyling"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-flux-kontext-pro": {
    summary: "Instruction-based edits that keep the subject intact.",
    bestFor: ["Targeted edits", "Object swaps", "Restyling"],
    speed: "balanced",
    qualityTier: 3,
    tip: "Describe only the change you want; Kontext preserves everything else.",
  },
  "replicate-flux-2-pro-edit": {
    summary: "Premium FLUX editing with strong detail retention.",
    bestFor: ["High-end edits", "Product retouching"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-nano-banana-edit": {
    summary: "Fast, flexible edits with good subject consistency.",
    bestFor: ["Character edits", "Background swaps"],
    speed: "fast",
    qualityTier: 2,
  },
  "replicate-image-upscale": {
    summary: "Upscale and sharpen without regenerating the image.",
    bestFor: ["Upscaling", "Detail recovery"],
    speed: "fast",
    qualityTier: 2,
    tip: "The cheapest way to make a draft usable at higher resolution.",
  },
  "replicate-codeformer": {
    summary: "Restore faces in old or degraded photos.",
    bestFor: ["Face restoration", "Old photos"],
    speed: "fast",
    qualityTier: 1,
  },
  "replicate-gfpgan": {
    summary: "Fast face enhancement for blurry portraits.",
    bestFor: ["Portraits", "Face cleanup"],
    speed: "fast",
    qualityTier: 1,
  },
  "replicate-gpt-image-2-edit": {
    summary: "Precise, text-aware image edits.",
    bestFor: ["Text edits", "Layout changes"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-seedream-4-5-edit": {
    summary: "Detailed, style-flexible edits at a low price.",
    bestFor: ["Stylized edits", "Character consistency"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-seedream-4-edit": {
    summary: "Cheap, reliable image edits.",
    bestFor: ["Quick edits", "Social variants"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-nano-banana-pro-edit": {
    summary: "Premium edits with strong consistency and text handling.",
    bestFor: ["Premium retouching", "Text replacement"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-flux-2-max-edit": {
    summary: "Top-end FLUX editing for final assets.",
    bestFor: ["Final edits", "Fine detail"],
    speed: "slow",
    qualityTier: 3,
  },

  // ── Text → Video ─────────────────────────────────────────────────────────
  "replicate-minimax-video": {
    summary: "Cinematic motion with strong physical realism.",
    bestFor: ["Cinematic clips", "Realistic motion"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-kling-t2v": {
    summary: "Reliable text-to-video with good prompt adherence.",
    bestFor: ["General video", "Product motion"],
    speed: "balanced",
    qualityTier: 2,
  },
  "google-veo-2": {
    summary: "Google's video model with smooth, coherent motion.",
    bestFor: ["Cinematic clips", "Nature shots"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-h3-max-turbo-t2v": {
    summary: "The cheapest way to test a video prompt.",
    bestFor: ["Motion tests", "Social loops"],
    speed: "fast",
    qualityTier: 1,
    tip: "Validate timing and framing here before paying for Veo or Seedance.",
  },
  "fal-kling-2-5-turbo-t2v": {
    summary: "High-fidelity Kling video at a mid-premium price.",
    bestFor: ["Detailed motion", "Camera moves"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-seedance-2-5": {
    summary: "Top-tier cinematic video generation.",
    bestFor: ["Hero clips", "Complex motion"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-seedance-2": {
    summary: "High-quality video with strong temporal coherence.",
    bestFor: ["Cinematic scenes", "Multi-subject motion"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-seedance-1-pro": {
    summary: "Reliable premium video for polished clips.",
    bestFor: ["Brand video", "Detailed scenes"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-veo-3-1": {
    summary: "Best-in-class video quality and prompt fidelity.",
    bestFor: ["Hero footage", "Film-like scenes"],
    speed: "slow",
    qualityTier: 3,
    tip: "The most expensive option — storyboard first, then generate the final shot.",
  },
  "replicate-veo-3-1-fast": {
    summary: "Near-Veo quality at a fraction of the cost.",
    bestFor: ["Cinematic clips", "Client previews"],
    speed: "balanced",
    qualityTier: 3,
    tip: "Start here; move to full Veo 3.1 only for the final take.",
  },
  "replicate-kling-2-6": {
    summary: "Strong motion and subject consistency.",
    bestFor: ["Character motion", "Action shots"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-wan-2-5": {
    summary: "Balanced video quality at a mid price.",
    bestFor: ["General video", "Experiments"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-hailuo-2-3": {
    summary: "Affordable cinematic motion.",
    bestFor: ["Budget clips", "Social video"],
    speed: "balanced",
    qualityTier: 2,
  },

  // ── Image → Video ────────────────────────────────────────────────────────
  "replicate-minimax-i2v": {
    summary: "Smooth, realistic motion from a still image.",
    bestFor: ["Cinematic animation", "Realistic motion"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-kling-i2v": {
    summary: "Reliable image animation with good prompt adherence.",
    bestFor: ["General animation", "Product spins"],
    speed: "balanced",
    qualityTier: 2,
  },
  "google-veo-2-i2v": {
    summary: "Coherent motion from a single first frame.",
    bestFor: ["Cinematic animation", "Nature scenes"],
    speed: "balanced",
    qualityTier: 2,
  },
  "fal-h3-max-turbo-i2v": {
    summary: "The cheapest way to animate a still.",
    bestFor: ["Motion tests", "Quick loops"],
    speed: "fast",
    qualityTier: 1,
  },
  "fal-kling-2-5-turbo-i2v": {
    summary: "High-fidelity animation at a mid-premium price.",
    bestFor: ["Detailed motion", "Camera moves"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-seedance-2-5-i2v": {
    summary: "Top-tier animation from a single frame.",
    bestFor: ["Hero clips", "Complex motion"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-seedance-2-i2v": {
    summary: "High-quality animation with strong coherence.",
    bestFor: ["Cinematic animation", "Character motion"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-seedance-1-pro-i2v": {
    summary: "Reliable premium animation for polished clips.",
    bestFor: ["Brand video", "Detailed scenes"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-veo-3-1-i2v": {
    summary: "Best-in-class animation and prompt fidelity.",
    bestFor: ["Hero footage", "Film-like scenes"],
    speed: "slow",
    qualityTier: 3,
  },
  "replicate-veo-3-1-fast-i2v": {
    summary: "Near-Veo animation quality at lower cost.",
    bestFor: ["Cinematic animation", "Client previews"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-kling-2-6-i2v": {
    summary: "Strong subject consistency from a still image.",
    bestFor: ["Character animation", "Action shots"],
    speed: "balanced",
    qualityTier: 3,
  },
  "replicate-wan-2-5-i2v": {
    summary: "Balanced animation quality at a mid price.",
    bestFor: ["General animation", "Experiments"],
    speed: "balanced",
    qualityTier: 2,
  },
  "replicate-hailuo-2-3-i2v": {
    summary: "Affordable animation from a still image.",
    bestFor: ["Budget clips", "Social video"],
    speed: "balanced",
    qualityTier: 2,
  },
};

// ── Task metadata ──────────────────────────────────────────────────────────

export interface TaskGuideMeta {
  label: string;
  description: string;
  /** Editorial top pick; falls back to the first enabled model. */
  recommendedSlug: string;
}

export const GUIDE_TASK_ORDER: TaskType[] = [
  "text_to_image",
  "image_to_image",
  "text_to_video",
  "image_to_video",
];

export const TASK_GUIDE_META: Record<TaskType, TaskGuideMeta> = {
  text_to_image: {
    label: "Text to image",
    description:
      "Turn a written prompt into a still image. Balance speed and price against detail and text rendering.",
    recommendedSlug: "replicate-flux-1-1-pro",
  },
  image_to_image: {
    label: "Image to image",
    description:
      "Edit, restyle, upscale, or restore an existing image. Prefer a targeted edit model over a full regeneration.",
    recommendedSlug: "replicate-flux-kontext-pro",
  },
  text_to_video: {
    label: "Text to video",
    description:
      "Generate motion from a prompt. Video is the most expensive flow, so test prompts on a budget model first.",
    recommendedSlug: "replicate-veo-3-1-fast",
  },
  image_to_video: {
    label: "Image to video",
    description:
      "Animate a still image. Subject consistency and motion quality vary more here than in any other flow.",
    recommendedSlug: "replicate-kling-2-6-i2v",
  },
};

// ── Goals (quick picks) ────────────────────────────────────────────────────

export type GoalIconName =
  | "zap"
  | "camera"
  | "type"
  | "sparkles"
  | "wand"
  | "image"
  | "film"
  | "play"
  | "wallet";

export interface GuideGoal {
  id: string;
  title: string;
  description: string;
  icon: GoalIconName;
  taskType: TaskType;
  /** Ordered recommendations; the first available model becomes the pick. */
  slugs: string[];
}

export const GUIDE_GOALS: GuideGoal[] = [
  {
    id: "fast-drafts",
    title: "Fast, affordable drafts",
    description: "Explore ideas and iterate without burning credits.",
    icon: "zap",
    taskType: "text_to_image",
    slugs: ["replicate-flux-schnell", "fal-flux-schnell", "replicate-seedream-4"],
  },
  {
    id: "photoreal",
    title: "Photorealistic hero images",
    description: "Sharp, detailed stills for campaigns and print.",
    icon: "camera",
    taskType: "text_to_image",
    slugs: [
      "replicate-flux-1-1-pro",
      "replicate-flux-2-pro",
      "fal-flux-pro-1-1",
      "replicate-flux-2-max",
    ],
  },
  {
    id: "text-design",
    title: "Text, logos & posters",
    description: "Reliable lettering for thumbnails and graphic design.",
    icon: "type",
    taskType: "text_to_image",
    slugs: ["replicate-ideogram-v3-turbo", "replicate-gpt-image-2"],
  },
  {
    id: "prompt-following",
    title: "Complex, precise prompts",
    description: "Busy scenes and strict instructions other models misread.",
    icon: "sparkles",
    taskType: "text_to_image",
    slugs: ["replicate-gpt-image-2", "replicate-nano-banana-pro"],
  },
  {
    id: "photo-edit",
    title: "Edit or restyle a photo",
    description: "Change one thing while keeping the subject intact.",
    icon: "wand",
    taskType: "image_to_image",
    slugs: [
      "replicate-flux-kontext-pro",
      "replicate-nano-banana-edit",
      "fal-flux-kontext-pro",
      "replicate-nano-banana-pro-edit",
    ],
  },
  {
    id: "restore",
    title: "Restore or upscale",
    description: "Bring old, soft, or low-resolution images back to life.",
    icon: "image",
    taskType: "image_to_image",
    slugs: [
      "replicate-image-upscale",
      "replicate-codeformer",
      "replicate-gfpgan",
    ],
  },
  {
    id: "cinematic",
    title: "Cinematic video clips",
    description: "Film-like motion, lighting, and camera moves.",
    icon: "film",
    taskType: "text_to_video",
    slugs: [
      "replicate-veo-3-1-fast",
      "replicate-veo-3-1",
      "replicate-kling-2-6",
      "replicate-seedance-2",
    ],
  },
  {
    id: "animate-still",
    title: "Animate a still image",
    description: "Add motion to a photo, character, or product shot.",
    icon: "play",
    taskType: "image_to_video",
    slugs: [
      "replicate-kling-2-6-i2v",
      "replicate-seedance-2-i2v",
      "replicate-veo-3-1-fast-i2v",
      "replicate-hailuo-2-3-i2v",
    ],
  },
  {
    id: "budget-video",
    title: "Budget-friendly motion",
    description: "Motion tests and social loops without the premium price.",
    icon: "wallet",
    taskType: "text_to_video",
    slugs: [
      "fal-h3-max-turbo-t2v",
      "replicate-hailuo-2-3",
      "replicate-wan-2-5",
    ],
  },
];

export interface ResolvedGuideGoal extends GuideGoal {
  primary: StudioModel;
  alternatives: StudioModel[];
}

/** Keep only goals that have at least one enabled model, best pick first. */
export function resolveGuideGoals(models: StudioModel[]): ResolvedGuideGoal[] {
  const bySlug = new Map(models.map((model) => [model.slug, model]));

  return GUIDE_GOALS.flatMap((goal) => {
    const available = goal.slugs
      .map((slug) => bySlug.get(slug))
      .filter((model): model is StudioModel => Boolean(model));

    if (available.length === 0) return [];

    return [
      {
        ...goal,
        primary: available[0],
        alternatives: available.slice(1),
      },
    ];
  });
}

// ── Sorting / filtering ────────────────────────────────────────────────────

export type GuideFilter = "all" | "fastest" | "value" | "quality";

export const GUIDE_FILTERS: Array<{ id: GuideFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "fastest", label: "Fastest" },
  { id: "value", label: "Best value" },
  { id: "quality", label: "Best quality" },
];

export function modelCost(model: StudioModel): number {
  const cost = Number(model.cost_credits);
  return Number.isFinite(cost) ? cost : Number.POSITIVE_INFINITY;
}

function valueScore(model: StudioModel): number {
  const cost = modelCost(model);
  if (!Number.isFinite(cost)) return 0;
  return guideEntryFor(model.slug).qualityTier / Math.max(cost, 1);
}

/** Return a new array sorted for the selected comparison filter. */
export function sortModelsForFilter(
  models: StudioModel[],
  filter: GuideFilter
): StudioModel[] {
  const sorted = [...models];

  switch (filter) {
    case "fastest":
      return sorted.sort(
        (a, b) =>
          SPEED_RANK[guideEntryFor(a.slug).speed] -
            SPEED_RANK[guideEntryFor(b.slug).speed] ||
          modelCost(a) - modelCost(b)
      );
    case "quality":
      return sorted.sort(
        (a, b) =>
          guideEntryFor(b.slug).qualityTier -
            guideEntryFor(a.slug).qualityTier ||
          modelCost(b) - modelCost(a)
      );
    case "value":
      return sorted.sort(
        (a, b) => valueScore(b) - valueScore(a) || modelCost(a) - modelCost(b)
      );
    default:
      return sorted.sort(
        (a, b) =>
          guideEntryFor(b.slug).qualityTier -
            guideEntryFor(a.slug).qualityTier ||
          modelCost(a) - modelCost(b)
      );
  }
}

/** Pick the editorial recommendation when enabled, else the cheapest option. */
export function recommendedModelFor(
  models: StudioModel[],
  taskType: TaskType
): StudioModel | null {
  if (models.length === 0) return null;

  const preferred = models.find(
    (model) => model.slug === TASK_GUIDE_META[taskType].recommendedSlug
  );
  if (preferred) return preferred;

  return [...models].sort((a, b) => modelCost(a) - modelCost(b))[0] ?? null;
}
