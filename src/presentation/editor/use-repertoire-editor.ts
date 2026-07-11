"use client";

import { useCallback, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { normalizeFen, toFullFen } from "@/domain/repertoire/fen";
import type { PositionNote } from "@/domain/repertoire/repertoire";
import {
  buildTree,
  edgeIdsToDelete,
  findEdge,
  movesFrom,
  nextRank,
  promotionRanks,
  ROOT_FEN,
  type MoveEdge,
  type TreeNode,
} from "@/domain/repertoire/repertoire-graph";

export interface RepertoireEditorState {
  edges: MoveEdge[];
  tree: TreeNode[];
  path: MoveEdge[];
  currentFen: string;
  currentEdge: MoveEdge | null;
  currentNote: string;
  playMove: (uci: string) => boolean;
  goToPath: (path: MoveEdge[]) => void;
  goBack: () => void;
  goForward: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  goToVariation: (delta: number) => void;
  deleteCurrentMove: () => void;
  promoteCurrentMove: () => void;
  setNagOnCurrentMove: (nag: number | null) => void;
  setCommentOnCurrentMove: (comment: string) => void;
  saveNote: (note: string) => void;
}

async function mutate(url: string, method: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function useRepertoireEditor(
  repertoireId: string,
  initialEdges: MoveEdge[],
  initialNotes: PositionNote[],
): RepertoireEditorState {
  const [edges, setEdges] = useState(initialEdges);
  const [notes, setNotes] = useState(initialNotes);
  const [path, setPath] = useState<MoveEdge[]>([]);
  const base = `/api/repertoires/${repertoireId}`;

  // Every mutation is applied optimistically then sent to the server;
  // on any failed response the graph is refetched to resync.
  const resync = useCallback(async () => {
    const response = await fetch(base);
    if (!response.ok) return;
    const view = await response.json();
    setEdges(view.edges);
    setNotes(view.notes);
    setPath([]);
  }, [base]);

  const send = useCallback(
    (request: Promise<Response>) => {
      request.then((r) => (r.ok ? null : resync())).catch(() => resync());
    },
    [resync],
  );

  const tree = useMemo(() => buildTree(edges), [edges]);
  const currentFen = path.length > 0 ? path[path.length - 1].childFen : ROOT_FEN;
  const currentEdge = path.length > 0 ? path[path.length - 1] : null;
  const currentNote = notes.find((n) => n.fen === currentFen)?.note ?? "";

  // The path holds edge objects; keep it pointing at the live objects
  // whenever the edge list is replaced (id swap after create, rank
  // updates after a promotion...).
  const refreshPath = useCallback((nextEdges: MoveEdge[], tempId?: string, real?: MoveEdge) => {
    setPath((prev) =>
      prev
        .map((e) => {
          if (tempId && e.id === tempId) return real ?? e;
          return nextEdges.find((n) => n.id === e.id) ?? null;
        })
        .filter((e): e is MoveEdge => e !== null),
    );
  }, []);

  const playMove = useCallback(
    (uci: string): boolean => {
      const existing = findEdge(edges, currentFen, uci);
      if (existing) {
        setPath((prev) => [...prev, existing]);
        return true;
      }
      const chess = new Chess(toFullFen(currentFen));
      let san: string;
      try {
        san = chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.slice(4, 5) || undefined,
        }).san;
      } catch {
        return false;
      }
      const temp: MoveEdge = {
        id: `tmp-${crypto.randomUUID()}`,
        parentFen: currentFen,
        uci,
        san,
        childFen: normalizeFen(chess.fen()),
        rank: nextRank(edges, currentFen),
        nag: null,
        comment: null,
      };
      setEdges((prev) => [...prev, temp]);
      setPath((prev) => [...prev, temp]);
      mutate(`${base}/moves`, "POST", { parentFen: temp.parentFen, uci })
        .then(async (response) => {
          if (!response.ok) return resync();
          const real: MoveEdge = await response.json();
          setEdges((prev) => {
            const next = prev.map((e) => (e.id === temp.id ? real : e));
            refreshPath(next, temp.id, real);
            return next;
          });
        })
        .catch(() => resync());
      return true;
    },
    [base, currentFen, edges, refreshPath, resync],
  );

  const goToPath = useCallback((next: MoveEdge[]) => setPath(next), []);
  const goBack = useCallback(() => setPath((prev) => prev.slice(0, -1)), []);

  const goForward = useCallback(() => {
    setPath((prev) => {
      const fen = prev.length > 0 ? prev[prev.length - 1].childFen : ROOT_FEN;
      const [main] = movesFrom(edges, fen);
      return main ? [...prev, main] : prev;
    });
  }, [edges]);

  const goToStart = useCallback(() => setPath([]), []);

  const goToEnd = useCallback(() => {
    setPath((prev) => {
      const next = [...prev];
      const seen = new Set(next.map((e) => e.childFen));
      let fen = next.length > 0 ? next[next.length - 1].childFen : ROOT_FEN;
      seen.add(ROOT_FEN);
      for (;;) {
        const [main] = movesFrom(edges, fen);
        if (!main || seen.has(main.childFen)) return next;
        next.push(main);
        seen.add(main.childFen);
        fen = main.childFen;
      }
    });
  }, [edges]);

  const goToVariation = useCallback(
    (delta: number) => {
      setPath((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const siblings = movesFrom(edges, last.parentFen);
        const index = siblings.findIndex((e) => e.id === last.id);
        const sibling = siblings[index + delta];
        return sibling ? [...prev.slice(0, -1), sibling] : prev;
      });
    },
    [edges],
  );

  const deleteCurrentMove = useCallback(() => {
    if (!currentEdge) return;
    const ids = new Set(edgeIdsToDelete(edges, currentEdge.id));
    setEdges((prev) => prev.filter((e) => !ids.has(e.id)));
    setPath((prev) => {
      const cut = prev.findIndex((e) => ids.has(e.id));
      return cut === -1 ? prev : prev.slice(0, cut);
    });
    if (!currentEdge.id.startsWith("tmp-")) {
      send(mutate(`${base}/moves/${currentEdge.id}`, "DELETE"));
    }
  }, [base, currentEdge, edges, send]);

  const promoteCurrentMove = useCallback(() => {
    if (!currentEdge) return;
    const ranks = new Map(promotionRanks(edges, currentEdge.id).map((r) => [r.id, r.rank]));
    if (ranks.size === 0) return;
    setEdges((prev) => {
      const next = prev.map((e) => (ranks.has(e.id) ? { ...e, rank: ranks.get(e.id)! } : e));
      refreshPath(next);
      return next;
    });
    if (!currentEdge.id.startsWith("tmp-")) {
      send(mutate(`${base}/moves/${currentEdge.id}/promote`, "POST"));
    }
  }, [base, currentEdge, edges, refreshPath, send]);

  const patchCurrentMove = useCallback(
    (patch: { nag?: number | null; comment?: string | null }) => {
      if (!currentEdge) return;
      setEdges((prev) => {
        const next = prev.map((e) => (e.id === currentEdge.id ? { ...e, ...patch } : e));
        refreshPath(next);
        return next;
      });
      if (!currentEdge.id.startsWith("tmp-")) {
        send(mutate(`${base}/moves/${currentEdge.id}`, "PATCH", patch));
      }
    },
    [base, currentEdge, refreshPath, send],
  );

  const setNagOnCurrentMove = useCallback(
    (nag: number | null) => patchCurrentMove({ nag }),
    [patchCurrentMove],
  );
  const setCommentOnCurrentMove = useCallback(
    (comment: string) => patchCurrentMove({ comment: comment.trim() === "" ? null : comment }),
    [patchCurrentMove],
  );

  const saveNote = useCallback(
    (note: string) => {
      const fen = currentFen;
      setNotes((prev) => {
        const rest = prev.filter((n) => n.fen !== fen);
        return note.trim() === "" ? rest : [...rest, { fen, note }];
      });
      send(mutate(`${base}/notes`, "PUT", { fen, note }));
    },
    [base, currentFen, send],
  );

  return {
    edges,
    tree,
    path,
    currentFen,
    currentEdge,
    currentNote,
    playMove,
    goToPath,
    goBack,
    goForward,
    goToStart,
    goToEnd,
    goToVariation,
    deleteCurrentMove,
    promoteCurrentMove,
    setNagOnCurrentMove,
    setCommentOnCurrentMove,
    saveNote,
  };
}
