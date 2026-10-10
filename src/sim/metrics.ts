import type { GameResult, Mode } from "../core/types.js";
import type { GameLog, VotePolicy } from "./types.js";

/** Measured phone decode rates for Qwen3-4B Q4_K_M (tokens per second). */
export const PHONES = [
  { name: "Pixel 6a (6 GB)", read: 22, write: 5 },
  { name: "Dimensity 8300 (12 GB)", read: 26, write: 7 },
] as const;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const ratio = (n: number, d: number) => (d ? n / d : NaN);
const impostorName = (r: GameResult) => r.setup.players.find((p) => p.role === "impostor")!.name;
const roleOf = (r: GameResult, name: string) => r.setup.players.find((p) => p.name === name)!.role;

export interface VoteRound {
  round: number;
  civilianVotes: number;
  hits: number;
  /** Mean of 1/(alive-1) over the same votes: what uniform random voting would hit. */
  baseline: number;
}

export function voteSanity(results: GameResult[]): VoteRound[] {
  const byRound = new Map<number, { votes: number; hits: number; base: number[] }>();
  for (const r of results) {
    const imp = impostorName(r);
    for (const rd of r.rounds) {
      const acc = byRound.get(rd.round) ?? { votes: 0, hits: 0, base: [] };
      for (const v of rd.votes) {
        if (roleOf(r, v.voter) !== "civilian") continue;
        acc.votes++;
        if (v.target === imp) acc.hits++;
        acc.base.push(1 / (rd.votes.length - 1));
      }
      byRound.set(rd.round, acc);
    }
  }
  return [...byRound]
    .sort(([a], [b]) => a - b)
    .map(([round, a]) => ({ round, civilianVotes: a.votes, hits: a.hits, baseline: mean(a.base) }));
}

export function clueQuality(results: GameResult[]) {
  const reasons = new Map<string, number>();
  let turns = 0, attempts = 0, retriedTurns = 0, passes = 0;
  for (const r of results) {
    for (const c of r.rounds.flatMap((rd) => rd.clues)) {
      turns++;
      attempts += c.rejected.length + (c.passed ? 0 : 1);
      if (c.rejected.length) retriedTurns++;
      if (c.passed) passes++;
      for (const x of c.rejected) reasons.set(x.reason, (reasons.get(x.reason) ?? 0) + 1);
    }
  }
  const invalid = [...reasons.values()].reduce((a, b) => a + b, 0);
  return { turns, attempts, invalid, invalidRate: ratio(invalid, attempts), retriedTurns, passes, reasons };
}

export function outcomes(results: GameResult[]) {
  const civ = results.filter((r) => r.winner === "civilians").length;
  const outRounds = new Map<number, number>();
  for (const r of results) if (r.impostorOutRound) outRounds.set(r.impostorOutRound, (outRounds.get(r.impostorOutRound) ?? 0) + 1);
  const endReasons = new Map<string, number>();
  for (const r of results) endReasons.set(r.endReason, (endReasons.get(r.endReason) ?? 0) + 1);
  const guesses = results.filter((r) => r.mrWhiteGuess);
  return {
    games: results.length,
    civilianWins: civ,
    impostorWins: results.length - civ,
    outRounds,
    endReasons,
    mrWhite: { eliminated: guesses.length, correct: guesses.filter((r) => r.mrWhiteGuess!.correct).length },
    fallbackVotes: results.flatMap((r) => r.rounds.flatMap((rd) => rd.votes)).filter((v) => v.fallback).length,
  };
}

export function cost(logs: GameLog[]) {
  const calls = logs.flatMap((l) => l.calls);
  const kinds = ["clue", "vote", "guess"] as const;
  const perKind = kinds.map((kind) => {
    const cs = calls.filter((c) => c.kind === kind);
    return {
      kind,
      calls: cs.length,
      prompt: mean(cs.map((c) => c.promptTokens)),
      evaluated: mean(cs.map((c) => c.evaluatedTokens ?? c.promptTokens)),
      generated: mean(cs.map((c) => c.generatedTokens)),
      ms: mean(cs.map((c) => c.ms)),
    };
  });
  // Phone time per round: sum over that round's calls, then average over game-rounds.
  const rounds = logs.flatMap((l) =>
    l.result.rounds.map((rd) => l.calls.filter((c) => c.round === rd.round)),
  );
  const phones = PHONES.map((p) => ({
    ...p,
    cachedSec: mean(rounds.map((cs) => cs.reduce((s, c) => s + (c.evaluatedTokens ?? c.promptTokens) / p.read + c.generatedTokens / p.write, 0))),
    uncachedSec: mean(rounds.map((cs) => cs.reduce((s, c) => s + c.promptTokens / p.read + c.generatedTokens / p.write, 0))),
  }));
  return {
    callsPerGame: mean(logs.map((l) => l.calls.length)),
    roundsPerGame: mean(logs.map((l) => l.result.rounds.length)),
    wallSecPerGame: mean(logs.map((l) => l.wallMs / 1000)),
    evaluatedPerGame: mean(logs.map((l) => l.calls.reduce((s, c) => s + (c.evaluatedTokens ?? c.promptTokens), 0))),
    promptPerGame: mean(logs.map((l) => l.calls.reduce((s, c) => s + c.promptTokens, 0))),
    generatedPerGame: mean(logs.map((l) => l.calls.reduce((s, c) => s + c.generatedTokens, 0))),
    perKind,
    phones,
  };
}

export function group(logs: GameLog[], mode: Mode, votes: VotePolicy): GameLog[] {
  return logs.filter((l) => l.result.setup.mode === mode && l.votes === votes);
}
