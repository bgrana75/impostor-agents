import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { LlmSeat, RandomVoter, type CallLog } from "../core/agent.js";
import { playGame } from "../core/game.js";
import { PROMPT_VERSION } from "../core/prompts.js";
import { makeRng } from "../core/rng.js";
import { createGame } from "../core/setup.js";
import type { Mode, Seat } from "../core/types.js";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { LlamaCppLlm } from "../llm/llamaCpp.js";
import type { GameLog, VotePolicy } from "./types.js";

const { values } = parseArgs({
  options: {
    model: { type: "string", default: "../models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf" },
    games: { type: "string", default: "10" },
    "first-seed": { type: "string", default: "1" },
    modes: { type: "string", default: "undercover,mr-white" },
    votes: { type: "string", default: "model,random" },
    out: { type: "string", default: "results" },
  },
});

const games = Number(values.games);
const firstSeed = Number(values["first-seed"]);
const modes = values.modes.split(",") as Mode[];
const policies = values.votes.split(",") as VotePolicy[];
const outFile = join(values.out, "games.jsonl");
mkdirSync(values.out, { recursive: true });

const llm = await LlamaCppLlm.load(values.model);
console.log(`model ${basename(values.model)}, gpu ${llm.gpu}`);

for (const mode of modes) {
  for (let seed = firstSeed; seed < firstSeed + games; seed++) {
    for (const votes of policies) {
      const setup = createGame(seed, mode, WORD_PAIRS, PERSONAS);
      const calls: CallLog[] = [];
      let callSeed = seed * 1000;
      const seats = new Map<string, Seat>();
      for (const p of setup.players) {
        const seat = new LlmSeat(llm, (c) => calls.push(c), () => callSeed++);
        seats.set(p.name, votes === "random" ? new RandomVoter(seat, makeRng(seed * 31 + p.seat)) : seat);
      }
      const start = performance.now();
      const result = await playGame(setup, seats, makeRng(seed));
      const wallMs = performance.now() - start;

      if (seed === firstSeed && votes === "model") writeExamplePrompts(mode, calls);
      const log: GameLog = {
        model: basename(values.model),
        promptVersion: PROMPT_VERSION,
        votes,
        wallMs,
        result,
        calls: calls.map(({ messages: _m, ...rest }) => rest),
      };
      appendFileSync(outFile, JSON.stringify(log) + "\n");
      console.log(
        `${setup.id} votes=${votes} ${setup.civilianWord}/${setup.impostorWord ?? "-"}: ` +
          `${result.winner} (${result.endReason}, ${result.rounds.length} rounds, ${(wallMs / 1000).toFixed(1)} s)`,
      );
    }
  }
}
await llm.dispose();

function writeExamplePrompts(mode: Mode, calls: CallLog[]) {
  const pickCall = (kind: string, round: number) => calls.find((c) => c.kind === kind && c.round === round);
  const shown = [pickCall("clue", 2), pickCall("vote", 2)].filter((c): c is CallLog => !!c);
  const body = shown
    .map((c) => `## ${c.kind} turn, round ${c.round}, ${c.player}\n\n` +
      c.messages.map((m) => `### ${m.role}\n\n\`\`\`text\n${m.content}\n\`\`\``).join("\n\n") +
      `\n\n### output\n\n\`\`\`text\n${c.output}\n\`\`\``)
    .join("\n\n");
  writeFileSync(join(values.out, `example-prompts-${mode}.md`), `# Example prompts (${mode})\n\n${body}\n`);
}
