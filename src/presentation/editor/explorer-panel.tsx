"use client";

export function ExplorerPanel({
  fen,
  onPlayMove,
  onOpeningName,
}: {
  fen: string;
  onPlayMove: (uci: string) => boolean;
  onOpeningName: (name: string | null) => void;
}) {
  void fen;
  void onPlayMove;
  void onOpeningName;
  return <p className="p-4 text-sm text-muted">Explorer lichess à venir.</p>;
}
