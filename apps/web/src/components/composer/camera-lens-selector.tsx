"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Check, Image as LensIcon, X } from "lucide-react";

export const CAMERA_NONE = "none";
export const LENS_NONE = "none";

interface CameraLensOption {
  key: string;
  label: string;
  /** Phrase appended to the generation prompt when this option is selected. */
  phrase: string;
  group: string;
}

/** Camera bodies. Defaults to None / auto. */
export const CAMERA_OPTIONS: CameraLensOption[] = [
  { key: "none", label: "Auto", phrase: "", group: "Default" },
  { key: "35mm-film", label: "35mm film", phrase: "shot on 35mm film", group: "Film" },
  { key: "8mm-film", label: "8mm film", phrase: "shot on 8mm film", group: "Film" },
  { key: "modern", label: "Modern digital", phrase: "shot on a modern digital cinema camera", group: "Digital" },
  { key: "dv-camcorder", label: "DV camcorder", phrase: "shot on a DV camcorder", group: "Digital" },
  {
    key: "arri-alexa-35",
    label: "ARRI Alexa 35",
    phrase: "shot on ARRI Alexa 35",
    group: "Studio cameras",
  },
  {
    key: "red-v-raptor",
    label: "RED V-Raptor X",
    phrase: "shot on RED V-Raptor X",
    group: "Studio cameras",
  },
  {
    key: "sony-venice-2",
    label: "Sony Venice 2",
    phrase: "shot on Sony Venice 2",
    group: "Studio cameras",
  },
  {
    key: "blackmagic-ursa",
    label: "Blackmagic URSA Cine",
    phrase: "shot on Blackmagic URSA Cine",
    group: "Studio cameras",
  },
];

/** Lenses. Defaults to Auto. */
export const LENS_OPTIONS: CameraLensOption[] = [
  { key: "none", label: "Auto", phrase: "", group: "Default" },
  { key: "warm-vintage", label: "Warm vintage", phrase: "warm vintage lens look", group: "Vintage" },
  {
    key: "halatian-vintage",
    label: "Halatian vintage",
    phrase: "halatian vintage lens character",
    group: "Vintage",
  },
  {
    key: "vintage-anamorphic",
    label: "Vintage anamorphic",
    phrase: "vintage anamorphic lens",
    group: "Vintage",
  },
  { key: "clean-sharp", label: "Clean sharp", phrase: "clean sharp optics", group: "Modern" },
  {
    key: "anamorphic",
    label: "Anamorphic",
    phrase: "anamorphic lens, cinematic widescreen",
    group: "Modern",
  },
  {
    key: "cooke-s4-i",
    label: "Cooke S4/i",
    phrase: "Cooke S4/i lenses",
    group: "Shorts & movies",
  },
  {
    key: "zeiss-supreme-prime",
    label: "Zeiss Supreme Prime",
    phrase: "Zeiss Supreme Prime lenses",
    group: "Shorts & movies",
  },
  {
    key: "angenieux-optimo",
    label: "Angénieux Optimo",
    phrase: "Angénieux Optimo zoom",
    group: "Shorts & movies",
  },
  { key: "sigma-cine", label: "Sigma Cine", phrase: "Sigma Cine lenses", group: "Shorts & movies" },
];

const CAMERA_BY_KEY = new Map(CAMERA_OPTIONS.map((option) => [option.key, option]));
const LENS_BY_KEY = new Map(LENS_OPTIONS.map((option) => [option.key, option]));

/** Appends the selected camera / lens look to a prompt right before generation. */
export function applyCameraLensToPrompt(
  prompt: string,
  camera: string,
  lens: string,
): string {
  const base = prompt.trim();
  const suffix = [CAMERA_BY_KEY.get(camera)?.phrase, LENS_BY_KEY.get(lens)?.phrase]
    .filter((phrase): phrase is string => Boolean(phrase))
    .join(", ");
  if (!suffix) return base;
  return base ? `${base}, ${suffix}` : suffix;
}

const triggerClasses =
  "flex shrink-0 items-center gap-2 rounded-xl border border-[#262A35] bg-[#14161C] px-3 py-2 text-left transition-colors hover:border-[#3A3F4D] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]";

const columnContainer =
  "flex flex-col gap-2 max-h-[26rem] overflow-y-auto pr-2 w-full [scrollbar-width:thin] [scrollbar-color:#3A3F4D_#0F1117]";

const optionClasses = (isSelected: boolean) =>
  `flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
    isSelected
      ? "border-[#7C5CFF]/60 bg-[#6C4CE8]/20 text-[#E8EAF0]"
      : "border-transparent text-[#C7CBD6] hover:bg-[#14161C] hover:border-[#262A35]/60 hover:text-[#E8EAF0]"
  }`;

interface CameraLensColumnProps {
  title: string;
  icon: React.ReactNode;
  options: CameraLensOption[];
  value: string;
  onChange: (key: string) => void;
}

