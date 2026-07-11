"use client";

import type { Side } from "@/domain/repertoire/repertoire";

// Winning-chances curve (same shape lichess uses) so the bar stays
// readable: +1 pawn moves it well past the middle, +5 nearly fills it.
function whiteShare(evaluation: number): number {
  const chances = 2 / (1 + Math.exp(-0.00368208 * evaluation)) - 1;
  return Math.min(0.95, Math.max(0.05, 0.5 + chances / 2));
}

export function EvalBar({ evaluation, side }: { evaluation: number | null; side: Side }) {
  const share = evaluation === null ? 0.5 : whiteShare(evaluation);
  const whiteAtBottom = side === "white";
  const label =
    evaluation === null
      ? "?"
      : Math.abs(evaluation) >= 10000
        ? "#"
        : (evaluation / 100).toFixed(1);

  return (
    <div
      className="relative hidden w-5 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-800 sm:block"
      title={evaluation === null ? "Évaluation" : `Évaluation : ${label}`}
    >
      <div
        className="absolute inset-x-0 bg-white transition-[height] duration-300"
        style={{
          height: `${share * 100}%`,
          [whiteAtBottom ? "bottom" : "top"]: 0,
        }}
      />
      <span
        className={`absolute inset-x-0 text-center font-mono text-[9px] leading-4 ${
          whiteAtBottom ? "bottom-0 text-neutral-700" : "top-0 text-neutral-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
