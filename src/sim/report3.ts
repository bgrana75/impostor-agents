import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { STRATEGIES, type Strategy } from "../core/impostors.js";
import type { GameResult } from "../core/types.js";
import type { Judgment } from "./judge.js";
import {
  agentCost, clueQuality, clueShape, outcomes, personaPasses, voteSanity, votesByPosition, wilson, wrongEliminations, type Rate,
} from "./metrics.js";
import type { GameLog, VotePolicy } from "./types.js";

// Writes results/run3/REPORT.md; the main report puts it at the top.

const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "results/run3" },
    examples: { type: "string", default: "" },
  },
});

const readJsonl = <T>(path: string): T[] =>
  existsSync(path) ? readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const logs = readJsonl<GameLog>(join(values.dir, "games.jsonl"));
const inform = readJsonl<Judgment>(join(values.dir, "inform.jsonl"));
const informRun1 = readJsonl<Judgment>(join(values.dir, "inform-run1.jsonl"));
const informRun2 = readJsonl<Judgment>(join(values.dir, "inform-run2.jsonl"));
const notes = existsSync(join(values.dir, "observations.md")) ? readFileSync(join(values.dir, "observations.md"), "utf8").trim() : "";

const pct = (x: number) => (Number.isNaN(x) ? "–" : `${Math.round(x * 100)}%`);
const f1 = (x: number) => (Number.isNaN(x) ? "–" : x.toFixed(1));
const f0 = (x: number) => (Number.isNaN(x) ? "–" : Math.round(x).toString());
const rate = (r: Rate) => (r.n ? `${r.hits}/${r.n} = ${pct(r.hits / r.n)}` : "–");
const ci = (r: Rate) => {
  if (!r.n) return "–";
  const [lo, hi] = wilson(r);
  return `${rate(r)} [${pct(lo)}–${pct(hi)}]`;
};
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const sets = (votes: VotePolicy) =>
  STRATEGIES.map((s) => ({ s, ls: logs.filter((l) => l.impostor === s && l.votes === votes) })).filter((x) => x.ls.length);
const res = (ls: GameLog[]) => ls.map((l) => l.result);
const civilianClues = (ls: GameLog[]) =>
  ls.flatMap((l) => l.result.rounds.flatMap((rd) => rd.clues.filter((c) => c.name !== l.humanSeat)));

function mainTable(): string {
  const rows = [...sets("model"), ...sets("random")].map(({ s, ls }) => {
    const o = outcomes(res(ls));
    const v = voteSanity(res(ls));
    const all = v.find((x) => x.round === "all")!;
    const out = [1, 2, 3, 4].map((r) => o.outRounds.get(r) ?? 0).join(" / ");
    return [s, ls[0]!.votes, ls.length, rate({ hits: o.civilianWins, n: ls.length }), out, ci(v[0]!), pct(v[0]!.baseline), ci(all), pct(all.baseline), f1(wrongEliminations(res(ls)))];
  });
  return table(
    ["impostor", "votes", "games", "caught (civilians win)", "caught in round 1/2/3/4", "round-1 civilian votes on impostor", "chance", "all-round votes on impostor", "chance", "civilians wrongly voted out per game"],
    rows,
  );
}

function perRound(): string {
  const rows = [...sets("model"), ...sets("random")].flatMap(({ s, ls }) =>
    voteSanity(res(ls)).filter((v) => v.round !== "all").map((v) => [s, ls[0]!.votes, v.round, ci(v), pct(v.baseline)]),
  );
  return table(["impostor", "votes", "round", "civilian votes on impostor [95% CI]", "chance"], rows);
}

function fairness(): string {
  const perfect = logs.filter((l) => l.impostor === "perfect" && l.votes === "model");
  if (!perfect.length) return "";
  const pos = votesByPosition(res(perfect));
  const seat = new Map<number, Rate>();
  for (const l of perfect) {
    const s = l.result.setup.players.find((p) => p.role === "impostor")!.seat;
    const r = seat.get(s) ?? { hits: 0, n: 0 };
    r.n++;
    if (l.result.impostorOutRound) r.hits++;
    seat.set(s, r);
  }
  return `Fairness check on the **perfect** set (the impostor's clues are honest, so votes on it should be at chance).
Civilian votes received by position in the round's clue order, against an even split of the same votes:

${table(["clue position", "votes received", "even split"], pos.map((p) => [p.pos, p.got, f1(p.expected)]))}

Perfect impostor caught, by its seat: ${[...seat].sort((a, b) => a[0] - b[0]).map(([s, r]) => `seat ${s}: ${r.hits}/${r.n}`).join(", ")}.`;
}

