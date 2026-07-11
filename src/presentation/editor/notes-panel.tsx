"use client";

import { useState } from "react";

// Mounted with key=<position fen> so the draft resets when the position
// changes.
export function NotesPanel({ note, onSave }: { note: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(note);

  return (
    <div className="flex h-full flex-col p-3">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() !== note.trim()) onSave(draft);
        }}
        placeholder="Note libre sur cette position : plans typiques, structures de pions, finales à viser..."
        className="min-h-28 w-full flex-1 resize-none rounded-lg border border-border bg-background p-3 text-sm leading-6 outline-none focus:border-accent"
      />
      <p className="mt-2 text-xs text-muted">
        La note est attachée à la position (elle vaut pour tous les ordres de coups qui y mènent).
      </p>
    </div>
  );
}
