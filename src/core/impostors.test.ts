import { describe, expect, it } from "vitest";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { playGame } from "./game.js";
import { GENERIC_CLUES, ScriptedImpostor, contentWords, copycatClue, genericClue } from "./impostors.js";
import { makeRng } from "./rng.js";
import { SEATS, createGame, rotatedSeat } from "./setup.js";
import type { ClueEntry, PlayerView, Rejection, Seat } from "./types.js";

const clue = (name: string, text: string): ClueEntry => ({ name, text, rejected: [], passed: false });

function view(round: number, rounds: { round: number; clues: ClueEntry[] }[]): PlayerView {
  return {
    setup: { mode: "mr-white", names: ["Ana", "Bo", "Cy"] },
    me: { name: "Ana", style: "x", word: null, toldImpostor: true },
    rounds: rounds.map((r) => ({ ...r, votes: [], eliminated: null, eliminatedRole: null })),
    round,
    alive: ["Ana", "Bo", "Cy"],
  };
}

describe("copycat", () => {
  it("reuses content words from this round's clues", () => {
    const v = view(1, [{ round: 1, clues: [clue("Bo", "soft fur and whiskers")] }]);
    for (let i = 0; i < 20; i++) {
      const c = copycatClue(v, 0, makeRng(i));
      expect(contentWords(c).some((w) => ["soft", "fur", "whiskers"].includes(w)), c).toBe(true);
    }
  });

  it("falls back to the previous round, then to a generic clue when speaking first", () => {
    const prev = view(2, [{ round: 1, clues: [clue("Bo", "purrs loudly")] }, { round: 2, clues: [] }]);
    expect(contentWords(copycatClue(prev, 0, makeRng(1))).some((w) => ["purrs", "loudly"].includes(w))).toBe(true);
    expect(GENERIC_CLUES).toContain(copycatClue(view(1, [{ round: 1, clues: [] }]), 0, makeRng(1)));
  });

  it("never copies its own clues", () => {
    const v = view(1, [{ round: 1, clues: [clue("Ana", "mine only"), clue("Bo", "barks")] }]);
    expect(copycatClue(v, 0, makeRng(3))).toContain("barks");
  });
});

describe("generic", () => {
  it("avoids clues already said", () => {
    const v = view(2, [{ round: 1, clues: GENERIC_CLUES.slice(0, 9).map((t) => clue("Bo", t)) }]);
    expect(genericClue(v, 0, makeRng(1))).toBe(GENERIC_CLUES[9]);
  });
});

describe("ScriptedImpostor", () => {
  it("gives the honest clue-giver the word, and drops clues that say it", async () => {
    const seen: (string | null)[] = [];
    const answers = ["pear tree", "green and sweet"];
    const honest: Seat = {
      clue: async (v: PlayerView, _r: Rejection[]) => (seen.push(v.me.word), answers.shift()!),
      vote: async () => null,
      guess: async () => "",
    };
    const s = new ScriptedImpostor({ strategy: "perfect", rng: makeRng(1), honest: { seat: honest, word: "pear" } });
    expect(await s.clue(view(1, [{ round: 1, clues: [] }]), [])).toBe("green and sweet");
    expect(seen).toEqual(["pear", "pear"]);
  });

  it("votes for a candidate and never guesses the word", async () => {
    const s = new ScriptedImpostor({ strategy: "generic", rng: makeRng(2) });
    const v = await s.vote(view(1, []), ["Bo", "Cy"]);
    expect(["Bo", "Cy"]).toContain(v.target);
    expect(v.reason.length).toBeGreaterThan(0);
    expect(await s.guess()).toBe("unknown");
  });
});

describe("seat rotation", () => {
  it("cycles the impostor through every seat and keeps each seed's deal otherwise unchanged", () => {
    const seats = Array.from({ length: SEATS * 2 }, (_, i) => rotatedSeat(i + 1));
    expect(seats).toEqual([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);
    const plain = createGame(9, "mr-white", WORD_PAIRS, PERSONAS);
    const rotated = createGame(9, "mr-white", WORD_PAIRS, PERSONAS, { impostorSeat: rotatedSeat(9) });
    expect(rotated.civilianWord).toBe(plain.civilianWord);
    expect(rotated.players.map((p) => p.name)).toEqual(plain.players.map((p) => p.name));
    expect(rotated.players.findIndex((p) => p.role === "impostor")).toBe(rotatedSeat(9));
  });

  it("a scripted impostor plays a full game in the engine", async () => {
    const s = createGame(4, "mr-white", WORD_PAIRS, PERSONAS, { impostorSeat: 2 });
    const seats = new Map<string, Seat>();
    let n = 0;
    for (const p of s.players) {
      seats.set(
        p.name,
        p.role === "impostor"
          ? new ScriptedImpostor({ strategy: "copycat", rng: makeRng(4) })
          : { clue: async () => `honest clue ${n++}`, vote: async (_v, c) => ({ target: c[0]!, reason: "fits least" }), guess: async () => "" },
      );
    }
    const r = await playGame(s, seats, makeRng(4));
    const impClues = r.rounds.flatMap((rd) => rd.clues.filter((c) => c.name === s.players[2]!.name));
    expect(impClues.length).toBeGreaterThan(0);
    expect(impClues.every((c) => !c.passed)).toBe(true);
  });
});
