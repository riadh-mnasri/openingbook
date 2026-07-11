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
  // Strict UCI serialization: this single-threaded build crashes if a
  // new `position`/`go` is sent while a search is in flight. Only one
  // search runs at a time; changing position sends `stop`, and the next
  // search starts when the interrupted search's `bestmove` arrives.
  const readyRef = useRef(false);
  const searchingRef = useRef(false);
  const searchedFenRef = useRef<string | null>(null);
  const desiredFenRef = useRef(fen);
  // True when the in-flight search got a `stop`: its bestmove must chain
  // a fresh search even if the desired position matches (the user may
  // have navigated away and back before the bestmove arrived).
  const stopRequestedRef = useRef(false);
  // Asks the worker to converge on desiredFen; safe to call anytime.
  const kickRef = useRef<() => void>(() => {});
  const [state, setState] = useState<EngineState>(IDLE_STATE);

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

    const startSearch = () => {
      const searchFen = desiredFenRef.current;
      searchingRef.current = true;
      searchedFenRef.current = searchFen;
      worker.postMessage(`position fen ${toFullFen(searchFen)}`);
      worker.postMessage(`go depth ${MAX_DEPTH}`);
    };

    kickRef.current = () => {
      if (!readyRef.current) return;
      if (searchingRef.current) {
        // The pending bestmove will chain the next search.
        if (searchedFenRef.current !== desiredFenRef.current && !stopRequestedRef.current) {
          stopRequestedRef.current = true;
          worker.postMessage("stop");
        }
      } else {
        startSearch();
      }
    };

    const onMessage = (event: MessageEvent) => {
      const text = String(event.data);
      if (text.startsWith("info ") && text.includes(" pv ")) {
        const searchedFen = searchedFenRef.current;
        if (searchedFen === null || searchedFen !== desiredFenRef.current) return;
        const whiteToMove = searchedFen.split(" ")[1] === "w";
        const parsed = parseInfo(text, whiteToMove, searchedFen);
        if (parsed) linesRef.current.set(parsed.multipv, parsed);
      } else if (text.startsWith("bestmove")) {
        searchingRef.current = false;
        const wasStopped = stopRequestedRef.current;
        stopRequestedRef.current = false;
        if (searchedFenRef.current !== desiredFenRef.current || wasStopped) {
          startSearch();
        } else {
          runningRef.current = false;
        }
      } else if (text === "uciok") {
        worker.postMessage(`setoption name MultiPV value ${MULTI_PV}`);
        worker.postMessage("isready");
      } else if (text === "readyok" && !readyRef.current) {
        readyRef.current = true;
        kickRef.current();
      }
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage("uci");

    return () => {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      workerRef.current = null;
      readyRef.current = false;
      searchingRef.current = false;
      searchedFenRef.current = null;
      stopRequestedRef.current = false;
      kickRef.current = () => {};
      linesRef.current = new Map();
      runningRef.current = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    desiredFenRef.current = fen;
    linesRef.current = new Map();
    runningRef.current = true;
    kickRef.current();
  }, [fen, enabled]);

  return enabled ? state : IDLE_STATE;
}
