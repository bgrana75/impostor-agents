import { makeRng, pick, shuffle } from "./rng.js";
import type { GameSetup, Mode, Persona, Player, WordPair } from "./types.js";

export const SEATS = 6;

export function createGame(
  seed: number,
  mode: Mode,
  pairs: readonly WordPair[],
  personas: readonly Persona[],
): GameSetup {
  if (personas.length < SEATS) throw new Error(`need ${SEATS} personas`);
  const rng = makeRng(seed);
  const pair = pick(rng, pairs);
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
