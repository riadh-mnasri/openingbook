"use client";

import type { EngineState } from "./use-engine";

function scoreLabel(line: EngineState["lines"][number]): string {
  if (line.scoreMate !== null) return `#${Math.abs(line.scoreMate)}`;
  const pawns = (line.scoreCp ?? 0) / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

export function EnginePanel({
  engine,
  enabled,
  onToggle,
  onPlayMove,
}: {
  engine: EngineState;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onPlayMove: (uci: string) => boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pt-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative h-5 w-9 rounded-full transition ${
            enabled ? "bg-accent" : "bg-border"
          }`}
          title={enabled ? "Arrêter le moteur" : "Lancer le moteur"}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] ${
              enabled ? "left-4.5" : "left-0.5"
            }`}
          />
        </button>
        <span className="text-sm font-medium">Stockfish 18</span>
        {enabled ? (
          <span className="ml-auto rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs text-muted">
            {engine.running ? "profondeur" : "terminé ·"} {engine.depth}
          </span>
        ) : null}
      </div>

      {!enabled ? (
        <p className="p-4 text-sm text-muted">
          Le moteur est en pause. Activez-le pour analyser la position (il tourne dans votre
          navigateur, rien n&apos;est envoyé sur un serveur).
        </p>
      ) : engine.lines.length === 0 ? (
        <p className="p-4 text-sm text-muted">Analyse en cours...</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {engine.lines.map((line) => (
            <li key={line.multipv}>
              <button
                type="button"
                onClick={() => (line.firstUci ? onPlayMove(line.firstUci) : undefined)}
                className="flex w-full items-baseline gap-3 px-4 py-2 text-left transition hover:bg-accent-soft"
                title="Jouer le premier coup de cette ligne"
              >
                <span
                  className={`w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-semibold ${
                    (line.scoreMate ?? line.scoreCp ?? 0) >= 0
                      ? "bg-surface-muted text-foreground"
                      : "bg-foreground text-surface"
                  }`}
                >
                  {scoreLabel(line)}
                </span>
                <span className="truncate font-mono text-[13px] text-muted">
                  {line.pv.join(" ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
