"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { ProfileColor } from "@/domain/profile/profile";
import { PROFILE_COLORS } from "@/domain/profile/profile";

export interface ProfileCardData {
  id: string;
  name: string;
  color: ProfileColor;
}

const COLOR_STYLES: Record<ProfileColor, { swatch: string; card: string }> = {
  green: { swatch: "bg-accent", card: "bg-accent-soft" },
  wood: { swatch: "bg-wood", card: "bg-wood-soft" },
  slate: { swatch: "bg-slate-500", card: "bg-slate-100" },
  gold: { swatch: "bg-amber-500", card: "bg-amber-50" },
};

export function ProfileGrid({ profiles }: { profiles: ProfileCardData[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState<ProfileColor>("green");
  const [pending, setPending] = useState(false);

  async function createProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      setName("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function removeProfile(profile: ProfileCardData) {
    const ok = window.confirm(
      `Supprimer le profil « ${profile.name} » et tous ses répertoires ?`,
    );
    if (!ok) return;
    await fetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <li key={profile.id} className="group relative">
            <Link
              href={`/profiles/${profile.id}`}
              className={`block rounded-xl border border-border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${COLOR_STYLES[profile.color].card}`}
            >
              <span
                aria-hidden
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl text-white ${COLOR_STYLES[profile.color].swatch}`}
              >
                {profile.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-serif text-lg font-semibold">{profile.name}</span>
              <span className="mt-1 block text-sm text-muted">Voir ses répertoires</span>
            </Link>
            <button
              type="button"
              onClick={() => removeProfile(profile)}
              className="absolute right-3 top-3 hidden rounded-md px-2 py-1 text-xs text-muted transition hover:bg-surface hover:text-danger group-hover:block"
              title="Supprimer le profil"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={createProfile}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau joueur (ex. Riadh)"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          aria-label="Nom du profil"
        />
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Couleur">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ${COLOR_STYLES[c].swatch} ${
                color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""
              }`}
              title={c}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-50"
        >
          Ajouter un profil
        </button>
      </form>
    </div>
  );
}
