"use client";

import { Chessboard } from "react-chessboard";
import { toFullFen } from "@/domain/repertoire/fen";
import type { Side } from "@/domain/repertoire/repertoire";

interface BoardPanelProps {
  fen: string;
  side: Side;
  onMove: (uci: string) => boolean;
  onBack: () => void;
  onForward: () => void;
  onStart: () => void;
  onEnd: () => void;
}

function NavButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex-1 rounded-lg border border-border bg-surface py-1.5 text-lg transition hover:bg-accent-soft"
    >
      {label}
    </button>
  );
}

export function BoardPanel({ fen, side, onMove, onBack, onForward, onStart, onEnd }: BoardPanelProps) {
  return (
    <div className="mx-auto w-full max-w-[600px]">
      <div className="overflow-hidden rounded-lg shadow-md">
        <Chessboard
          options={{
            position: toFullFen(fen),
            boardOrientation: side,
            darkSquareStyle: { backgroundColor: "var(--board-dark)" },
            lightSquareStyle: { backgroundColor: "var(--board-light)" },
            dropSquareStyle: { boxShadow: "inset 0 0 0 3px var(--accent-strong)" },
            animationDurationInMs: 150,
            onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
              if (!targetSquare || targetSquare === sourceSquare) return false;
              const isPawn = piece.pieceType.endsWith("P");
              const promotion =
                isPawn && (targetSquare.endsWith("8") || targetSquare.endsWith("1")) ? "q" : "";
              return onMove(`${sourceSquare}${targetSquare}${promotion}`);
            },
          }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <NavButton label="⏮" title="Position initiale (Début)" onClick={onStart} />
        <NavButton label="◀" title="Coup précédent (←)" onClick={onBack} />
        <NavButton label="▶" title="Coup suivant (→)" onClick={onForward} />
        <NavButton label="⏭" title="Fin de la ligne principale (Fin)" onClick={onEnd} />
      </div>
    </div>
  );
}
