import { makeRng, shuffle } from "./rng.js";
import type { GameSetup, Mode, Persona, Player, WordPair } from "./types.js";

export const SEATS = 6;
const MODES: Mode[] = ["undercover", "mr-white"];

/**
 * Seed n takes pair slot 2(n-1) + mode of one fixed shuffle of the list, so seeds
 * 1..k cover 2k distinct pairs across the two modes (wrapping after the list ends).
 */
export function pairFor(seed: number, mode: Mode, pairs: readonly WordPair[]): WordPair {
  const order = shuffle(makeRng(0x5eed), pairs);
  const slot = (seed - 1) * MODES.length + MODES.indexOf(mode);
  return order[((slot % order.length) + order.length) % order.length]!;
}

export function createGame(
  seed: number,
  mode: Mode,
  pairs: readonly WordPair[],
  personas: readonly Persona[],
): GameSetup {
  if (personas.length < SEATS) throw new Error(`need ${SEATS} personas`);
  // Mode is mixed into the seed so the two modes are independent deals.
  const rng = makeRng(seed * 2 + MODES.indexOf(mode));
  const pair = pairFor(seed, mode, pairs);
  const [civilianWord, otherWord] = rng() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];
  const cast = shuffle(rng, personas).slice(0, SEATS);
  const impostorSeat = Math.floor(rng() * SEATS);
  const impostorWord = mode === "undercover" ? otherWord : null;

  const players: Player[] = cast.map((p, seat) => {
    const isImpostor = seat === impostorSeat;
    return {
      seat,
      name: p.name,
      style: p.style,
      role: isImpostor ? "impostor" : "civilian",
      word: isImpostor ? impostorWord : civilianWord,
    };
  });
  return { id: `${mode}-${seed}`, seed, mode, civilianWord, impostorWord, players };
}
