import ecoIndex from "@/generated/eco.json";

// Opening names from the lichess-org/chess-openings dataset (CC0),
// indexed by normalized FEN. Regenerate with scripts/build-eco.mjs.
const openings = ecoIndex as Record<string, string>;

export function openingName(fen: string): string | null {
  return openings[fen] ?? null;
}

/**
 * Name of the deepest named position along a line of play. Play usually
 * leaves known theory at some point; the line keeps the name of the last
 * position the dataset knows about.
 */
export function openingNameAlongLine(fens: string[]): string | null {
  for (let i = fens.length - 1; i >= 0; i -= 1) {
    const name = openings[fens[i]];
    if (name) return name;
  }
  return null;
}