function informSection(): string {
  const civ = (js: Judgment[]) => ({ hits: js.filter((j) => j.role === "civilian" && j.civilian).length, n: js.filter((j) => j.role === "civilian").length });
  const imp = (js: Judgment[]) => ({ hits: js.filter((j) => j.role === "impostor" && j.civilian).length, n: js.filter((j) => j.role === "impostor").length });
  const rows: (string | number)[][] = [];
  if (informRun1.length) rows.push(["run 1 (4B, prompt v3), civilians", ci(civ(informRun1))]);
  if (informRun2.length) rows.push(["run 2 (4B, prompt v4), civilians", ci(civ(informRun2))]);
  rows.push(["run 3 (4B, prompt v5), civilians, all sets", ci(civ(inform))]);
  for (const s of STRATEGIES) {
    const js = inform.filter((j) => j.impostor === s && j.votes === "model");
    if (js.length) rows.push([`run 3, impostor clues: ${s}`, ci(imp(js))]);
  }
  return `Each clue is judged by the 4B at temperature 0: does it describe the civilians' word or a random word from another pair (A/B order alternates)? 50% is a coin flip.

${table(["clues", "judged as the civilians' word [95% CI]"], rows)}`;
}

function cluesSection(): string {
  const all = logs;
  const q = clueQuality(res(all));
  const civ = civilianClues(all);
  const accepted = civ.filter((c) => !c.passed);
  const shape = clueShape(accepted.map((c) => c.text));
  const trimmed = accepted.filter((c) => c.trimmed).length;
  const reasons = new Map<string, number>();
  let attempts = 0;
  for (const c of civ) {
    attempts += c.rejected.length + (c.passed ? 0 : 1);
    for (const r of c.rejected) reasons.set(r.reason.split(" (")[0]!, (reasons.get(r.reason.split(" (")[0]!) ?? 0) + 1);
  }
  const invalid = [...reasons.values()].reduce((a, b) => a + b, 0);
  const pp = personaPasses(res(all));
  // personaPasses counts every seat; recount civilians only.
  const civPersona = new Map<string, { turns: number; passes: number; trimmed: number }>();
  for (const l of all) for (const rd of l.result.rounds) for (const c of rd.clues) {
    if (c.name === l.humanSeat) continue;
    const row = civPersona.get(c.name) ?? { turns: 0, passes: 0, trimmed: 0 };
    row.turns++; row.passes += c.passed ? 1 : 0; row.trimmed += c.trimmed ? 1 : 0;
    civPersona.set(c.name, row);
  }
  return `Civilian clues over all ${all.length} games: ${civ.length} turns, ${attempts} attempts, ${rate({ hits: invalid, n: attempts })} invalid (${[...reasons].map(([k, v]) => `${k}: ${v}`).join(", ")}); ${rate({ hits: civ.filter((c) => c.passed).length, n: civ.length })} turns passed; ${rate({ hits: trimmed, n: accepted.length })} accepted clues were trimmed at a comma to fit 8 words. (All seats, impostor included: ${q.passes} passes in ${q.turns} turns.)

Template check: ${rate({ hits: shape.andShape, n: shape.n })} of accepted civilian clues match "X and Y …" (run 2: 50%). Top opening words: ${shape.top.map(([w, n]) => `${w || "(none)"} ${n}`).join(", ")}.

${table(["persona (civilian turns)", "style", "turns", "passed", "trimmed"], [...civPersona].sort(([, a], [, b]) => b.passes / b.turns - a.passes / a.turns).map(([name, r]) => [name, pp.get(name)?.style ?? "", r.turns, rate({ hits: r.passes, n: r.turns }), rate({ hits: r.trimmed, n: r.turns })]))}`;
}

