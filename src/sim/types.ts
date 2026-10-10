import type { CallLog } from "../core/agent.js";
import type { Strategy } from "../core/impostors.js";
import type { GameResult } from "../core/types.js";

export type VotePolicy = "model" | "random";

/** One line of results/games.jsonl. */
export interface GameLog {
  model: string;
  promptVersion: number;
  votes: VotePolicy;
  wallMs: number;
  result: GameResult;
  /** Run 3: the scripted human seat's strategy and name (its calls are not agent cost). */
  impostor?: Strategy;
  humanSeat?: string;
  calls: Omit<CallLog, "messages">[];
}
