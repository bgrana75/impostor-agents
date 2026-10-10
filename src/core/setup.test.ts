import { describe, expect, it } from "vitest";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { createGame, pairFor } from "./setup.js";

describe("createGame", () => {
  it("is reproducible per seed", () => {
    expect(createGame(7, "undercover", WORD_PAIRS, PERSONAS)).toEqual(createGame(7, "undercover", WORD_PAIRS, PERSONAS));
  });

  it("deals one undercover with the other word of the pair", () => {
    const g = createGame(3, "undercover", WORD_PAIRS, PERSONAS);
    const imp = g.players.filter((p) => p.role === "impostor");
    expect(imp).toHaveLength(1);
    expect(imp[0]!.word).toBe(g.impostorWord);
    expect(g.impostorWord).not.toBe(g.civilianWord);
    expect(g.players.filter((p) => p.word === g.civilianWord)).toHaveLength(5);
  });

  it("gives Mr. White no word", () => {
    const g = createGame(3, "mr-white", WORD_PAIRS, PERSONAS);
    expect(g.players.find((p) => p.role === "impostor")!.word).toBeNull();
  });

  it("covers 40 distinct pairs with seeds 1-20 across both modes", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const mode of ["undercover", "mr-white"] as const) {
        const pair = pairFor(seed, mode, WORD_PAIRS);
        expect([pair.a, pair.b]).toContain(createGame(seed, mode, WORD_PAIRS, PERSONAS).civilianWord);
        seen.add(`${pair.a}/${pair.b}`);
      }
    }
    expect(seen.size).toBe(40);
  });

  it("has at least 40 distinct pairs", () => {
    expect(new Set(WORD_PAIRS.map((p) => `${p.a}/${p.b}`)).size).toBeGreaterThanOrEqual(40);
  });
});
