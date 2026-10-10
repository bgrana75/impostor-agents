import { appendFileSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { informItems, judgeItems, judgePrompt, parseJudge, type JudgeItem } from "../core/judge.js";
import { makeRng } from "../core/rng.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { LlamaCppLlm } from "../llm/llamaCpp.js";
import { DEFAULT_MODEL } from "./models.js";
import type { GameLog } from "./types.js";

/** One line of <dir>/judge.jsonl. Judge calls are not part of any game's cost. */
export interface Judgment extends JudgeItem {
  gameId: string;
  mode: string;
  votes: string;
  impostor?: string;
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
    // blend: civilians' word vs the impostor's word / "none"; inform: vs a random distractor.
    kind: { type: "string", default: "blend" },
    modes: { type: "string", default: "undercover,mr-white" },
    out: { type: "string" },
  },
});

const logs: GameLog[] = readFileSync(join(values.dir, "games.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const out = values.out ?? join(values.dir, values.kind === "inform" ? "inform.jsonl" : "judge.jsonl");
rmSync(out, { force: true });
const llm = await LlamaCppLlm.load(values.model);

let n = 0;
const wanted = (l: GameLog) => values.votes.split(",").includes(l.votes) && values.modes.split(",").includes(l.result.setup.mode);
for (const log of logs.filter(wanted)) {
  const items =
    values.kind === "inform" ? informItems(log.result, WORD_PAIRS, makeRng(log.result.setup.seed * 7919)) : judgeItems(log.result);
  for (const item of items) {
    const res = await llm.generate({ messages: judgePrompt(item), maxTokens: 2, temperature: 0, shape: { kind: "judge" }, seed: 0 });
    const answer = parseJudge(res.text);
    const j: Judgment = {
      ...item,
      gameId: log.result.setup.id,
      mode: log.result.setup.mode,
      votes: log.votes,
      ...(log.impostor ? { impostor: log.impostor } : {}),
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
