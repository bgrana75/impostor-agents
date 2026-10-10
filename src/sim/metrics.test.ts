import { describe, expect, it } from "vitest";
import type { GameResult, RoundRecord } from "../core/types.js";
import { agentCost, blend, clueQuality, clueShape, cost, outcomes, voteReasons, voteSanity, votesByPosition, wilson } from "./metrics.js";
import type { Judgment } from "./judge.js";
import type { GameLog } from "./types.js";

const players = ["A", "B", "C", "D"].map((name, seat) => ({
  seat, name, style: "", role: name === "D" ? ("impostor" as const) : ("civilian" as const), word: "w",
}));
const vote = (voter: string, target: string) => ({ voter, target, reason: "odd clue", fallback: false });
const round1: RoundRecord = {
  round: 1,
  clues: [
    { name: "A", text: "ok", rejected: [{ text: "w", reason: "word" }], passed: false },
    { name: "B", text: "", rejected: [{ text: "x", reason: "long" }, { text: "y", reason: "long" }], passed: true },
  ],
  // Civilians A, B, C vote; 2 of 3 hit D. D's own vote is ignored.
  votes: [vote("A", "D"), vote("B", "D"), vote("C", "A"), vote("D", "A")],
  eliminated: "D",
  eliminatedRole: "impostor",
};
const result: GameResult = {
  setup: { id: "t", seed: 1, mode: "mr-white", civilianWord: "w", impostorWord: null, players },
  rounds: [round1],
  winner: "civilians",
  impostorOutRound: 1,
  mrWhiteGuess: { guess: "v", correct: false },
  endReason: "impostor-eliminated",
};

describe("wilson", () => {
  it("brackets the observed rate", () => {
    const [lo, hi] = wilson({ hits: 5, n: 20 });
    expect(lo).toBeCloseTo(0.112, 2);
    expect(hi).toBeCloseTo(0.469, 2);
  });
});

describe("metrics", () => {
  it("counts civilian votes on the impostor against the random baseline", () => {
    expect(voteSanity([result])).toEqual([
      { round: 1, n: 3, hits: 2, baseline: 1 / 3 },
      { round: "all", n: 3, hits: 2, baseline: 1 / 3 },
    ]);
  });

  it("counts invalid clue attempts and passes", () => {
    const q = clueQuality([result]);
    expect(q).toMatchObject({ turns: 2, attempts: 4, invalid: 3, retriedTurns: 2, passes: 1 });
    expect(q.reasons.get("long")).toBe(2);
  });

  it("counts vote-reason rejections and votes left without a reason", () => {
    const r = structuredClone(result);
    r.rounds[0]!.votes[0] = { ...vote("A", "D"), reason: "", rejected: [{ text: "D | w", reason: "contains (x)" }] };
    expect(voteReasons([r])).toMatchObject({ votes: 4, retried: 1, noReason: 1, fallbacks: 0 });
  });

  it("computes the blend rate per role and round bucket", () => {
    const j = (role: "impostor" | "civilian", round: number, civilian: boolean) => ({ role, round, civilian }) as Judgment;
    const [imp, civ] = blend([j("impostor", 1, true), j("impostor", 2, false), j("impostor", 3, true), j("civilian", 1, true)]);
    expect(imp).toMatchObject({ round1: { hits: 1, n: 1 }, later: { hits: 1, n: 2 }, all: { hits: 2, n: 3 } });
    expect(civ!.all).toEqual({ hits: 1, n: 1 });
  });

  it("summarizes outcomes", () => {
    expect(outcomes([result])).toMatchObject({ civilianWins: 1, mrWhite: { eliminated: 1, correct: 0, wordAbsent: 1 } });
  });

  it("estimates phone time from evaluated and generated tokens", () => {
    const log: GameLog = {
      model: "Qwen3-4B.gguf", promptVersion: 3, votes: "model", wallMs: 1000, result,
      calls: [{ player: "A", kind: "clue", round: 1, attempt: 0, promptTokens: 220, evaluatedTokens: 22, generatedTokens: 5, ms: 1, output: "" }],
    };
    const pixel = cost([log]).phones[0]!;
    expect(pixel.name).toBe("Pixel 6a (6 GB)");
    expect(pixel.cachedSec).toBeCloseTo(22 / 22 + 5 / 5);
    expect(pixel.uncachedSec).toBeCloseTo(220 / 22 + 5 / 5);
  });
});

describe("run 3 metrics", () => {
  it("counts votes by speaking position against an even split", () => {
    const rows = votesByPosition([result]);
    // Clue order A, B; civilian votes A->D, B->D, C->A: only A (pos 1) is a speaker who got votes.
    expect(rows.map((r) => r.pos)).toEqual([1, 2]);
    expect(rows[0]!.got).toBe(1);
  });

  it("measures the 'X and Y' share and openers", () => {
    const s = clueShape(["sunny and sweet", "A tall glass", "sour and sticky", "a clear pane"]);
    expect(s).toMatchObject({ n: 4, andShape: 2 });
    expect(s.top[0]).toEqual(["a", 2]);
  });

  it("excludes the human seat's calls from agent cost", () => {
    const call = (player: string, kind: "clue" | "vote") =>
      ({ player, kind, round: 1, attempt: 0, promptTokens: 220, evaluatedTokens: 22, generatedTokens: 5, ms: 1000, output: "" });
    const log: GameLog = {
      model: "Qwen3-4B.gguf", promptVersion: 5, votes: "model", wallMs: 1, result, humanSeat: "B",
      calls: [call("A", "clue"), call("B", "clue"), call("A", "vote"), call("C", "vote")],
    };
    const c = agentCost([log]);
    expect(c.callsPerRound).toBe(3);
    expect(c.mac).toMatchObject({ round: 3, firstClue: 1, votePhase: 2 });
    expect(c.phones[0]!.cached.firstClue).toBeCloseTo(2);
  });
});
