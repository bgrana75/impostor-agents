import { appendFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { LlmSeat, RandomVoter, type CallLog } from "../core/agent.js";
import { playGame } from "../core/game.js";
import { ScriptedImpostor, STRATEGIES, type Strategy } from "../core/impostors.js";
import { PROMPT_VERSION } from "../core/prompts.js";
import { makeRng, pick } from "../core/rng.js";
import { createGame, pairFor, rotatedSeat } from "../core/setup.js";
import type { Seat } from "../core/types.js";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { LlamaCppLlm } from "../llm/llamaCpp.js";
import { DEFAULT_MODEL } from "./models.js";
import type { GameLog, VotePolicy } from "./types.js";

// Run 3: Mr. White is always the (scripted) human seat; the five agents are civilians.

const { values } = parseArgs({
  options: {
    model: { type: "string", default: DEFAULT_MODEL },
    games: { type: "string", default: "20" },
    "first-seed": { type: "string", default: "1" },
    strategies: { type: "string", default: STRATEGIES.join(",") },
    // Random-vote baselines are only run for these strategies.
    baseline: { type: "string", default: "copycat,generic" },
    out: { type: "string", default: "results/run3" },
  },
});

const strategies = values.strategies.split(",") as Strategy[];
const baseline = new Set(values.baseline.split(","));
const firstSeed = Number(values["first-seed"]);
mkdirSync(values.out, { recursive: true });
const outFile = join(values.out, "games.jsonl");

const llm = await LlamaCppLlm.load(values.model);
console.log(`model ${basename(values.model)}, gpu ${llm.gpu}`);

for (const strategy of strategies) {
  for (let seed = firstSeed; seed < firstSeed + Number(values.games); seed++) {
    const policies: VotePolicy[] = baseline.has(strategy) ? ["model", "random"] : ["model"];
    for (const votes of policies) {
      const setup = createGame(seed, "mr-white", WORD_PAIRS, PERSONAS, { impostorSeat: rotatedSeat(seed) });
      const human = setup.players.find((p) => p.role === "impostor")!;
      const calls: CallLog[] = [];
      let callSeed = seed * 1000;
      const llmSeat = () => new LlmSeat(llm, (c) => calls.push(c), () => callSeed++);
      const seats = new Map<string, Seat>();
      for (const p of setup.players) {
        if (p === human) {
          const pair = pairFor(seed, "mr-white", WORD_PAIRS);
          const others = WORD_PAIRS.filter((x) => x !== pair).flatMap((x) => [x.a, x.b]);
          const word = strategy === "off-topic" ? pick(makeRng(seed * 13), others) : setup.civilianWord;
          seats.set(p.name, new ScriptedImpostor({ strategy, rng: makeRng(seed * 101), honest: { seat: llmSeat(), word } }));
        } else {
          const seat = llmSeat();
          seats.set(p.name, votes === "random" ? new RandomVoter(seat, makeRng(seed * 31 + p.seat)) : seat);
        }
      }
      const start = performance.now();
      const result = await playGame(setup, seats, makeRng(seed));
      const wallMs = performance.now() - start;
      const log: GameLog = {
        model: basename(values.model),
        promptVersion: PROMPT_VERSION,
        votes,
        impostor: strategy,
        humanSeat: human.name,
        wallMs,
        result,
        calls: calls.map(({ messages: _m, ...rest }) => rest),
      };
      appendFileSync(outFile, JSON.stringify(log) + "\n");
      const caught = result.impostorOutRound ? `caught r${result.impostorOutRound}` : "survived";
      console.log(`${strategy} seed ${seed} votes=${votes} ${setup.civilianWord} seat ${human.seat}: ${caught} (${(wallMs / 1000).toFixed(1)} s)`);
    }
  }
}
await llm.dispose();
