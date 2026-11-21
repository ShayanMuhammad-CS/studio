import type { ModelInputCapability, StudioModel } from "@/hooks/use-models";

/**
 * Per-task defaults used when the API does not advertise capabilities.
 * Keeping these in sync with studio_core.capabilities means older responses
 * and test fixtures continue to work.
 */
const DEFAULT_CAPABILITIES: Record<string, ModelInputCapability[]> = {
  text_to_image: [],
  image_to_image: [
    {
      role: "init_image",
      kind: "image",
      required: true,
      max_count: 1,
      label: "Source image",
    },
  ],
  text_to_video: [],
  image_to_video: [
    {
      role: "first_frame",
      kind: "image",
      required: true,
      max_count: 1,
      label: "First frame",
    },
  ],
};

/** Return the media slots a model accepts, with API-provided data preferred. */
export function getInputCapabilities(model: StudioModel | null | undefined): ModelInputCapability[] {
  if (!model) return [];
  // An explicit list always wins, including an empty one (model takes no media).
  if (model.input_capabilities) return model.input_capabilities;
  return DEFAULT_CAPABILITIES[model.task_type] ?? [];
}

/** Media capabilities of a particular kind, in display order. */
export function capabilitiesOfKind(
  model: StudioModel | null | undefined,
  kind: string
): ModelInputCapability[] {
  return getInputCapabilities(model).filter((capability) => capability.kind === kind);
}

function countFor(
  inputsByRole: Record<string, unknown[]>,
  role: string
): number {
  return inputsByRole[role]?.length ?? 0;
}

/**
 * Capabilities that still need an input before the model can run.
 *
 * Individual ``required`` slots are checked first. If a model instead requires
 * one of several groups (frames *or* references), the first capability of each
 * acceptable group is returned so the UI can say "first frame or reference
 * images" rather than demanding every alternative.
 */
export function missingRequiredCapabilities(
  capabilities: ModelInputCapability[],
  inputsByRole: Record<string, unknown[]>
): ModelInputCapability[] {
  const missing = capabilities.filter(
    (capability) => capability.required && countFor(inputsByRole, capability.role) === 0
  );
  if (missing.length > 0) return missing;

  const requiredGroupCapabilities = capabilities.filter(
    (capability) => capability.required_group
  );
  if (
    requiredGroupCapabilities.length > 0 &&
    !requiredGroupCapabilities.some(
      (capability) => countFor(inputsByRole, capability.role) > 0
    )
  ) {
    const representatives: ModelInputCapability[] = [];
    const seenGroups = new Set<string>();
    for (const capability of requiredGroupCapabilities) {
      const key = capability.group ?? capability.role;
      if (seenGroups.has(key)) continue;
      seenGroups.add(key);
      representatives.push(capability);
    }
    return representatives;
  }

  return [];
}

/** Human-readable "first frame or reference images" label for missing slots. */
export function missingInputLabel(
  capabilities: ModelInputCapability[],
  inputsByRole: Record<string, unknown[]>
): string | undefined {
  const missing = missingRequiredCapabilities(capabilities, inputsByRole);
  if (missing.length === 0) return undefined;
  const labels = missing
    .map((capability) => capability.label.toLowerCase())
    .filter((label, index, all) => all.indexOf(label) === index);
  return labels.join(" or ");
}

/**
 * The slot a generic "use as reference" action should target. Reference-image
 * models prefer their dedicated reference slot; other models fall back to the
 * required slot (first frame / source image) and then the first available one.
 */
export function preferredReferenceRole(
  capabilities: ModelInputCapability[]
): string | null {
  return (
    capabilities.find((capability) => capability.role === "reference_image")?.role ??
    capabilities.find((capability) => capability.required)?.role ??
    capabilities[0]?.role ??
    null
  );
}

/**
 * Remove inputs from mutually exclusive groups when targeting ``targetRole``.
 * Selecting a reference image clears first/last frames and vice versa.
 */
export function clearConflictingGroups<T>(
  inputsByRole: Record<string, T[]>,
  capabilities: ModelInputCapability[],
  targetRole: string
): Record<string, T[]> {
  const target = capabilities.find((capability) => capability.role === targetRole);
  if (!target?.group) return inputsByRole;

  const conflictingRoles = capabilities
    .filter(
      (capability) =>
        capability.group != null && capability.group !== target.group
    )
    .map((capability) => capability.role);

  let changed = false;
  const next = { ...inputsByRole };
  for (const role of conflictingRoles) {
    if (next[role]?.length) {
      delete next[role];
      changed = true;
    }
  }
  return changed ? next : inputsByRole;
}

/**
 * Trim selections to the model's limits and resolve group conflicts. The first
 * populated group wins; later groups are dropped so a model never receives an
 * invalid frames + references combination.
 */
export function normalizeInputsForCapabilities<T>(
  inputsByRole: Record<string, T[]>,
  capabilities: ModelInputCapability[]
): Record<string, T[]> {
  const next: Record<string, T[]> = {};
  const populatedGroups = new Set<string>();
  let changed = false;

  for (const capability of capabilities) {
    const current = inputsByRole[capability.role] ?? [];
    let allowed = current;
    if (capability.group != null) {
      if (
        populatedGroups.size > 0 &&
        !populatedGroups.has(capability.group)
      ) {
        allowed = [];
      }
    }

    const trimmed = allowed.slice(0, capability.max_count);
    if (trimmed.length > 0) {
      next[capability.role] = trimmed;
      if (capability.group != null) populatedGroups.add(capability.group);
    }
    if (trimmed.length !== current.length) changed = true;
  }

  if (Object.keys(inputsByRole).some((role) => !(role in next))) changed = true;
  return changed ? next : inputsByRole;
}
