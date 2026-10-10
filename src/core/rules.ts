import type { Player, VoteEntry } from "./types.js";

export const MAX_ROUNDS = 4;
export const CLUE_MAX_WORDS = 8;
export const REASON_MAX_WORDS = 12;
/** Tries per clue, vote and guess before the engine gives up on that turn. */
export const ATTEMPTS = 3;

/** Alive players in clue order: the starting seat rotates by one each round. */
export function turnOrder(players: readonly Player[], alive: ReadonlySet<string>, round: number): Player[] {
  const n = players.length;
  const start = (round - 1) % n;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    const p = players[(start + i) % n]!;
    if (alive.has(p.name)) order.push(p);
  }
  return order;
}

/** Plurality winner, or null on a tie for the most votes. */
export function tally(votes: readonly VoteEntry[]): string | null {
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.target, (counts.get(v.target) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  let tied = false;
  for (const [name, c] of counts) {
    if (c > bestCount) [best, bestCount, tied] = [name, c, false];
    else if (c === bestCount) tied = true;
  }
  return tied ? null : best;
}