function costSection(): string {
  const model = logs.filter((l) => l.votes === "model");
  const c = agentCost(model);
  const row = (name: string, m: { round: number; firstClue: number; clueTurn: number; votePhase: number }) => [name, `${f0(m.round)} s`, `${f1(m.firstClue)} s`, `${f1(m.clueTurn)} s`, `${f0(m.votePhase)} s`];
  return `Five agent civilians plus one free human seat (the human's own calls excluded), model-vote games: ${f1(c.callsPerRound)} agent calls per round.

${table(
  ["device", "whole round (agents)", "first agent clue of a round", "an agent clue turn (with retries)", "vote phase (5 agent votes)"],
  [row("M5 Mac (measured)", c.mac), ...c.phones.flatMap((p) => [row(`${p.name} ${p.read}/${p.write} tok/s, prefix cache`, p.cached), row(`${p.name}, no cache`, p.uncached)])],
)}`;
}

function transcript(l: GameLog): string {
  const r: GameResult = l.result;
  const judged = new Map(inform.filter((j) => j.gameId === r.setup.id && j.impostor === l.impostor && j.votes === l.votes).map((j) => [`${j.round}:${j.player}`, j]));
  const lines = [`${l.impostor} impostor, seed ${r.setup.seed}, ${l.votes} votes. Civilians' word: "${r.setup.civilianWord}". Human seat (Mr. White): ${l.humanSeat}, seat ${r.setup.players.find((p) => p.name === l.humanSeat)!.seat}`];
  for (const rd of r.rounds) {
    lines.push("", `Round ${rd.round}`);
    for (const c of rd.clues) {
      const j = judged.get(`${rd.round}:${c.name}`);
      const tag = c.name === l.humanSeat ? `${c.name} [HUMAN/MR. WHITE]` : c.name;
      const jt = j ? `   {judge: ${j.civilian ? "fits" : "distractor"} vs ${j.options.find((o) => o !== r.setup.civilianWord)}}` : "";
      lines.push(`  ${tag}: ${c.passed ? "(passed)" : `"${c.text}"${c.trimmed ? " (trimmed)" : ""}`}${jt}`);
    }
    for (const v of rd.votes) lines.push(`  vote ${v.voter} -> ${v.target}${v.reason ? `: ${v.reason}` : ""}`);
    lines.push(rd.eliminated ? `  => ${rd.eliminated} eliminated (${rd.eliminatedRole})` : "  => tie, nobody eliminated");
  }
  lines.push("", r.impostorOutRound ? `Caught in round ${r.impostorOutRound}.` : `Survived (${r.endReason}).`);
  return "```text\n" + lines.join("\n") + "\n```";
}

function examples(): string {
  // "<strategy>:<seed>:<votes>:<title>;..."
  return values.examples.split(";").filter(Boolean).map((spec) => {
    const [s, seed, votes, ...title] = spec.split(":");
    const l = logs.find((x) => x.impostor === (s as Strategy) && x.result.setup.seed === Number(seed) && x.votes === votes);
    return l ? `#### ${title.join(":")}\n\n${transcript(l)}` : `(example ${spec} not found)`;
  }).join("\n\n");
}

const out = `## Run 3: human Mr. White vs five agent civilians (Qwen3-4B, prompt v${logs[0]?.promptVersion})

Mr. White is always the human seat, played here by scripted strategies; the five civilians are agents.
20 seeds per strategy, same seeds (same words, cast and seats) across strategies; the impostor's seat rotates with the seed (seat = (seed − 1) mod 6).
The scripted impostor votes for a random player and never attempts the final guess, so "civilians win" = "impostor caught".
Strategies: **perfect** (secretly given the word; honest model clues), **copycat** (recombines words from this or last round's clues), **generic** ("something common", "found at home"), **off-topic** (honest model clues about a random other word).

${notes}

### Catch rate per strategy vs chance

${mainTable()}

${perRound()}

${fairness()}

### Clue informativeness (judge: civilians' word vs a random distractor)

${informSection()}

### Clue quality

${cluesSection()}

### Cost and waiting time

${costSection()}

### Example games

${examples()}
`;
writeFileSync(join(values.dir, "REPORT.md"), out.replace(/\n{3,}/g, "\n\n"));
console.log(`wrote ${join(values.dir, "REPORT.md")}`);
