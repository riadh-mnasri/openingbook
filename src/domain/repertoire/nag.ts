// Numeric Annotation Glyphs (standard PGN) mapped to display symbols.
const NAG_GLYPHS: Record<number, string> = {
  1: "!",
  2: "?",
  3: "!!",
  4: "??",
  5: "!?",
  6: "?!",
  10: "=",
  13: "∞",
  14: "⩲",
  15: "⩱",
  16: "±",
  17: "∓",
  18: "+−",
  19: "−+",
};

// NAGs offered in the editor, in display order.
export const MOVE_NAGS = [1, 3, 5, 6, 2, 4] as const;
export const POSITION_NAGS = [10, 13, 14, 15, 16, 17, 18, 19] as const;

export function nagGlyph(nag: number): string {
  return NAG_GLYPHS[nag] ?? `$${nag}`;
}
