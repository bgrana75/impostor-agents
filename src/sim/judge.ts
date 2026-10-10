import { appendFileSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { judgeItems, judgePrompt, parseJudge, type JudgeItem } from "../core/judge.js";
import { LlamaCppLlm } from "../llm/llamaCpp.js";
import { DEFAULT_MODEL } from "./models.js";
import type { GameLog } from "./types.js";

/** One line of <dir>/judge.jsonl. Judge calls are not part of any game's cost. */
export interface Judgment extends JudgeItem {
  gameId: string;
  mode: string;
  votes: string;
  judgeModel: string;
  answer: "A" | "B" | null;
  /** The judge read the clue as the civilians' word. */
  civilian: boolean;
  promptTokens: number;
  generatedTokens: number;
  ms: number;
}

const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "results" },
    model: { type: "string", default: DEFAULT_MODEL },
    votes: { type: "string", default: "model" },
  },
});

const logs: GameLog[] = readFileSync(join(values.dir, "games.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const out = join(values.dir, "judge.jsonl");
rmSync(out, { force: true });
const llm = await LlamaCppLlm.load(values.model);

let n = 0;
for (const log of logs.filter((l) => values.votes.split(",").includes(l.votes))) {
  for (const item of judgeItems(log.result)) {
    const res = await llm.generate({ messages: judgePrompt(item), maxTokens: 2, temperature: 0, shape: { kind: "judge" }, seed: 0 });
    const answer = parseJudge(res.text);
    const j: Judgment = {
      ...item,
      gameId: log.result.setup.id,
      mode: log.result.setup.mode,
      votes: log.votes,
      judgeModel: basename(values.model),
      answer,
      civilian: answer === item.civilianOption,
      promptTokens: res.promptTokens,
      generatedTokens: res.generatedTokens,
      ms: res.ms,
    };
    appendFileSync(out, JSON.stringify(j) + "\n");
    n++;
  }
}
console.log(`judged ${n} clues -> ${out}`);
await llm.dispose();
