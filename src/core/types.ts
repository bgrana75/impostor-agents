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
  /** Rejected attempts before the accepted one (or before giving up). */
  rejected: { text: string; reason: string }[];
  /** True when every attempt was rejected and the player passed. */
  passed: boolean;
}

export interface VoteEntry {
  voter: string;
  target: string;
  reason: string;
  /** True when the output could not be parsed and a random target was used. */
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
  mrWhiteGuess: { guess: string; correct: boolean } | null;
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

export interface Seat {
  clue(view: PlayerView, rejected: { text: string; reason: string }[]): Promise<string>;
  vote(view: PlayerView, candidates: string[]): Promise<{ target: string; reason: string } | null>;
  guess(view: PlayerView): Promise<string>;
}

// --- LLM interface (implemented in src/llm) ---

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type OutputShape =
  | { kind: "clue" }
  | { kind: "vote"; names: string[] }
  | { kind: "guess" };

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
