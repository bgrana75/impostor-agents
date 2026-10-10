import type { CallLog } from "../core/agent.js";
import type { GameResult } from "../core/types.js";

export type VotePolicy = "model" | "random";

/** One line of results/games.jsonl. */
export interface GameLog {
  model: string;
  promptVersion: number;
  votes: VotePolicy;
  wallMs: number;
  result: GameResult;
  calls: Omit<CallLog, "messages">[];
}
