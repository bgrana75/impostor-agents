import { parseAssessment, parseClue, parseGuess, parseVote } from "./parse.js";
import { assessPrompt, cluePrompt, guessPrompt, votePrompt, type Assessment } from "./prompts.js";
import type { ChatMessage, Llm, OutputShape, PlayerView, Rejection, Seat } from "./types.js";

export type CallKind = "clue" | "vote" | "guess" | "assess";

export interface CallLog {
  player: string;
  kind: CallKind;
  round: number;
  /** 0 for the first try, 1+ for retries after a rejected answer. */
  attempt: number;
  /** True for calls whose output never enters the public log (the ODD/FIT step). */
  private?: boolean;
  promptTokens: number;
  evaluatedTokens?: number;
  generatedTokens: number;
  ms: number;
  output: string;
  messages: ChatMessage[];
}

export const LIMITS = {
  clue: { maxTokens: 16, temperature: 0.5 },
  vote: { maxTokens: 30, temperature: 0.3 },
  guess: { maxTokens: 8, temperature: 0.3 },
  assess: { maxTokens: 8, temperature: 0.3 },
} as const;

/**
 * A seat played by an LLM: one isolated call per turn, prompt built only from the view
 * plus this seat's own private notes (the mode-A ODD/FIT check).
 */
export class LlmSeat implements Seat {
  private notes = new Map<number, Assessment>();

  constructor(
    private llm: Llm,
    private onCall: (log: CallLog) => void,
    private nextSeed: () => number,
  ) {}

  private async call(kind: CallKind, view: PlayerView, attempt: number, messages: ChatMessage[], shape: OutputShape) {
    const res = await this.llm.generate({ messages, ...LIMITS[kind], shape, seed: this.nextSeed() });
    this.onCall({
      player: view.me.name,
      kind,
      round: view.round,
      attempt,
      ...(kind === "assess" ? { private: true } : {}),
      promptTokens: res.promptTokens,
      evaluatedTokens: res.evaluatedTokens,
      generatedTokens: res.generatedTokens,
      ms: res.ms,
      output: res.text,
      messages,
    });
    return res.text;
  }

  /** Mode A, round 2 on: once per round, privately ask whether the clues fit our word. */
  private async assess(view: PlayerView): Promise<Assessment | undefined> {
    if (view.setup.mode !== "undercover" || view.round < 2) return undefined;
    let note = this.notes.get(view.round);
    if (!note) {
      const shape: OutputShape = { kind: "assess", exclude: view.me.word ? [view.me.word] : [] };
      note = parseAssessment(await this.call("assess", view, 0, assessPrompt(view), shape));
      this.notes.set(view.round, note);
    }
    return note;
  }

  async clue(view: PlayerView, rejected: Rejection[]): Promise<string> {
    const note = await this.assess(view);
    const text = await this.call("clue", view, rejected.length, cluePrompt(view, rejected, note), { kind: "clue" });
    return parseClue(text, view.setup.names);
  }

  async vote(view: PlayerView, candidates: string[], rejected: Rejection[]) {
    const messages = votePrompt(view, candidates, rejected, this.notes.get(view.round));
    const text = await this.call("vote", view, rejected.length, messages, { kind: "vote", names: candidates });
    return parseVote(text, candidates);
  }

  async guess(view: PlayerView, rejected: Rejection[]): Promise<string> {
    const shape: OutputShape = { kind: "guess", exclude: view.setup.names };
    return parseGuess(await this.call("guess", view, rejected.length, guessPrompt(view, rejected), shape));
  }
}

/** Baseline: clues from the wrapped seat, votes uniformly at random. */
export class RandomVoter implements Seat {
  constructor(private inner: Seat, private rng: () => number) {}
  clue(view: PlayerView, rejected: Rejection[]) {
    return this.inner.clue(view, rejected);
  }
  async vote(_view: PlayerView, candidates: string[]) {
    return { target: candidates[Math.floor(this.rng() * candidates.length)]!, reason: "(random baseline)" };
  }
  guess(view: PlayerView, rejected: Rejection[]) {
    return this.inner.guess(view, rejected);
  }
}
