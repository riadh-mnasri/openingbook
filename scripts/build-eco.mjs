// Rebuilds src/generated/eco.json from the lichess-org/chess-openings
// dataset (CC0). Each opening's PGN is replayed to index it by the
// normalized FEN (EPD) of its final position, the same key the app uses
// for repertoire positions.
//
// Usage: node scripts/build-eco.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { Chess } from "chess.js";

const FILES = ["a", "b", "c", "d", "e"];
const BASE = "https://raw.githubusercontent.com/lichess-org/chess-openings/master";

function normalizeEpd(fen) {
  const [board, turn, castling, ep] = fen.split(/\s+/);
  let epField = ep && ep !== "-" ? ep : "-";
  if (epField !== "-") {
    const chess = new Chess(`${board} ${turn} ${castling} ${epField} 0 1`);
    if (!chess.moves({ verbose: true }).some((m) => m.flags.includes("e"))) epField = "-";
  }
  return `${board} ${turn} ${castling} ${epField}`;
}

const index = {};
let count = 0;

for (const file of FILES) {
  const response = await fetch(`${BASE}/${file}.tsv`);
  if (!response.ok) throw new Error(`${file}.tsv: HTTP ${response.status}`);
  const lines = (await response.text()).trim().split("\n").slice(1);
  for (const line of lines) {
    const [eco, name, pgn] = line.split("\t");
    if (!eco || !name || !pgn) continue;
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch {
      continue;
    }
    index[normalizeEpd(chess.fen())] = `${eco} · ${name}`;
    count += 1;
  }
}

mkdirSync("src/generated", { recursive: true });
writeFileSync("src/generated/eco.json", JSON.stringify(index));
console.log(`eco.json written with ${count} openings`);
