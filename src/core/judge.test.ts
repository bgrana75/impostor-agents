import { describe, expect, it } from "vitest";
import { NONE_OPTION, judgeItems, judgePrompt, parseJudge } from "./judge.js";
import type { GameResult } from "./types.js";

function game(mode: "undercover" | "mr-white"): GameResult {
  const players = ["Ana", "Bo", "Cy"].map((name, seat) => ({
    seat, name, style: "a tester; talks a lot", role: name === "Cy" ? ("impostor" as const) : ("civilian" as const),
    word: name === "Cy" ? (mode === "undercover" ? "pool" : null) : "beach",
  }));
  return {
    setup: { id: "g", seed: 1, mode, civilianWord: "beach", impostorWord: mode === "undercover" ? "pool" : null, players },
    rounds: [{
      round: 1,
      clues: [
        { name: "Ana", text: "warm sand", rejected: [], passed: false },
        { name: "Bo", text: "", rejected: [], passed: true },
        { name: "Cy", text: "chlorine smell", rejected: [], passed: false },
      ],
      votes: [], eliminated: null, eliminatedRole: null,
    }],
    winner: "impostor", impostorOutRound: null, mrWhiteGuess: null, endReason: "max-rounds",
  };
}

describe("judge", () => {
  it("judges every accepted clue, alternating which option is the civilians' word", () => {
    const items = judgeItems(game("undercover"));
    expect(items.map((i) => [i.player, i.role, i.civilianOption])).toEqual([["Ana", "civilian", "A"], ["Cy", "impostor", "B"]]);
    expect(items[1]!.options).toEqual(["pool", "beach"]);
  });

  it("offers 'none' as the other option for Mr. White games", () => {
    expect(judgeItems(game("mr-white"))[0]!.options).toEqual(["beach", NONE_OPTION]);
  });

  it("builds a neutral prompt: the clue and the two options only, no persona or names", () => {
    const item = judgeItems(game("undercover"))[1]!;
    const text = judgePrompt(item).map((m) => m.content).join("\n");
    expect(text).toContain('Clue: "chlorine smell"');
    expect(text).toContain("A: pool\nB: beach");
    expect(text).not.toMatch(/Cy|tester|undercover|impostor/);
  });

  it("parses the letter", () => {
    expect(parseJudge("B")).toBe("B");
    expect(parseJudge(" a.")).toBe("A");
    expect(parseJudge("maybe")).toBeNull();
  });
});
