import { START_FEN } from "./fen";

/**
 * A repertoire is a graph of positions keyed by normalized FEN (EPD).
 * Each edge is one move played from a position; positions themselves are
 * implicit (any FEN appearing as parent or child). Storing edges rather
 * than lines makes transpositions first-class: two move orders reaching
 * the same position share every continuation stored from it.
 */
export interface MoveEdge {
  id: string;
  parentFen: string;
  uci: string;
  san: string;
  childFen: string;
  // Order among the moves stored from parentFen; rank 0 is the main move.
  rank: number;
  nag: number | null;
  comment: string | null;
}

export interface TreeNode {
  edge: MoveEdge;
  // 1-based ply of this move counted from the starting position.
  ply: number;
  // True when childFen's continuations are already expanded elsewhere in
  // the tree (or up the current line): the node is a leaf pointing there.
  isTransposition: boolean;
  children: TreeNode[];
}

export const ROOT_FEN = START_FEN;

export function movesFrom(edges: MoveEdge[], parentFen: string): MoveEdge[] {
  return edges.filter((e) => e.parentFen === parentFen).sort((a, b) => a.rank - b.rank);
}

export function findEdge(edges: MoveEdge[], parentFen: string, uci: string): MoveEdge | null {
  return edges.find((e) => e.parentFen === parentFen && e.uci === uci) ?? null;
}

export function nextRank(edges: MoveEdge[], parentFen: string): number {
  const siblings = movesFrom(edges, parentFen);
  return siblings.length === 0 ? 0 : siblings[siblings.length - 1].rank + 1;
}

/**
 * Derives the display tree from the edge list. Positions are expanded at
 * their first visit (depth-first, main moves first); any later edge
 * reaching an already-expanded position becomes a transposition leaf,
 * which also guarantees termination on cycles (e.g. repeated positions).
 */
export function buildTree(edges: MoveEdge[], rootFen: string = ROOT_FEN): TreeNode[] {
  const expanded = new Set<string>([rootFen]);

  function expand(parentFen: string, ply: number): TreeNode[] {
    return movesFrom(edges, parentFen).map((edge) => {
      const isTransposition = expanded.has(edge.childFen);
      if (isTransposition) {
        return { edge, ply, isTransposition, children: [] };
      }
      expanded.add(edge.childFen);
      return { edge, ply, isTransposition, children: expand(edge.childFen, ply + 1) };
    });
  }

  return expand(rootFen, 1);
}

// Positions reachable from the root by following stored moves.
function reachableFens(edges: MoveEdge[], rootFen: string, excludedEdgeIds: Set<string>): Set<string> {
  const reachable = new Set<string>([rootFen]);
  const byParent = new Map<string, MoveEdge[]>();
  for (const edge of edges) {
    if (excludedEdgeIds.has(edge.id)) continue;
    const list = byParent.get(edge.parentFen);
    if (list) list.push(edge);
    else byParent.set(edge.parentFen, [edge]);
  }
  const queue = [rootFen];
  while (queue.length > 0) {
    const fen = queue.pop()!;
    for (const edge of byParent.get(fen) ?? []) {
      if (!reachable.has(edge.childFen)) {
        reachable.add(edge.childFen);
        queue.push(edge.childFen);
      }
    }
  }
  return reachable;
}

/**
 * Edges to remove when deleting a move: the edge itself plus every edge
 * that becomes unreachable from the root once it is gone. Continuations
 * still reachable through a transposition are preserved.
 */
export function edgeIdsToDelete(
  edges: MoveEdge[],
  deletedEdgeId: string,
  rootFen: string = ROOT_FEN,
): string[] {
  const reachable = reachableFens(edges, rootFen, new Set([deletedEdgeId]));
  return edges
    .filter((e) => e.id === deletedEdgeId || !reachable.has(e.parentFen))
    .map((e) => e.id);
}

/**
 * New ranks making the given edge the main move of its position, shifting
 * former better-ranked siblings down while preserving their order.
 * Returns only the edges whose rank changes.
 */
export function promotionRanks(edges: MoveEdge[], edgeId: string): { id: string; rank: number }[] {
  const promoted = edges.find((e) => e.id === edgeId);
  if (!promoted) return [];
  const siblings = movesFrom(edges, promoted.parentFen);
  const reordered = [promoted, ...siblings.filter((e) => e.id !== edgeId)];
  return reordered
    .map((edge, rank) => ({ id: edge.id, rank }))
    .filter(({ id, rank }) => siblings.find((e) => e.id === id)!.rank !== rank);
}

// Main line: follow the rank-0 move from the root until a transposition
// (already-seen position) or the end of theory.
export function mainLine(edges: MoveEdge[], rootFen: string = ROOT_FEN): MoveEdge[] {
  const line: MoveEdge[] = [];
  const seen = new Set<string>([rootFen]);
  let fen = rootFen;
  for (;;) {
    const [main] = movesFrom(edges, fen);
    if (!main || seen.has(main.childFen)) return line;
    line.push(main);
    seen.add(main.childFen);
    fen = main.childFen;
  }
}
