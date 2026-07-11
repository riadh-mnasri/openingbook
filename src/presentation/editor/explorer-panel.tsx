"use client";

import { useEffect, useRef, useState } from "react";

interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
}

interface ExplorerData {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
}

type Source = "masters" | "lichess";

// Proxied server-side: the lichess explorer requires an authenticated
// request and the token must not reach the browser.
function explorerUrl(source: Source, fen: string): string {
  return `/api/explorer?source=${source}&fen=${encodeURIComponent(fen)}`;
}

function ResultBar({ white, draws, black }: { white: number; draws: number; black: number }) {
  const total = white + draws + black;
  if (total === 0) return null;
  const pct = (n: number) => (n / total) * 100;
  return (
    <span className="flex h-4 w-24 shrink-0 overflow-hidden rounded-sm border border-border font-mono text-[9px] leading-4">
      <span className="bg-white text-center text-neutral-600" style={{ width: `${pct(white)}%` }}>
        {pct(white) >= 25 ? `${Math.round(pct(white))}` : ""}
      </span>
      <span className="bg-neutral-400 text-center text-white" style={{ width: `${pct(draws)}%` }} />
      <span className="bg-neutral-800 text-center text-white" style={{ width: `${pct(black)}%` }}>
        {pct(black) >= 25 ? `${Math.round(pct(black))}` : ""}
      </span>
    </span>
  );
}

type Status = "loading" | "ok" | "error" | "no-token" | "rate-limited";

export function ExplorerPanel({
  fen,
  onPlayMove,
}: {
  fen: string;
  onPlayMove: (uci: string) => boolean;
}) {
  const [source, setSource] = useState<Source>("masters");
  const [data, setData] = useState<ExplorerData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const cacheRef = useRef<Map<string, ExplorerData>>(new Map());

  useEffect(() => {
    const key = `${source}:${fen}`;
    const cached = cacheRef.current.get(key);
    let cancelled = false;

    function apply(result: ExplorerData) {
      if (cancelled) return;
      setData(result);
      setStatus("ok");
    }

    if (cached) {
      apply(cached);
      return;
    }

    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(explorerUrl(source, fen));
        if (response.status === 501) {
          if (!cancelled) setStatus("no-token");
          return;
        }
        if (response.status === 429) {
          if (!cancelled) setStatus("rate-limited");
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const json = await response.json();
        const result: ExplorerData = {
          white: json.white ?? 0,
          draws: json.draws ?? 0,
          black: json.black ?? 0,
          moves: (json.moves ?? []).map((m: ExplorerMove) => ({
            uci: m.uci,
            san: m.san,
            white: m.white,
            draws: m.draws,
            black: m.black,
          })),
        };
        cacheRef.current.set(key, result);
        apply(result);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fen, source]);

  const total = data ? data.white + data.draws + data.black : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-3">
        {(["masters", "lichess"] as Source[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              source === s ? "bg-foreground text-surface" : "bg-surface-muted text-muted"
            }`}
          >
            {s === "masters" ? "Maîtres" : "Lichess 1600+"}
          </button>
        ))}
        {status === "ok" && total > 0 ? (
          <span className="ml-auto font-mono text-xs text-muted">
            {total.toLocaleString("fr-FR")} parties
          </span>
        ) : null}
      </div>

      {status === "no-token" ? (
        <p className="p-4 text-sm text-muted">
          La théorie lichess demande un jeton d&apos;accès personnel (gratuit) : créez-en un sur
          lichess.org/account/oauth/token puis renseignez la variable d&apos;environnement{" "}
          <code className="rounded bg-surface-muted px-1">LICHESS_API_TOKEN</code>.
        </p>
      ) : status === "rate-limited" ? (
        <p className="p-4 text-sm text-muted">
          Lichess limite temporairement les requêtes. Patientez une minute puis réessayez.
        </p>
      ) : status === "error" ? (
        <p className="p-4 text-sm text-muted">
          Impossible de joindre l&apos;explorer lichess. Réessayez dans un instant.
        </p>
      ) : status === "loading" ? (
        <p className="p-4 text-sm text-muted">Chargement de la théorie...</p>
      ) : data && data.moves.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          Plus de parties de référence dans cette position : vous êtes sorti de la théorie.
        </p>
      ) : data ? (
        <ul className="mt-2 divide-y divide-border">
          {data.moves.map((move) => {
            const moveTotal = move.white + move.draws + move.black;
            return (
              <li key={move.uci}>
                <button
                  type="button"
                  onClick={() => onPlayMove(move.uci)}
                  className="flex w-full items-center gap-3 px-4 py-1.5 text-left transition hover:bg-accent-soft"
                  title="Jouer ce coup (et l'ajouter au répertoire)"
                >
                  <span className="w-12 shrink-0 font-mono text-sm font-medium">{move.san}</span>
                  <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">
                    {total > 0 ? `${Math.round((moveTotal / total) * 100)}%` : ""}
                  </span>
                  <ResultBar white={move.white} draws={move.draws} black={move.black} />
                  <span className="ml-auto font-mono text-[11px] text-muted">
                    {moveTotal.toLocaleString("fr-FR")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
