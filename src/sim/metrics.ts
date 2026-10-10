import { containsWord } from "../core/clue.js";
import { guessIsCorrect, parseAssessment } from "../core/parse.js";
import type { GameResult, Mode } from "../core/types.js";
import type { Judgment } from "./judge.js";
import { phoneRates } from "./models.js";
import type { GameLog, VotePolicy } from "./types.js";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const ratio = (n: number, d: number) => (d ? n / d : NaN);
const impostorName = (r: GameResult) => r.setup.players.find((p) => p.role === "impostor")!.name;
const roleOf = (r: GameResult, name: string) => r.setup.players.find((p) => p.name === name)!.role;
/** Reasons carry details ("it has 11 words"); group by the part before them. */
const reasonKey = (reason: string) => reason.split(" (")[0]!;
const bump = <K>(m: Map<K, number>, k: K, by = 1) => m.set(k, (m.get(k) ?? 0) + by);

export interface Rate {
  hits: number;
  n: number;
}

/** Wilson 95% interval for a proportion. */
export function wilson({ hits, n }: Rate): [number, number] {
  if (n === 0) return [NaN, NaN];
  const z = 1.96;
  const p = hits / n;
  const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / (1 + (z * z) / n);
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

export interface VoteRound extends Rate {
  round: number | "all";
  /** Mean of 1/(alive-1) over the same votes: what uniform random voting would hit. */
  baseline: number;
}

/** Civilian votes that hit the impostor, per round and over all rounds. */
export function voteSanity(results: GameResult[]): VoteRound[] {
  const byRound = new Map<number, { hits: number; base: number[] }>();
  for (const r of results) {
    const imp = impostorName(r);
    for (const rd of r.rounds) {
      const acc = byRound.get(rd.round) ?? { hits: 0, base: [] };
      for (const v of rd.votes) {
        if (roleOf(r, v.voter) !== "civilian") continue;
        if (v.target === imp) acc.hits++;
        acc.base.push(1 / (rd.votes.length - 1));
      }
      byRound.set(rd.round, acc);
    }
  }
  const rows: VoteRound[] = [...byRound]
    .sort(([a], [b]) => a - b)
    .map(([round, a]) => ({ round, hits: a.hits, n: a.base.length, baseline: mean(a.base) }));
  const all = [...byRound.values()];
  rows.push({
    round: "all",
    hits: all.reduce((s, a) => s + a.hits, 0),
    n: all.reduce((s, a) => s + a.base.length, 0),
    baseline: mean(all.flatMap((a) => a.base)),
  });
  return rows;
}

export function clueQuality(results: GameResult[]) {
  const reasons = new Map<string, number>();
  let turns = 0, attempts = 0, retriedTurns = 0, passes = 0;
  for (const c of results.flatMap((r) => r.rounds.flatMap((rd) => rd.clues))) {
    turns++;
    attempts += c.rejected.length + (c.passed ? 0 : 1);
    if (c.rejected.length) retriedTurns++;
    if (c.passed) passes++;
    for (const x of c.rejected) bump(reasons, reasonKey(x.reason));
  }
  const invalid = [...reasons.values()].reduce((a, b) => a + b, 0);
  return { turns, attempts, invalid, invalidRate: ratio(invalid, attempts), retriedTurns, passes, reasons };
}

/** Clue turns and passes per persona name. */
export function personaPasses(results: GameResult[]) {
  const out = new Map<string, { style: string; turns: number; passes: number; invalid: number }>();
  for (const r of results) {
    for (const c of r.rounds.flatMap((rd) => rd.clues)) {
      const p = r.setup.players.find((x) => x.name === c.name)!;
      const row = out.get(p.name) ?? { style: p.style, turns: 0, passes: 0, invalid: 0 };
      row.turns++;
      row.passes += c.passed ? 1 : 0;
      row.invalid += c.rejected.length;
      out.set(p.name, row);
    }
  }
  return out;
}

export function voteReasons(results: GameResult[]) {
  const reasons = new Map<string, number>();
  let votes = 0, retried = 0, noReason = 0, fallbacks = 0;
  for (const v of results.flatMap((r) => r.rounds.flatMap((rd) => rd.votes))) {
    votes++;
    if (v.rejected?.length) retried++;
    if (v.fallback) fallbacks++;
    else if (!v.reason) noReason++;
    for (const x of v.rejected ?? []) bump(reasons, reasonKey(x.reason));
  }
  return { votes, retried, noReason, fallbacks, reasons };
}

/** Public text a player could read before the end of the game: clues and vote reasons. */
export function publicText(r: GameResult): string {
  return r.rounds.flatMap((rd) => [...rd.clues.map((c) => c.text), ...rd.votes.map((v) => v.reason)]).join(" \n ");
}

export function outcomes(results: GameResult[]) {
  const civ = results.filter((r) => r.winner === "civilians").length;
  const outRounds = new Map<number, number>();
  const endReasons = new Map<string, number>();
  for (const r of results) {
    if (r.impostorOutRound) bump(outRounds, r.impostorOutRound);
    bump(endReasons, r.endReason);
  }
  const guessed = results.filter((r) => r.mrWhiteGuess);
  return {
    games: results.length,
    civilianWins: civ,
    impostorWins: results.length - civ,
    outRounds,
    endReasons,
    mrWhite: {
      eliminated: guessed.length,
      correct: guessed.filter((r) => r.mrWhiteGuess!.correct).length,
      /** Guesses made while the word had not appeared in any clue or vote reason. */
      wordAbsent: guessed.filter((r) => !containsWord(publicText(r), r.setup.civilianWord)).length,
      guesses: guessed.map((r) => ({ guess: r.mrWhiteGuess!.guess, word: r.setup.civilianWord, correct: r.mrWhiteGuess!.correct })),
    },
  };
}

/** Mode A private ODD/FIT step: how often each role answered ODD, per round. */
export function assessStats(logs: GameLog[]) {
  const rows = new Map<number, { imp: Rate; civ: Rate; impNamed: number }>();
  for (const l of logs) {
    for (const c of l.calls.filter((x) => x.kind === "assess")) {
      const row = rows.get(c.round) ?? { imp: { hits: 0, n: 0 }, civ: { hits: 0, n: 0 }, impNamed: 0 };
      const a = parseAssessment(c.output);
      const isImp = roleOf(l.result, c.player) === "impostor";
      const rate = isImp ? row.imp : row.civ;
      rate.n++;
      if (a.odd) rate.hits++;
      if (isImp && a.odd && a.othersWord && guessIsCorrect(a.othersWord, l.result.setup.civilianWord)) row.impNamed++;
      rows.set(c.round, row);
    }
  }
  return [...rows].sort(([a], [b]) => a - b).map(([round, r]) => ({ round, ...r }));
}

/** Share of clues the judge read as the civilians' word, by role and round bucket. */
export function blend(judgments: Judgment[]) {
  const cell = (role: string, early: boolean | null): Rate => {
    const js = judgments.filter((j) => j.role === role && (early === null || (j.round === 1) === early));
    return { hits: js.filter((j) => j.civilian).length, n: js.length };
  };
  return (["impostor", "civilian"] as const).map((role) => ({
    role,
    round1: cell(role, true),
    later: cell(role, false),
    all: cell(role, null),
  }));
}

export function cost(logs: GameLog[]) {
  const calls = logs.flatMap((l) => l.calls);
  const perKind = (["clue", "assess", "vote", "guess"] as const).map((kind) => {
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
  // Per round: sum that round's calls (all seats, every kind), then average over game-rounds.
  const rounds = logs.flatMap((l) => l.result.rounds.map((rd) => l.calls.filter((c) => c.round === rd.round)));
  const model = logs[0]?.model ?? "";
  const phones = phoneRates(model).map((p) => ({
    ...p,
    cachedSec: mean(rounds.map((cs) => cs.reduce((s, c) => s + (c.evaluatedTokens ?? c.promptTokens) / p.read + c.generatedTokens / p.write, 0))),
    uncachedSec: mean(rounds.map((cs) => cs.reduce((s, c) => s + c.promptTokens / p.read + c.generatedTokens / p.write, 0))),
  }));
  const sum = (f: (l: GameLog) => number) => mean(logs.map(f));
  return {
    callsPerGame: sum((l) => l.calls.length),
    roundsPerGame: sum((l) => l.result.rounds.length),
    wallSecPerGame: sum((l) => l.wallMs / 1000),
    macSecPerRound: mean(rounds.map((cs) => cs.reduce((s, c) => s + c.ms, 0) / 1000)),
    callsPerRound: mean(rounds.map((cs) => cs.length)),
    evaluatedPerGame: sum((l) => l.calls.reduce((s, c) => s + (c.evaluatedTokens ?? c.promptTokens), 0)),
    promptPerGame: sum((l) => l.calls.reduce((s, c) => s + c.promptTokens, 0)),
    generatedPerGame: sum((l) => l.calls.reduce((s, c) => s + c.generatedTokens, 0)),
    perKind,
    phones,
  };
}

export function group(logs: GameLog[], mode: Mode, votes: VotePolicy): GameLog[] {
  return logs.filter((l) => l.result.setup.mode === mode && l.votes === votes);
}
