# impostor-agents

A 6-player social-deduction word game ("Undercover" / "Mr. White") played entirely by
LLM agents, to measure whether a small local model (Qwen3-4B-Instruct-2507, Q4_K_M, the
model the BOAR app ships) plays it well enough to build an app around. No UI.

- `src/core/` — pure TypeScript game engine: setup, turn order, clue validation, voting,
  win detection, prompt building and output parsing. No I/O, no LLM imports.
- `src/llm/` — adapters behind one `Llm` interface: `fake` (scripted, for tests) and
  `llamaCpp` (node-llama-cpp, Metal, 4096 context, the model's own Jinja chat template,
  GBNF grammars for the output shape).
- `src/sim/` — harness: plays N seeded games per mode and logs every call to
  `<dir>/games.jsonl`; `judge.ts` asks the model which word each clue describes
  (`<dir>/judge.jsonl`); `report.ts` writes `results/REPORT.md`.

Every agent turn is one isolated LLM call whose prompt holds only the public rules
(system message, identical for the whole game), the public log, and that agent's private
part last, so consecutive calls reuse the KV cache up to the end of the log.
`src/core/isolation.test.ts` checks that no prompt contains another player's word.

## Run

```bash
npm install
npm test                 # vitest, fake LLM only
npm run typecheck

# Model (not in the repo): Qwen3-4B-Instruct-2507-Q4_K_M.gguf, sha256 3605803b…7e597,
# expected at ../models/ (override with --model).
npm run sim -- --games 20 --out results/run2            # both modes, model votes + random-vote baseline
npm run sim -- --games 20 --out results/run2-1.5b --model ../models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
npm run judge -- --dir results/run2                     # post-hoc bluff judge (4B by default)
npm run report -- --examples "run2:mr-white-15:model:Title"   # -> results/REPORT.md
```