function CameraLensColumn({
  title,
  icon,
  options,
  value,
  onChange,
}: CameraLensColumnProps) {
  const groups = new Map<string, CameraLensOption[]>();
  for (const option of options) {
    const bucket = groups.get(option.group) ?? [];
    bucket.push(option);
    groups.set(option.group, bucket);
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md border border-[#262A35] bg-[#0B0C10] text-[#9AA1B2]" aria-hidden="true">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA1B2]">
          {title}
        </span>
      </div>
      <div className={columnContainer}>
        {Array.from(groups.entries()).map(([group, groupOptions]) => (
          <div key={group} className="space-y-0.5">
            {group !== "Default" && (
              <span className="px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                {group}
              </span>
            )}
            {groupOptions.map((option) => {
              const isSelected = option.key === value;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onChange(option.key)}
                  className={optionClasses(isSelected)}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium truncate text-[#E8EAF0]">
                      {option.label}
                    </span>
                    {option.phrase && (
                      <span className="text-[10px] truncate text-[#9AA1B2]">
                        {option.phrase}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <>
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#A995FF]" />
                      <span className="sr-only">Selected</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CameraLensSelectorProps {
  camera: string;
  lens: string;
  onChange: (camera: string, lens: string) => void;
  /** Canvas view: hide the selected camera/lens label unless the trigger is hovered. */
  hideSelectionWhenCollapsed?: boolean;
}

/**
 * Pro studio camera / lens selector.
 *
 * Collapsed: a single camera icon button showing the active choice.
 * Expanded: a dark overlay that blurs the rest of the canvas with two
 * scrollable columns (camera, lens). Selecting an option tags the prompt
 * (via the parent's onChange) before generation. Closes on Done, Escape,
 * or a click outside the panel.
 */
export function CameraLensSelector({
  camera,
  lens,
  onChange,
  hideSelectionWhenCollapsed = false,
}: CameraLensSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const cameraOption = CAMERA_BY_KEY.get(camera) ?? CAMERA_OPTIONS[0];
  const lensOption = LENS_BY_KEY.get(lens) ?? LENS_OPTIONS[0];

  function openPanel() {
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Close on Escape and on clicks outside the panel / trigger.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target) &&
        !backdropRef.current?.contains(target)
      ) {
        closePanel();
      }
    }

    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const selectedLabels = [
    camera !== CAMERA_NONE ? cameraOption.label : null,
    lens !== LENS_NONE ? lensOption.label : null,
  ].filter((label): label is string => Boolean(label));
  const selectionLabel = selectedLabels.length ? selectedLabels.join(" • ") : null;

  const showSelectionLabel =
    !hideSelectionWhenCollapsed || isTriggerHovered || open;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? "camera-lens-panel" : undefined}
        aria-label={
          selectionLabel
            ? `Camera & lens: ${selectionLabel}`
            : "Camera & lens (Auto)"
        }
        onClick={openPanel}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPanel();
          }
        }}
        className={`${triggerClasses} group`}
        title="Choose camera body and lens look"
      >
        <Camera
          className={`h-4 w-4 shrink-0 transition-colors ${
            selectionLabel ? "text-[#A995FF]" : "text-[#E8EAF0]"
          }`}
        />
        <span className="text-xs font-medium text-[#E8EAF0]">
          Camera & Lens
        </span>
        {selectionLabel && showSelectionLabel && (
          <span
            className="flex h-5 min-w-[5.5rem] items-center justify-center rounded-full border border-[#7C5CFF]/40 bg-[#6C4CE8]/20 px-2 text-[10px] font-semibold text-[#E8EAF0]"
          >
            {selectionLabel}
          </span>
        )}
        <ChevronDown
          className="shrink-0 h-3.5 w-3.5 text-[#9AA1B2] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <>
            <div
              ref={backdropRef}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closePanel}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              id="camera-lens-panel"
              role="region"
              aria-label="Camera & lens selection"
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[48rem] sm:w-[90vw] sm:max-w-[56rem] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-[#262A35] bg-[#0F1117] shadow-2xl shadow-black/80"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-4 border-b border-[#262A35] bg-[#0F1117]/50">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 shrink-0 text-[#A995FF]" />
                  <span className="text-sm font-semibold text-[#E8EAF0]">Camera & Lens</span>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close camera & lens selection"
                  className="rounded-md p-1.5 text-[#9AA1B2] hover:bg-[#1B1E26] hover:text-[#E8EAF0]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="mb-4 text-xs text-[#9AA1B2]">
                  Leave either column on None / auto to exclude it from the prompt.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <CameraLensColumn
                    title="Camera"
                    icon={<Camera />}
                    options={CAMERA_OPTIONS}
                    value={camera}
                    onChange={(key) => onChange(key, lens)}
                  />
                  <CameraLensColumn
                    title="Lens"
                    icon={<LensIcon />}
                    options={LENS_OPTIONS}
                    value={lens}
                    onChange={(key) => onChange(camera, key)}
                  />
                </div>
              </div>
              <div className="shrink-0 border-t border-[#262A35] px-5 py-3 flex items-center justify-between gap-2">
                <span className="text-xs text-[#9AA1B2]">
                  {`Camera: ${cameraOption.label}  ·  Lens: ${lensOption.label}`}
                </span>
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-[#6C4CE8] hover:bg-[#6B4CF0] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                >
                  Done
                </button>
              </div>
            </div>
            </>,
          document.body
        )}
    </div>
  );
}
