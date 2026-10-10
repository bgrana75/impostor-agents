export type Mode = "undercover" | "mr-white";
export type Role = "civilian" | "impostor";

export interface Persona {
  name: string;
  style: string;
}

export interface Player {
  seat: number;
  name: string;
  style: string;
  role: Role;
  /** null for Mr. White */
  word: string | null;
}

export interface WordPair {
  a: string;
  b: string;
}

export interface GameSetup {
  id: string;
  seed: number;
  mode: Mode;
  civilianWord: string;
  /** The undercover's word in mode A, null in mode B. */
  impostorWord: string | null;
  players: Player[];
}

export interface ClueEntry {
  name: string;
  text: string;
  /** Rejected attempts before the accepted one (or before giving up). Private. */
  rejected: Rejection[];
  /** True when every attempt was rejected and the player passed. */
  passed: boolean;
  /** True when the accepted clue was cut at a comma to fit the length rule. */
  trimmed?: boolean;
}

export interface Rejection {
  text: string;
  reason: string;
}

export interface VoteEntry {
  voter: string;
  target: string;
  reason: string;
  /** Rejected attempts (unreadable vote, or a reason that broke the rules). Private. */
  rejected?: Rejection[];
  /** True when no attempt named a valid target and a random one was used. */
  fallback: boolean;
}

export interface RoundRecord {
  round: number;
  clues: ClueEntry[];
  votes: VoteEntry[];
  eliminated: string | null;
  eliminatedRole: Role | null;
}

export type Winner = "civilians" | "impostor";

export interface GameResult {
  setup: GameSetup;
  rounds: RoundRecord[];
  winner: Winner;
  /** Round in which the impostor was voted out, if they were. */
  impostorOutRound: number | null;
  mrWhiteGuess: { guess: string; correct: boolean; rejected?: Rejection[] } | null;
  endReason: "impostor-eliminated" | "mr-white-guessed" | "two-left" | "max-rounds";
}

/** What one seat is allowed to know when it acts. Built fresh for every turn. */
export interface PlayerView {
  setup: Pick<GameSetup, "mode"> & { names: string[] };
  me: { name: string; style: string; word: string | null; toldImpostor: boolean };
  rounds: RoundRecord[];
  round: number;
  alive: string[];
}

/** One player. An LLM agent or, later, a human; either way it only ever sees its own view. */
export interface Seat {
  clue(view: PlayerView, rejected: Rejection[]): Promise<string>;
  /** null when the answer named nobody valid. */
  vote(view: PlayerView, candidates: string[], rejected: Rejection[]): Promise<{ target: string; reason: string } | null>;
  guess(view: PlayerView, rejected: Rejection[]): Promise<string>;
}

// --- LLM interface (implemented in src/llm) ---

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type OutputShape =
  | { kind: "clue" }
  | { kind: "vote"; names: string[] }
  | { kind: "guess" }
  | { kind: "assess"; exclude: string[] }
  | { kind: "judge" };

export interface GenerateRequest {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  shape?: OutputShape;
  seed?: number;
}

export interface GenerateResult {
  text: string;
  promptTokens: number;
  /** Prompt tokens actually evaluated (the rest came from the KV cache). */
  evaluatedTokens?: number;
  generatedTokens: number;
  ms: number;
}

export interface Llm {
  generate(req: GenerateRequest): Promise<GenerateResult>;
}
