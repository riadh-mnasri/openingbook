"use client";

import { useState } from "react";
import { MOVE_NAGS, nagGlyph } from "@/domain/repertoire/nag";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";

interface MoveToolbarProps {
  currentEdge: MoveEdge | null;
  canPromote: boolean;
  onPromote: () => void;
  onDelete: () => void;
  onSetNag: (nag: number | null) => void;
  onSetComment: (comment: string) => void;
}

export function MoveToolbar({
  currentEdge,
  canPromote,
  onPromote,
  onDelete,
  onSetNag,
  onSetComment,
}: MoveToolbarProps) {
  // Mounted with key=<edge id> so the comment draft resets per move.
  const [comment, setComment] = useState(currentEdge?.comment ?? "");

  if (!currentEdge) {
    return (
      <div className="border-t border-border px-4 py-3 text-xs text-muted">
        Sélectionnez un coup pour l&apos;annoter.
      </div>
    );
  }

  function confirmDelete() {
    const ok = window.confirm(
      `Supprimer ${currentEdge!.san} et toute la suite de cette variante ?`,
    );
    if (ok) onDelete();
  }

  return (
    <div className="space-y-2 border-t border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-sm font-semibold">{currentEdge.san}</span>
        {MOVE_NAGS.map((nag) => (
          <button
            key={nag}
            type="button"
            onClick={() => onSetNag(currentEdge.nag === nag ? null : nag)}
            className={`min-w-8 rounded-md border px-1.5 py-0.5 font-mono text-sm transition ${
              currentEdge.nag === nag
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface hover:bg-accent-soft"
            }`}
            title={`Annoter ${nagGlyph(nag)}`}
          >
            {nagGlyph(nag)}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={onPromote}
          disabled={!canPromote}
          className="rounded-md border border-border bg-surface px-2 py-0.5 text-sm transition hover:bg-accent-soft disabled:opacity-40"
          title="Faire de ce coup le coup principal de la position"
        >
          ★ Principal
        </button>
        <button
          type="button"
          onClick={confirmDelete}
          className="rounded-md border border-border bg-surface px-2 py-0.5 text-sm text-danger transition hover:bg-red-50"
          title="Supprimer ce coup et sa suite"
        >
          ✕ Supprimer
        </button>
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => {
          if ((currentEdge.comment ?? "") !== comment.trim()) onSetComment(comment);
        }}
        placeholder="Commentaire sur ce coup (idée, plan, piège...)"
        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
