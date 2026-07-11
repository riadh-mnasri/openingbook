import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { normalizeFen, sideToMove, START_FEN, toFullFen } from "../fen";

function fenAfter(moves: string[]): string {
  const chess = new Chess();
  for (const move of moves) chess.move(move);
  return chess.fen();
}

describe("normalizeFen", () => {
  it("drops move counters from the starting position", () => {
    expect(normalizeFen(new Chess().fen())).toBe(START_FEN);
  });

  it("drops the en passant square when no capture is playable", () => {
    // After 1.e4 chess.js reports e3 as en passant square, but no black
    // pawn can actually capture there.
    const normalized = normalizeFen(fenAfter(["e4"]));
    expect(normalized.endsWith(" -")).toBe(true);
  });

  it("keeps the en passant square when a capture is playable", () => {
    // After 1.e4 c5 2.e5 d5, exd6 en passant is legal.
    const normalized = normalizeFen(fenAfter(["e4", "c5", "e5", "d5"]));
    expect(normalized.endsWith(" d6")).toBe(true);
  });

  it("gives the same key to transposed positions", () => {
    const viaQueenPawn = normalizeFen(fenAfter(["d4", "d5", "c4"]));
    const viaEnglish = normalizeFen(fenAfter(["c4", "d5", "d4"]));
    expect(viaQueenPawn).toBe(viaEnglish);
  });

  it("distinguishes positions differing only by castling rights", () => {
    const withRights = normalizeFen(fenAfter(["e4", "e5", "Nf3", "Nf6"]));
    const kingMoved = normalizeFen(fenAfter(["e4", "e5", "Ke2", "Nf6", "Ke1", "Ng8", "Nf3", "Nf6"]));
    expect(withRights).not.toBe(kingMoved);
  });

  it("round-trips through toFullFen into chess.js", () => {
    const normalized = normalizeFen(fenAfter(["e4", "c5", "Nf3"]));
    expect(() => new Chess(toFullFen(normalized))).not.toThrow();
  });
});

describe("sideToMove", () => {
  it("reads the side to move from the normalized FEN", () => {
    expect(sideToMove(START_FEN)).toBe("white");
    expect(sideToMove(normalizeFen(fenAfter(["e4"])))).toBe("black");
  });
});
