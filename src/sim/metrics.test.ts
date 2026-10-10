import { describe, expect, it } from "vitest";
import type { GameResult, RoundRecord } from "../core/types.js";
import { clueQuality, cost, outcomes, voteSanity } from "./metrics.js";
import type { GameLog } from "./types.js";

const players = ["A", "B", "C", "D"].map((name, seat) => ({
  seat, name, style: "", role: name === "D" ? ("impostor" as const) : ("civilian" as const), word: "w",
}));
const vote = (voter: string, target: string) => ({ voter, target, reason: "", fallback: false });
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

describe("metrics", () => {
  it("counts civilian votes on the impostor against the random baseline", () => {
    expect(voteSanity([result])).toEqual([{ round: 1, civilianVotes: 3, hits: 2, baseline: 1 / 3 }]);
  });

  it("counts invalid clue attempts and passes", () => {
    const q = clueQuality([result]);
    expect(q).toMatchObject({ turns: 2, attempts: 4, invalid: 3, retriedTurns: 2, passes: 1 });
    expect(q.reasons.get("long")).toBe(2);
  });

  it("summarizes outcomes", () => {
    expect(outcomes([result])).toMatchObject({ civilianWins: 1, mrWhite: { eliminated: 1, correct: 0 } });
  });

  it("estimates phone time from evaluated and generated tokens", () => {
    const log: GameLog = {
      model: "m", promptVersion: 3, votes: "model", wallMs: 1000, result,
      calls: [{ player: "A", kind: "clue", round: 1, attempt: 0, promptTokens: 220, evaluatedTokens: 22, generatedTokens: 5, ms: 1, output: "" }],
    };
    const pixel = cost([log]).phones[0]!;
    expect(pixel.cachedSec).toBeCloseTo(22 / 22 + 5 / 5);
    expect(pixel.uncachedSec).toBeCloseTo(220 / 22 + 5 / 5);
  });
});
