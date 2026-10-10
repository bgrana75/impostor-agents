import { describe, expect, it } from "vitest";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { playGame } from "./game.js";
import { makeRng } from "./rng.js";
import { createGame } from "./setup.js";
import type { GameSetup, PlayerView, Seat } from "./types.js";

type VoteRule = (view: PlayerView, candidates: string[]) => string;

function scripted(setup: GameSetup, voteRule: VoteRule, opts: { guess?: string; badFirstClue?: boolean } = {}) {
  const seats = new Map<string, Seat>();
  let n = 0;
  for (const p of setup.players) {
    seats.set(p.name, {
      async clue(view, rejected) {
        if (opts.badFirstClue && rejected.length === 0) return p.word ?? "same";
        return `clue ${n++}`;
      },
      async vote(view, candidates) {
        return { target: voteRule(view, candidates), reason: "because" };
      },
      async guess() {
        return opts.guess ?? "nothing";
      },
    });
  }
  return seats;
}

const impostorOf = (s: GameSetup) => s.players.find((p) => p.role === "impostor")!.name;
// Everyone votes the first civilian candidate in seating order: civilians fall one per round.
const civilianVotes = (s: GameSetup): VoteRule => (_v, c) => c.find((n) => n !== impostorOf(s))!;

describe("playGame", () => {
  it("civilians win when the undercover is voted out", async () => {
    const s = createGame(1, "undercover", WORD_PAIRS, PERSONAS);
    const imp = impostorOf(s);
    const r = await playGame(s, scripted(s, (_v, c) => (c.includes(imp) ? imp : c[0]!)), makeRng(1));
    expect(r.winner).toBe("civilians");
    expect(r.impostorOutRound).toBe(1);
    expect(r.rounds[0]!.eliminatedRole).toBe("impostor");
  });

  it("the impostor wins when two players are left", async () => {
    const s = createGame(2, "undercover", WORD_PAIRS, PERSONAS);
    const r = await playGame(s, scripted(s, civilianVotes(s)), makeRng(2));
    expect(r.winner).toBe("impostor");
    expect(r.endReason).toBe("two-left");
    expect(r.rounds).toHaveLength(4);
    expect(r.rounds[3]!.clues).toHaveLength(3);
  });

  it("ties eliminate nobody and the impostor wins after round 4", async () => {
    const s = createGame(3, "undercover", WORD_PAIRS, PERSONAS);
    const names = s.players.map((p) => p.name);
    // Each player votes for the next seat: six one-vote ties.
    const r = await playGame(s, scripted(s, (v) => names[(names.indexOf(v.me.name) + 1) % 6]!), makeRng(3));
    expect(r.rounds.every((x) => x.eliminated === null)).toBe(true);
    expect(r.endReason).toBe("max-rounds");
    expect(r.winner).toBe("impostor");
  });

  it("Mr. White wins by guessing the word after being voted out", async () => {
    const s = createGame(4, "mr-white", WORD_PAIRS, PERSONAS);
    const imp = impostorOf(s);
    const vote: VoteRule = (_v, c) => (c.includes(imp) ? imp : c[0]!);
    const right = await playGame(s, scripted(s, vote, { guess: s.civilianWord }), makeRng(4));
    expect(right).toMatchObject({ winner: "impostor", endReason: "mr-white-guessed", impostorOutRound: 1 });
    const wrong = await playGame(s, scripted(s, vote, { guess: "zzz" }), makeRng(4));
    expect(wrong).toMatchObject({ winner: "civilians", mrWhiteGuess: { correct: false } });
  });

  it("retries an invalid clue and keeps the rejection private", async () => {
    const s = createGame(5, "undercover", WORD_PAIRS, PERSONAS);
    const r = await playGame(s, scripted(s, civilianVotes(s), { badFirstClue: true }), makeRng(5));
    const first = r.rounds[0]!.clues[0]!;
    expect(first.rejected).toHaveLength(1);
    expect(first.passed).toBe(false);
    expect(first.text).not.toBe(first.rejected[0]!.text);
  });

  it("replaces an invalid vote with a random fallback", async () => {
    const s = createGame(6, "undercover", WORD_PAIRS, PERSONAS);
    const seats = scripted(s, () => "Nobody");
    const r = await playGame(s, seats, makeRng(6));
    expect(r.rounds[0]!.votes.every((v) => v.fallback)).toBe(true);
  });
});
