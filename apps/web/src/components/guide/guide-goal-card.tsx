"use client";

import {
  Camera,
  Film,
  Image as ImageIcon,
  Play,
  Sparkles,
  Type,
  Wallet,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { GoalIconName, ResolvedGuideGoal } from "@/lib/model-guide";
import { formatCredits } from "@/components/settings/format";
import { providerAccent, providerLabel } from "@/lib/providers";

const GOAL_ICONS: Record<GoalIconName, LucideIcon> = {
  zap: Zap,
  camera: Camera,
  type: Type,
  sparkles: Sparkles,
  wand: Wand2,
  image: ImageIcon,
  film: Film,
  play: Play,
  wallet: Wallet,
};

interface GuideGoalCardProps {
  goal: ResolvedGuideGoal;
}

export function GuideGoalCard({ goal }: GuideGoalCardProps) {
  const Icon = GOAL_ICONS[goal.icon];
  const alternatives = goal.alternatives
    .slice(0, 2)
    .map((model) => model.display_name);

  return (
    <a
      href={`#guide-task-${goal.taskType}`}
      className="group flex h-full flex-col rounded-2xl border border-[#262A35] bg-[#14161C] p-5 transition-colors hover:border-[#7C5CFF]/60 hover:bg-[#171A21] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262A35] bg-[#1B1E26] text-[#A995FF]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span
          className={`rounded-full border border-[#262A35] bg-[#0B0C10] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${providerAccent(
            goal.primary.provider_id
          )}`}
        >
          {providerLabel(goal.primary.provider_id)}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#E8EAF0]">{goal.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#9AA1B2]">
        {goal.description}
      </p>

      <div className="mt-auto space-y-1.5 border-t border-[#262A35] pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium text-[#E8EAF0]">
            {goal.primary.display_name}
          </span>
          <span className="shrink-0 rounded-full border border-[#262A35] bg-[#0B0C10] px-2 py-0.5 font-mono text-[11px] text-[#F5C451]">
            {formatCredits(goal.primary.cost_credits)} cr
          </span>
        </div>
        {alternatives.length > 0 && (
          <p className="text-[11px] leading-relaxed text-[#6B7280]">
            Also consider: {alternatives.join(", ")}
          </p>
        )}
      </div>
    </a>
  );
}
