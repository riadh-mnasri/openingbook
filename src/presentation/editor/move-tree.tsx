"use client";

import { Fragment } from "react";
import { nagGlyph } from "@/domain/repertoire/nag";
import type { MoveEdge, TreeNode } from "@/domain/repertoire/repertoire-graph";

interface MoveTreeProps {
  tree: TreeNode[];
  currentEdgeId: string | null;
  onSelect: (path: MoveEdge[]) => void;
}

function moveLabel(node: TreeNode, withNumber: boolean): string {
  const number = Math.ceil(node.ply / 2);
  const isWhiteMove = node.ply % 2 === 1;
  if (isWhiteMove) return `${number}.${node.edge.san}`;
  return withNumber ? `${number}...${node.edge.san}` : node.edge.san;
}

function MoveToken({
  node,
  path,
  withNumber,
  depth,
  currentEdgeId,
  onSelect,
}: {
  node: TreeNode;
  path: MoveEdge[];
  withNumber: boolean;
  depth: number;
  currentEdgeId: string | null;
  onSelect: (path: MoveEdge[]) => void;
}) {
  const isCurrent = currentEdgeId === node.edge.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(path)}
      className={`rounded px-1 py-0.5 text-left transition hover:bg-accent-soft ${
        isCurrent ? "bg-accent text-white hover:bg-accent" : ""
      } ${depth === 0 ? "font-medium" : ""}`}
    >
      {moveLabel(node, withNumber)}
      {node.edge.nag !== null ? <span className="text-danger">{nagGlyph(node.edge.nag)}</span> : null}
      {node.isTransposition ? (
        <span title="Transposition : cette position existe ailleurs dans le répertoire"> ↪</span>
      ) : null}
    </button>
  );
}

/**
 * Renders a line of play as flowing book-style text: the main move first,
 * then each alternative in parentheses (recursively, with its own
 * continuation), then the main move's continuation.
 */
function LineView({
  nodes,
  path,
  withNumber,
  depth,
  currentEdgeId,
  onSelect,
}: {
  nodes: TreeNode[];
  path: MoveEdge[];
  withNumber: boolean;
  depth: number;
  currentEdgeId: string | null;
  onSelect: (path: MoveEdge[]) => void;
}) {
  if (nodes.length === 0) return null;
  const [main, ...alternatives] = nodes;
  const mainPath = [...path, main.edge];
  const interrupted = alternatives.length > 0 || main.edge.comment !== null;

  return (
    <>
      <MoveToken
        node={main}
        path={mainPath}
        withNumber={withNumber}
        depth={depth}
        currentEdgeId={currentEdgeId}
        onSelect={onSelect}
      />{" "}
      {main.edge.comment !== null ? (
        <span className="italic text-muted">{main.edge.comment} </span>
      ) : null}
      {alternatives.map((alt) => (
        <Fragment key={alt.edge.id}>
          <span className={depth === 0 ? "text-muted" : ""}>( </span>
          <span className="text-[0.94em]">
            <LineView
              nodes={[alt]}
              path={path}
              withNumber
              depth={depth + 1}
              currentEdgeId={currentEdgeId}
              onSelect={onSelect}
            />
          </span>
          <span className={depth === 0 ? "text-muted" : ""}>) </span>
        </Fragment>
      ))}
      <LineView
        nodes={main.children}
        path={mainPath}
        withNumber={interrupted}
        depth={depth}
        currentEdgeId={currentEdgeId}
        onSelect={onSelect}
      />
    </>
  );
}

export function MoveTree({ tree, currentEdgeId, onSelect }: MoveTreeProps) {
  if (tree.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        Jouez un coup sur l&apos;échiquier pour commencer votre répertoire. Chaque coup joué
        s&apos;ajoute ici, avec ses variantes.
      </p>
    );
  }
  return (
    <div className="p-4 font-mono text-[13px] leading-7 sm:text-sm">
      <button
        type="button"
        onClick={() => onSelect([])}
        className={`mr-1 rounded px-1 py-0.5 text-muted transition hover:bg-accent-soft ${
          currentEdgeId === null ? "bg-accent text-white hover:bg-accent" : ""
        }`}
        title="Position initiale"
      >
        ⌂
      </button>
      <LineView
        nodes={tree}
        path={[]}
        withNumber
        depth={0}
        currentEdgeId={currentEdgeId}
        onSelect={onSelect}
      />
    </div>
  );
}
