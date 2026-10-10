import { checkClue, checkGuess, checkReason } from "./clue.js";
import { guessIsCorrect } from "./parse.js";
import { pick } from "./rng.js";
import { ATTEMPTS, MAX_ROUNDS, tally, turnOrder } from "./rules.js";
import type { GameResult, GameSetup, Player, PlayerView, Rejection, RoundRecord, Seat, VoteEntry } from "./types.js";

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
      const rejected: Rejection[] = [];
      let accepted: string | null = null;
      for (let attempt = 0; attempt < ATTEMPTS && accepted === null; attempt++) {
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
      votes.push(await collectVote(seat(p.name), viewFor(setup, p, rounds, round, alive), p.word, candidates, rng));
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
          const view = viewFor(setup, outPlayer, rounds, round, alive);
          const rejected: Rejection[] = [];
          let guess = "";
          for (let attempt = 0; attempt < ATTEMPTS && !guess; attempt++) {
            const raw = await seat(out).guess(view, rejected);
            const check = checkGuess(raw, view.setup.names);
            if (check.ok) guess = check.text;
            else rejected.push({ text: raw, reason: check.reason });
          }
          const correct = guess !== "" && guessIsCorrect(guess, setup.civilianWord);
          const mrWhiteGuess = { guess, correct, rejected };
          return correct
            ? end("impostor", "mr-white-guessed", round, mrWhiteGuess)
            : end("civilians", "impostor-eliminated", round, mrWhiteGuess);
        }
        return end("civilians", "impostor-eliminated", round);
      }
    }
    if (alive.size <= 2) return end("impostor", "two-left");
  }
  return end("impostor", "max-rounds");
}

/**
 * A vote is retried when it names nobody valid or its reason breaks the rules. After the
 * last try a valid target is kept without its reason; with no valid target at all, a
 * random one is used.
 */
async function collectVote(
  seat: Seat,
  view: PlayerView,
  ownWord: string | null,
  candidates: string[],
  rng: () => number,
): Promise<VoteEntry> {
  const voter = view.me.name;
  const rejected: Rejection[] = [];
  let target: string | null = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const out = await seat.vote(view, candidates, rejected);
    if (!out || !candidates.includes(out.target)) {
      rejected.push({ text: out ? `${out.target} | ${out.reason}` : "", reason: "it does not name one of the candidates" });
      continue;
    }
    target = out.target;
    const check = checkReason(out.reason, ownWord);
    if (check.ok) return { voter, target, reason: check.text, rejected, fallback: false };
    rejected.push({ text: `${out.target} | ${out.reason}`, reason: check.reason });
  }
  if (target) return { voter, target, reason: "", rejected, fallback: false };
  return { voter, target: pick(rng, candidates), reason: "", rejected, fallback: true };
}

function fail(msg: string): never {
  throw new Error(msg);
}
