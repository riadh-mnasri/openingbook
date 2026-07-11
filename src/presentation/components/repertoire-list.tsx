"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { Side } from "@/domain/repertoire/repertoire";

export interface RepertoireCardData {
  id: string;
  name: string;
  side: Side;
  moveCount: number;
  updatedAt: string;
}

const SIDE_LABELS: Record<Side, { icon: string; label: string }> = {
  white: { icon: "♔", label: "Blancs" },
  black: { icon: "♚", label: "Noirs" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function RepertoireList({
  profileId,
  repertoires,
}: {
  profileId: string;
  repertoires: RepertoireCardData[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [side, setSide] = useState<Side>("white");
  const [pending, setPending] = useState(false);

  async function createRepertoire(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/repertoires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, name, side }),
      });
      if (response.ok) {
        const created = await response.json();
        router.push(`/repertoires/${created.id}`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function renameRepertoire(repertoire: RepertoireCardData) {
    const newName = window.prompt("Nouveau nom du répertoire", repertoire.name);
    if (!newName || newName.trim() === "" || newName === repertoire.name) return;
    await fetch(`/api/repertoires/${repertoire.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    router.refresh();
  }

  async function removeRepertoire(repertoire: RepertoireCardData) {
    const ok = window.confirm(
      `Supprimer « ${repertoire.name} » et ses ${repertoire.moveCount} coups ?`,
    );
    if (!ok) return;
    await fetch(`/api/repertoires/${repertoire.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {repertoires.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-muted">
          Aucun répertoire pour l&apos;instant. Créez le premier ci-dessous : choisissez votre
          couleur, donnez-lui un nom (« Italienne », « Contre 1.d4 »...) et construisez vos
          lignes directement sur l&apos;échiquier.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {repertoires.map((repertoire) => (
            <li key={repertoire.id} className="group relative">
              <Link
                href={`/repertoires/${repertoire.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  aria-hidden
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-3xl ${
                    repertoire.side === "white"
                      ? "bg-surface-muted text-foreground"
                      : "bg-foreground text-surface"
                  }`}
                >
                  {SIDE_LABELS[repertoire.side].icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-lg font-semibold">
                    {repertoire.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {SIDE_LABELS[repertoire.side].label} · {repertoire.moveCount} coup
                    {repertoire.moveCount > 1 ? "s" : ""} · modifié le{" "}
                    {formatDate(repertoire.updatedAt)}
                  </span>
                </span>
              </Link>
              <span className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => renameRepertoire(repertoire)}
                  className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-surface-muted"
                >
                  Renommer
                </button>
                <button
                  type="button"
                  onClick={() => removeRepertoire(repertoire)}
                  className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-surface-muted hover:text-danger"
                >
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={createRepertoire}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau répertoire (ex. Italienne)"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          aria-label="Nom du répertoire"
        />
        <div className="flex overflow-hidden rounded-lg border border-border" role="radiogroup">
          {(Object.keys(SIDE_LABELS) as Side[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={side === s}
              onClick={() => setSide(s)}
              className={`px-3 py-2 text-sm transition ${
                side === s ? "bg-foreground text-surface" : "bg-background text-muted"
              }`}
            >
              {SIDE_LABELS[s].icon} {SIDE_LABELS[s].label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-50"
        >
          Créer
        </button>
      </form>
    </div>
  );
}
