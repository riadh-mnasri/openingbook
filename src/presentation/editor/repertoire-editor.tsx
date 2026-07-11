"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PositionNote, Side } from "@/domain/repertoire/repertoire";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";
import { useRepertoireEditor } from "./use-repertoire-editor";
import { BoardPanel } from "./board-panel";
import { MoveTree } from "./move-tree";
import { MoveToolbar } from "./move-toolbar";
import { NotesPanel } from "./notes-panel";
import { EnginePanel } from "./engine-panel";
import { ExplorerPanel } from "./explorer-panel";

export interface SerializedRepertoire {
  id: string;
  profileId: string;
  name: string;
  side: Side;
}

type Tab = "engine" | "explorer" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "engine", label: "Moteur" },
  { id: "explorer", label: "Théorie" },
  { id: "notes", label: "Notes" },
];

export function RepertoireEditor({
  repertoire,
  initialEdges,
  initialNotes,
}: {
  repertoire: SerializedRepertoire;
  initialEdges: MoveEdge[];
  initialNotes: PositionNote[];
}) {
  const editor = useRepertoireEditor(repertoire.id, initialEdges, initialNotes);
  const [tab, setTab] = useState<Tab>("engine");
  const [openingName, setOpeningName] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          editor.goBack();
          break;
        case "ArrowRight":
          event.preventDefault();
          editor.goForward();
          break;
        case "ArrowUp":
          event.preventDefault();
          editor.goToVariation(-1);
          break;
        case "ArrowDown":
          event.preventDefault();
          editor.goToVariation(1);
          break;
        case "Home":
          event.preventDefault();
          editor.goToStart();
          break;
        case "End":
          event.preventDefault();
          editor.goToEnd();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  const siblings = editor.currentEdge
    ? editor.edges.filter((e) => e.parentFen === editor.currentEdge!.parentFen)
    : [];
  const canPromote = editor.currentEdge !== null && siblings.length > 1 && editor.currentEdge.rank !== 0;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <Link
          href={`/profiles/${repertoire.profileId}`}
          className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-surface-muted"
          title="Retour aux répertoires"
        >
          ←
        </Link>
        <span aria-hidden className="text-xl leading-none text-accent-strong">
          {repertoire.side === "white" ? "♔" : "♚"}
        </span>
        <h1 className="truncate font-serif text-lg font-semibold">{repertoire.name}</h1>
        {openingName ? (
          <span className="hidden truncate text-sm text-muted sm:inline">· {openingName}</span>
        ) : null}
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[minmax(0,7fr)_minmax(360px,5fr)]">
        <div className="lg:min-h-0">
          <BoardPanel
            fen={editor.currentFen}
            side={repertoire.side}
            onMove={editor.playMove}
            onBack={editor.goBack}
            onForward={editor.goForward}
            onStart={editor.goToStart}
            onEnd={editor.goToEnd}
          />
        </div>

        <div className="flex flex-col gap-4 lg:min-h-0">
          <section className="flex min-h-40 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm lg:min-h-0 lg:flex-1">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <MoveTree
                tree={editor.tree}
                currentEdgeId={editor.currentEdge?.id ?? null}
                onSelect={editor.goToPath}
              />
            </div>
            <MoveToolbar
              key={editor.currentEdge?.id ?? "root"}
              currentEdge={editor.currentEdge}
              canPromote={canPromote}
              onPromote={editor.promoteCurrentMove}
              onDelete={editor.deleteCurrentMove}
              onSetNag={editor.setNagOnCurrentMove}
              onSetComment={editor.setCommentOnCurrentMove}
            />
          </section>

          <section className="flex h-72 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex border-b border-border" role="tablist">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-2 text-sm transition ${
                    tab === id
                      ? "border-b-2 border-accent font-medium text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === "engine" ? <EnginePanel fen={editor.currentFen} /> : null}
              {tab === "explorer" ? (
                <ExplorerPanel
                  fen={editor.currentFen}
                  onPlayMove={editor.playMove}
                  onOpeningName={setOpeningName}
                />
              ) : null}
              {tab === "notes" ? (
                <NotesPanel
                  key={editor.currentFen}
                  note={editor.currentNote}
                  onSave={editor.saveNote}
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
