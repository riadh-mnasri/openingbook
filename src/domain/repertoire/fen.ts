import { Chess } from "chess.js";

// Starting position in normalized form (4-field EPD).
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

/**
 * Normalizes a full FEN (6 fields) or partial FEN into a 4-field EPD:
 * placement, side to move, castling rights, en passant square.
 *
 * Move counters are dropped, and the en passant square is kept only when
 * an en passant capture is actually playable. Two different move orders
 * reaching the same position therefore produce the same key, which makes
 * transpositions detectable by plain string equality.
 */
export function normalizeFen(fen: string): string {
  const [board, turn, castling, epRaw] = fen.trim().split(/\s+/);
  if (!board || !turn || !castling) {
    throw new Error(`Invalid FEN: ${fen}`);
  }
  let ep = epRaw && epRaw !== "-" ? epRaw : "-";
  if (ep !== "-") {
    const chess = new Chess(`${board} ${turn} ${castling} ${ep} 0 1`);
    const epPlayable = chess.moves({ verbose: true }).some((m) => m.flags.includes("e"));
    if (!epPlayable) ep = "-";
  }
  return `${board} ${turn} ${castling} ${ep}`;
}

// Rebuilds a FEN accepted by chess.js from a normalized EPD.
export function toFullFen(epd: string): string {
  return `${epd} 0 1`;
}

// Side to move of a normalized position.
export function sideToMove(epd: string): "white" | "black" {
  return epd.split(/\s+/)[1] === "w" ? "white" : "black";
}
