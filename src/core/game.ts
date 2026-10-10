import { checkClue } from "./clue.js";
import { guessIsCorrect } from "./parse.js";
import { pick } from "./rng.js";
import { MAX_ROUNDS, tally, turnOrder } from "./rules.js";
import type { GameResult, GameSetup, Player, PlayerView, RoundRecord, Seat, VoteEntry } from "./types.js";

export const CLUE_ATTEMPTS = 3;

/** Snapshot of what `p` may see. Rounds are deep-copied so seats cannot mutate state. */
function viewFor(setup: GameSetup, p: Player, rounds: RoundRecord[], round: number, alive: Set<string>): PlayerView {
  return {
    setup: { mode: setup.mode, names: setup.players.map((x) => x.name) },
    me: { name: p.name, style: p.style, word: p.word, toldImpostor: setup.mode === "mr-white" && p.role === "impostor" },
    rounds: structuredClone(rounds),
    round,
    alive: setup.players.filter((x) => alive.has(x.name)).map((x) => x.name),
  };
}

/**
 * Plays one game. Pure apart from awaiting the seats: all randomness comes from `rng`,
 * and nothing secret leaves this function except through `viewFor`.
 */
export async function playGame(
  setup: GameSetup,
  seats: ReadonlyMap<string, Seat>,
  rng: () => number,
): Promise<GameResult> {
  const alive = new Set(setup.players.map((p) => p.name));
  const impostor = setup.players.find((p) => p.role === "impostor")!;
  const rounds: RoundRecord[] = [];
  const seat = (name: string) => seats.get(name) ?? fail(`no seat for ${name}`);
  const end = (
    winner: GameResult["winner"],
    endReason: GameResult["endReason"],
    impostorOutRound: number | null = null,
    mrWhiteGuess: GameResult["mrWhiteGuess"] = null,
  ): GameResult => ({ setup, rounds, winner, endReason, impostorOutRound, mrWhiteGuess });

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const record: RoundRecord = { round, clues: [], votes: [], eliminated: null, eliminatedRole: null };
    rounds.push(record);

    for (const p of turnOrder(setup.players, alive, round)) {
      const earlier = rounds.flatMap((r) => r.clues.filter((c) => !c.passed).map((c) => c.text));
      const rejected: { text: string; reason: string }[] = [];
      let accepted: string | null = null;
      for (let attempt = 0; attempt < CLUE_ATTEMPTS && accepted === null; attempt++) {
        const raw = await seat(p.name).clue(viewFor(setup, p, rounds, round, alive), rejected);
        const check = checkClue(raw, p.word, earlier);
        if (check.ok) accepted = check.text;
        else rejected.push({ text: raw, reason: check.reason });
      }
      // Rejected attempts stay private: a rejected clue may contain the player's word.
      record.clues.push({ name: p.name, text: accepted ?? "", rejected, passed: accepted === null });
    }

    // Votes are simultaneous: every voter sees the same log, without this round's votes.
    const voters = setup.players.filter((p) => alive.has(p.name));
    const votes: VoteEntry[] = [];
    for (const p of voters) {
      const candidates = voters.filter((x) => x !== p).map((x) => x.name);
      const out = await seat(p.name).vote(viewFor(setup, p, rounds, round, alive), candidates);
      votes.push(
        out && candidates.includes(out.target)
          ? { voter: p.name, target: out.target, reason: out.reason, fallback: false }
          : { voter: p.name, target: pick(rng, candidates), reason: "(no valid vote)", fallback: true },
      );
    }
    record.votes = votes;

    const out = tally(votes);
    if (out) {
      const outPlayer = setup.players.find((p) => p.name === out)!;
      record.eliminated = out;
      record.eliminatedRole = outPlayer.role;
      alive.delete(out);
      if (outPlayer === impostor) {
        if (setup.mode === "mr-white") {
          const guess = await seat(out).guess(viewFor(setup, outPlayer, rounds, round, alive));
          const correct = guessIsCorrect(guess, setup.civilianWord);
          return correct
            ? end("impostor", "mr-white-guessed", round, { guess, correct })
            : end("civilians", "impostor-eliminated", round, { guess, correct });
        }
        return end("civilians", "impostor-eliminated", round);
      }
    }
    if (alive.size <= 2) return end("impostor", "two-left");
  }
  return end("impostor", "max-rounds");
}

function fail(msg: string): never {
  throw new Error(msg);
}
