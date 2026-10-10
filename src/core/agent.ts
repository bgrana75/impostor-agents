import { parseClue, parseGuess, parseVote } from "./parse.js";
import { cluePrompt, guessPrompt, votePrompt } from "./prompts.js";
import type { ChatMessage, GenerateRequest, GenerateResult, Llm, OutputShape, PlayerView, Seat } from "./types.js";

export type CallKind = "clue" | "vote" | "guess";

export interface CallLog {
  player: string;
  kind: CallKind;
  round: number;
  /** 0 for the first try, 1+ for retries after an invalid clue or unparseable vote. */
  attempt: number;
  promptTokens: number;
  evaluatedTokens?: number;
  generatedTokens: number;
  ms: number;
  output: string;
  messages: ChatMessage[];
}

export const LIMITS = {
  clue: { maxTokens: 16, temperature: 0.7 },
  vote: { maxTokens: 40, temperature: 0.3 },
  guess: { maxTokens: 8, temperature: 0.3 },
} as const;

/** A seat played by an LLM: one isolated call per turn, prompt built only from the view. */
export class LlmSeat implements Seat {
  constructor(
    private llm: Llm,
    private onCall: (log: CallLog) => void,
    private nextSeed: () => number,
  ) {}

  private async call(kind: CallKind, view: PlayerView, attempt: number, messages: ChatMessage[], shape: OutputShape) {
    const req: GenerateRequest = { messages, ...LIMITS[kind], shape, seed: this.nextSeed() };
    const res: GenerateResult = await this.llm.generate(req);
    this.onCall({
      player: view.me.name,
      kind,
      round: view.round,
      attempt,
      promptTokens: res.promptTokens,
      evaluatedTokens: res.evaluatedTokens,
      generatedTokens: res.generatedTokens,
      ms: res.ms,
      output: res.text,
      messages,
    });
    return res.text;
  }

  async clue(view: PlayerView, rejected: { text: string; reason: string }[]): Promise<string> {
    const text = await this.call("clue", view, rejected.length, cluePrompt(view, rejected), { kind: "clue" });
    return parseClue(text, view.setup.names);
  }

  async vote(view: PlayerView, candidates: string[]) {
    const messages = votePrompt(view, candidates);
    for (let attempt = 0; attempt < 2; attempt++) {
      const parsed = parseVote(await this.call("vote", view, attempt, messages, { kind: "vote", names: candidates }), candidates);
      if (parsed) return parsed;
    }
    return null;
  }

  async guess(view: PlayerView): Promise<string> {
    return parseGuess(await this.call("guess", view, 0, guessPrompt(view), { kind: "guess" }));
  }
}

/** Baseline: clues from the wrapped seat, votes uniformly at random. */
export class RandomVoter implements Seat {
  constructor(private inner: Seat, private rng: () => number) {}
  clue(view: PlayerView, rejected: { text: string; reason: string }[]) {
    return this.inner.clue(view, rejected);
  }
  async vote(_view: PlayerView, candidates: string[]) {
    return { target: candidates[Math.floor(this.rng() * candidates.length)]!, reason: "(random baseline)" };
  }
  guess(view: PlayerView) {
    return this.inner.guess(view);
  }
}
