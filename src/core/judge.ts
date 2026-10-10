import type { ChatMessage, GameResult, Role } from "./types.js";

// Post-hoc bluff judge: not part of the game. One neutral call per clue asks which of
// two options the clue describes; a bluffing impostor's clues should read as the
// civilians' word.

export const NONE_OPTION = "none of these (unrelated or unclear)";

export interface JudgeItem {
  player: string;
  role: Role;
  round: number;
  clue: string;
  /** options[0] and options[1] in the order shown as A and B. */
  options: [string, string];
  /** Which option is the civilians' word. */
  civilianOption: "A" | "B";
}

/** Every accepted clue of a game, with A/B order alternating so position bias averages out. */
export function judgeItems(r: GameResult): JudgeItem[] {
  const { civilianWord, impostorWord } = r.setup;
  const other = impostorWord ?? NONE_OPTION;
  const items: JudgeItem[] = [];
  for (const rd of r.rounds) {
    for (const c of rd.clues) {
      if (c.passed) continue;
      const player = r.setup.players.find((p) => p.name === c.name)!;
      const flip = items.length % 2 === 1;
      items.push({
        player: c.name,
        role: player.role,
        round: rd.round,
        clue: c.text,
        options: flip ? [other, civilianWord] : [civilianWord, other],
        civilianOption: flip ? "B" : "A",
      });
    }
  }
  return items;
}

export function judgePrompt(item: Pick<JudgeItem, "clue" | "options">): ChatMessage[] {
  return [
    { role: "system", content: "You judge clues from a word-guessing party game. Answer with one letter." },
    {
      role: "user",
      content: `Clue: "${item.clue}"\nWhich does this clue describe better?\nA: ${item.options[0]}\nB: ${item.options[1]}\nAnswer A or B.`,
    },
  ];
}

export function parseJudge(text: string): "A" | "B" | null {
  const m = /^\s*([AB])\b/i.exec(text);
  return m ? (m[1]!.toUpperCase() as "A" | "B") : null;
}

/**
 * Informativeness: does a clue point at the civilians' word rather than a random
 * distractor from the pair list (never either word of this game's pair)?
 */
export function informItems(r: GameResult, pairs: readonly { a: string; b: string }[], rng: () => number): JudgeItem[] {
  const { civilianWord } = r.setup;
  const own = pairs.find((p) => p.a === civilianWord || p.b === civilianWord);
  const pool = pairs.filter((p) => p !== own).flatMap((p) => [p.a, p.b]);
  const items: JudgeItem[] = [];
  for (const rd of r.rounds) {
    for (const c of rd.clues) {
      if (c.passed) continue;
      const distractor = pool[Math.floor(rng() * pool.length)]!;
      const flip = items.length % 2 === 1;
      items.push({
        player: c.name,
        role: r.setup.players.find((p) => p.name === c.name)!.role,
        round: rd.round,
        clue: c.text,
        options: flip ? [distractor, civilianWord] : [civilianWord, distractor],
        civilianOption: flip ? "B" : "A",
      });
    }
  }
  return items;
}
