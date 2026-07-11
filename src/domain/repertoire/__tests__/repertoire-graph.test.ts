import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { normalizeFen, START_FEN } from "../fen";
import {
  buildTree,
  edgeIdsToDelete,
  findEdge,
  mainLine,
  type MoveEdge,
  movesFrom,
  nextRank,
  promotionRanks,
} from "../repertoire-graph";

// Builds edge lists the same way the editor does: replaying SAN lines
// from the starting position, merging moves that already exist.
function graphOf(...lines: string[][]): MoveEdge[] {
  const edges: MoveEdge[] = [];
  let id = 0;
  for (const line of lines) {
    const chess = new Chess();
    let parentFen = START_FEN;
    for (const san of line) {
      const move = chess.move(san);
      const uci = move.from + move.to + (move.promotion ?? "");
      const childFen = normalizeFen(chess.fen());
      if (!findEdge(edges, parentFen, uci)) {
        edges.push({
          id: `e${id++}`,
          parentFen,
          uci,
          san: move.san,
          childFen,
          rank: nextRank(edges, parentFen),
          nag: null,
          comment: null,
        });
      }
      parentFen = childFen;
    }
  }
  return edges;
}

function sans(nodes: { edge: MoveEdge }[]): string[] {
  return nodes.map((n) => n.edge.san);
}

describe("buildTree", () => {
  it("nests variations under their position, main move first", () => {
    const edges = graphOf(["e4", "e5", "Nf3"], ["e4", "c5"]);
    const tree = buildTree(edges);

    expect(sans(tree)).toEqual(["e4"]);
    expect(sans(tree[0].children)).toEqual(["e5", "c5"]);
    expect(sans(tree[0].children[0].children)).toEqual(["Nf3"]);
    expect(tree[0].ply).toBe(1);
    expect(tree[0].children[0].children[0].ply).toBe(3);
  });

  it("marks converging move orders as transpositions instead of duplicating", () => {
    const edges = graphOf(["d4", "d5", "c4", "e6"], ["c4", "d5", "d4"]);
    const tree = buildTree(edges);

    const viaQueenPawn = tree[0].children[0].children[0];
    expect(viaQueenPawn.edge.san).toBe("c4");
    expect(viaQueenPawn.isTransposition).toBe(false);
    expect(sans(viaQueenPawn.children)).toEqual(["e6"]);

    const viaEnglish = tree[1].children[0].children[0];
    expect(viaEnglish.edge.san).toBe("d4");
    expect(viaEnglish.isTransposition).toBe(true);
    expect(viaEnglish.children).toEqual([]);
  });

  it("terminates on cycles (position repeated by shuffling)", () => {
    const edges = graphOf(["Nf3", "Nf6", "Ng1", "Ng8"]);
    const tree = buildTree(edges);

    let node = tree[0];
    let depth = 1;
    while (node.children.length > 0) {
      node = node.children[0];
      depth += 1;
    }
    expect(depth).toBe(4);
    expect(node.isTransposition).toBe(true);
  });
});

describe("edgeIdsToDelete", () => {
  it("deletes the whole subtree of a move", () => {
    const edges = graphOf(["e4", "e5", "Nf3", "Nc6"], ["e4", "c5"]);
    const e5Edge = edges.find((e) => e.san === "e5")!;

    const deleted = edgeIdsToDelete(edges, e5Edge.id);

    const remaining = edges.filter((e) => !deleted.includes(e.id));
    expect(remaining.map((e) => e.san).sort()).toEqual(["c5", "e4"]);
  });

  it("keeps continuations still reachable through a transposition", () => {
    const edges = graphOf(["d4", "d5", "c4", "e6"], ["c4", "d5", "d4"]);
    const d4Root = edges.find((e) => e.san === "d4" && e.parentFen === START_FEN)!;

    const deleted = edgeIdsToDelete(edges, d4Root.id);

    const remaining = edges.filter((e) => !deleted.includes(e.id));
    // 1.d4, 1...d5 and 2.c4 go away, but 3...e6 survives because the
    // position before it is still reached via 1.c4 d5 2.d4.
    expect(remaining.map((e) => e.san)).toEqual(["e6", "c4", "d5", "d4"]);
  });
});

describe("promotionRanks", () => {
  it("makes the edge the main move and shifts former siblings down", () => {
    const edges = graphOf(["e4", "e5"], ["e4", "c5"], ["e4", "e6"]);
    const e6Edge = edges.find((e) => e.san === "e6")!;

    const changes = promotionRanks(edges, e6Edge.id);

    const bySan = Object.fromEntries(
      changes.map((c) => [edges.find((e) => e.id === c.id)!.san, c.rank]),
    );
    expect(bySan).toEqual({ e6: 0, e5: 1, c5: 2 });
  });

  it("only returns edges whose rank actually changes", () => {
    const edges = graphOf(["e4", "e5"], ["e4", "c5"], ["e4", "e6"]);
    const c5Edge = edges.find((e) => e.san === "c5")!;

    const changes = promotionRanks(edges, c5Edge.id);

    const bySan = Object.fromEntries(
      changes.map((c) => [edges.find((e) => e.id === c.id)!.san, c.rank]),
    );
    expect(bySan).toEqual({ c5: 0, e5: 1 });
  });
});

describe("mainLine", () => {
  it("follows rank-0 moves from the root", () => {
    const edges = graphOf(["e4", "e5", "Nf3"], ["e4", "c5", "Nf3"]);
    expect(mainLine(edges).map((e) => e.san)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("stops when the main line transposes into an earlier position", () => {
    const edges = graphOf(["Nf3", "Nf6", "Ng1", "Ng8"]);
    expect(mainLine(edges).map((e) => e.san)).toEqual(["Nf3", "Nf6", "Ng1"]);
  });
});

describe("movesFrom", () => {
  it("returns the moves of a position sorted by rank", () => {
    const edges = graphOf(["e4", "c5"], ["e4", "e5"]);
    const afterE4 = edges.find((e) => e.san === "e4")!.childFen;
    expect(movesFrom(edges, afterE4).map((e) => e.san)).toEqual(["c5", "e5"]);
  });
});
