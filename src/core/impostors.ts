import { containsWord, normalize } from "./clue.js";
import type { PlayerView, Rejection, Seat } from "./types.js";

/**
 * Scripted stand-ins for a human Mr. White, bracketing what a person would do:
 * perfect (secretly knows the word), copycat (paraphrases recent clues), generic
 * (deliberately vague) and off-topic (honest clues about some other word).
 */
export type Strategy = "perfect" | "copycat" | "generic" | "off-topic";
export const STRATEGIES: Strategy[] = ["perfect", "copycat", "generic", "off-topic"];

export const GENERIC_CLUES = [
  "something common",
  "people like it",
  "found at home",
  "seen outdoors",
  "everyone knows it",
  "pretty useful",
  "you see it often",
  "comes in many sizes",
  "kids know it",
  "nothing unusual about it",
];

const STOP = new Set(
  ("a an the and or but of in on at to for with from by as is are was be it its it's this that very " +
    "really quite so too not no my your you i we they he she them his her our their all some any one " +
    "can will just like than then there here when where what who how always never often more most").split(" "),
);

/** Content words of a clue, in order: what a person would latch on to. */
export function contentWords(text: string): string[] {
  return normalize(text).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
}

const ONE = ["very {a}", "{a}, definitely", "kind of {a}", "always {a}", "{a}, for sure", "quite {a} really"];
const TWO = ["{a} and {b}", "{b}, {a}", "{a}, also {b}", "{b} but {a}"];

/**
 * A paraphrase of a recent clue: one or two of its content words in a new frame.
 * Prefers this round's clues, then the previous round's; `attempt` walks to the next
 * candidate after a rejection (usually a repeat).
 */
export function copycatClue(view: PlayerView, attempt: number, rng: () => number): string {
  const others = (round: number) =>
    view.rounds.find((r) => r.round === round)?.clues.filter((c) => c.name !== view.me.name && !c.passed) ?? [];
  const pool = [...others(view.round).reverse(), ...others(view.round - 1)];
  const words = pool.map((c) => contentWords(c.text)).filter((ws) => ws.length > 0);
  if (words.length === 0) return GENERIC_CLUES[(Math.floor(rng() * GENERIC_CLUES.length) + attempt) % GENERIC_CLUES.length]!;
  const source = words[attempt % words.length]!;
  const pickWord = (ws: string[]) => ws[Math.floor(rng() * ws.length)]!;
  const a = pickWord(source);
  const second = words[(attempt + 1) % words.length]!.filter((w) => w !== a);
  if (second.length > 0 && rng() < 0.5) {
    const frame = TWO[Math.floor(rng() * TWO.length)]!;
    return frame.replace("{a}", a).replace("{b}", pickWord(second));
  }
  return ONE[Math.floor(rng() * ONE.length)]!.replace("{a}", a);
}

export function genericClue(view: PlayerView, attempt: number, rng: () => number): string {
  const used = new Set(view.rounds.flatMap((r) => r.clues.map((c) => normalize(c.text))));
  const fresh = GENERIC_CLUES.filter((c) => !used.has(normalize(c)));
  const list = fresh.length ? fresh : GENERIC_CLUES;
  return list[(Math.floor(rng() * list.length) + attempt) % list.length]!;
}

const DEFLECTIONS = ["that clue felt off", "too vague for me", "not convinced", "just a hunch", "seemed like a guess"];

export interface ImpostorOptions {
  strategy: Strategy;
  rng: () => number;
  /** For perfect and off-topic: an honest clue-giver (an LLM seat) and the word it is given. */
  honest?: { seat: Seat; word: string };
}

/**
 * The human seat, scripted. Always Mr. White in the engine (no word); votes for a random
 * other player, as a person deflecting would; never attempts the final guess, so being
 * voted out means being caught.
 */
export class ScriptedImpostor implements Seat {
  constructor(private opts: ImpostorOptions) {}

  async clue(view: PlayerView, rejected: Rejection[]): Promise<string> {
    const { strategy, rng, honest } = this.opts;
    if (strategy === "copycat") return copycatClue(view, rejected.length, rng);
    if (strategy === "generic") return genericClue(view, rejected.length, rng);
    if (!honest) throw new Error(`${strategy} needs an honest clue-giver`);
    // Give the clue-giver the word, as if this seat were a civilian.
    const asCivilian: PlayerView = { ...view, me: { ...view.me, word: honest.word, toldImpostor: false } };
    for (let i = 0; i < 3; i++) {
      const clue = await honest.seat.clue(asCivilian, rejected);
      // The engine only checks Mr. White for repeats, so keep the given word out here.
      if (!containsWord(clue, honest.word)) return clue;
      rejected = [...rejected, { text: clue, reason: "it contains your secret word or a form of it" }];
    }
    return genericClue(view, rejected.length, rng);
  }

  async vote(_view: PlayerView, candidates: string[]) {
    const { rng } = this.opts;
    const target = candidates[Math.floor(rng() * candidates.length)]!;
    return { target, reason: DEFLECTIONS[Math.floor(rng() * DEFLECTIONS.length)]! };
  }

  async guess(): Promise<string> {
    return "unknown";
  }
}
