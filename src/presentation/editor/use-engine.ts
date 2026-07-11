"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { toFullFen } from "@/domain/repertoire/fen";

export interface EngineLine {
  multipv: number;
  depth: number;
  // Evaluation from White's point of view.
  scoreCp: number | null;
  scoreMate: number | null;
  // Principal variation in SAN, starting from the analysed position.
  pv: string[];
  // First move of the variation in UCI, to play it on the board.
  firstUci: string | null;
}

export interface EngineState {
  lines: EngineLine[];
  depth: number;
  // White advantage used by the eval bar: centipawns, or ±10000 on mate.
  evaluation: number | null;
  running: boolean;
}

const IDLE_STATE: EngineState = { lines: [], depth: 0, evaluation: null, running: false };
const ENGINE_URL = "/engine/stockfish-18-lite-single.js";
const MULTI_PV = 3;
const MAX_DEPTH = 24;
const PV_DISPLAY_MOVES = 8;

function parseInfo(line: string, whiteToMove: boolean, fen: string): EngineLine | null {
  const depth = /\bdepth (\d+)/.exec(line);
  const multipv = /\bmultipv (\d+)/.exec(line);
  const score = /\bscore (cp|mate) (-?\d+)/.exec(line);
  const pv = /\bpv (.+)$/.exec(line);
  if (!depth || !score || !pv) return null;

  const sign = whiteToMove ? 1 : -1;
  const value = Number(score[2]) * sign;
  const uciMoves = pv[1].split(/\s+/);

  const chess = new Chess(toFullFen(fen));
  const sans: string[] = [];
  for (const uci of uciMoves.slice(0, PV_DISPLAY_MOVES)) {
    try {
      sans.push(
        chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.slice(4, 5) || undefined,
        }).san,
      );
    } catch {
      break;
    }
  }
  if (sans.length === 0) return null;

  return {
    multipv: multipv ? Number(multipv[1]) : 1,
    depth: Number(depth[1]),
    scoreCp: score[1] === "cp" ? value : null,
    scoreMate: score[1] === "mate" ? value : null,
    pv: sans,
    firstUci: uciMoves[0] ?? null,
  };
}

function sameLines(a: EngineLine[], b: EngineLine[]): boolean {
  return a.length === b.length && a.every((line, i) => line === b[i]);
}

export function useEngine(fen: string, enabled: boolean): EngineState {
  const workerRef = useRef<Worker | null>(null);
  const linesRef = useRef<Map<number, EngineLine>>(new Map());
  const runningRef = useRef(false);
  // UCI handshake state: nothing may be sent before uciok/readyok, and a
  // search launched before readiness is queued in pendingFenRef.
  const readyRef = useRef(false);
  const pendingFenRef = useRef<string | null>(null);
  // Number of bestmove messages to swallow: one per interrupted search,
  // so the previous search ending never marks the new one as finished.
  const staleBestmovesRef = useRef(0);
  const inFlightRef = useRef(false);
  const [state, setState] = useState<EngineState>(IDLE_STATE);

  const startSearch = (worker: Worker, searchFen: string) => {
    if (inFlightRef.current) {
      worker.postMessage("stop");
      staleBestmovesRef.current += 1;
    }
    linesRef.current = new Map();
    runningRef.current = true;
    inFlightRef.current = true;
    worker.postMessage(`position fen ${toFullFen(searchFen)}`);
    worker.postMessage(`go depth ${MAX_DEPTH}`);
  };

  // The engine floods `info` messages: the handlers below only fill refs,
  // and this single slow interval is the one place state is written, so
  // rendering stays cheap whatever the engine throughput is.
  useEffect(() => {
    const flush = setInterval(() => {
      const lines = [...linesRef.current.values()].sort((a, b) => a.multipv - b.multipv);
      setState((prev) => {
        const best: EngineLine | undefined = lines[0];
        const next: EngineState = {
          lines,
          depth: best?.depth ?? 0,
          evaluation:
            best === undefined
              ? null
              : best.scoreMate !== null
                ? best.scoreMate >= 0
                  ? 10000
                  : -10000
                : best.scoreCp,
          running: runningRef.current,
        };
        const unchanged =
          sameLines(prev.lines, next.lines) &&
          prev.depth === next.depth &&
          prev.evaluation === next.evaluation &&
          prev.running === next.running;
        return unchanged ? prev : next;
      });
    }, 250);
    return () => clearInterval(flush);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const worker = new Worker(ENGINE_URL);
    workerRef.current = worker;

    const onHandshake = (event: MessageEvent) => {
      const text = String(event.data);
      if (text === "uciok") {
        worker.postMessage(`setoption name MultiPV value ${MULTI_PV}`);
        worker.postMessage("isready");
      } else if (text === "readyok") {
        readyRef.current = true;
        if (pendingFenRef.current !== null) {
          startSearch(worker, pendingFenRef.current);
          pendingFenRef.current = null;
        }
      }
    };
    worker.addEventListener("message", onHandshake);
    worker.postMessage("uci");

    return () => {
      worker.removeEventListener("message", onHandshake);
      worker.terminate();
      workerRef.current = null;
      readyRef.current = false;
      pendingFenRef.current = null;
      staleBestmovesRef.current = 0;
      inFlightRef.current = false;
      linesRef.current = new Map();
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!enabled || !worker) return;

    const whiteToMove = fen.split(" ")[1] === "w";
    const onMessage = (event: MessageEvent) => {
      const text = String(event.data);
      if (text.startsWith("info ") && text.includes(" pv ")) {
        const parsed = parseInfo(text, whiteToMove, fen);
        if (parsed) linesRef.current.set(parsed.multipv, parsed);
      } else if (text.startsWith("bestmove")) {
        if (staleBestmovesRef.current > 0) {
          staleBestmovesRef.current -= 1;
        } else {
          runningRef.current = false;
          inFlightRef.current = false;
        }
      }
    };
    worker.addEventListener("message", onMessage);

    if (readyRef.current) {
      startSearch(worker, fen);
    } else {
      pendingFenRef.current = fen;
    }

    return () => worker.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, enabled]);

  return enabled ? state : IDLE_STATE;
}
