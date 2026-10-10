import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { GameResult, Mode } from "../core/types.js";
import type { Judgment } from "./judge.js";
import {
  assessStats, blend, clueQuality, cost, group, outcomes, personaPasses, voteReasons, voteSanity, wilson, type Rate,
} from "./metrics.js";
import type { GameLog, VotePolicy } from "./types.js";

const { values } = parseArgs({
  options: {
    runs: { type: "string", default: "results/run2,results/run2-1.5b" },
    previous: { type: "string", default: "results/run1" },
    examples: { type: "string", default: "" },
    notes: { type: "string", default: "results/observations.md" },
    out: { type: "string", default: "results/REPORT.md" },
    // Newer runs' sections, placed above this report (each written by its own script).
    top: { type: "string", default: "results/run3/REPORT.md" },
  },
});

interface Run {
  dir: string;
  label: string;
  logs: GameLog[];
  judgments: Judgment[];
}

const readJsonl = <T>(path: string): T[] =>
  existsSync(path) ? readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];

function loadRun(dir: string): Run {
  const logs = readJsonl<GameLog>(join(dir, "games.jsonl"));
  const model = logs[0]?.model ?? "?";
  const label = `${/1\.5b/i.test(model) ? "1.5B" : "4B"} (${dir.split("/").pop()})`;
  return { dir, label, logs, judgments: readJsonl<Judgment>(join(dir, "judge.jsonl")) };
}

const runs = values.runs.split(",").map(loadRun);
const prev = existsSync(join(values.previous, "games.jsonl")) ? loadRun(values.previous) : null;
const MODES: Mode[] = ["undercover", "mr-white"];

const pct = (x: number) => (Number.isNaN(x) ? "–" : `${Math.round(x * 100)}%`);
const f1 = (x: number) => (Number.isNaN(x) ? "–" : x.toFixed(1));
const f0 = (x: number) => (Number.isNaN(x) ? "–" : Math.round(x).toString());
const rate = (r: Rate) => (r.n ? `${r.hits}/${r.n} = ${pct(r.hits / r.n)}` : "–");
const rateCi = (r: Rate) => {
  if (!r.n) return "–";
  const [lo, hi] = wilson(r);
  return `${rate(r)} [${pct(lo)}–${pct(hi)}]`;
};
const fmtMap = (m: Map<string | number, number>) => [...m].sort().map(([k, v]) => `${k}: ${v}`).join(", ") || "–";
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const results = (ls: GameLog[]) => ls.map((l) => l.result);
const modeLogs = (run: Run, mode: Mode, votes?: VotePolicy) =>
  run.logs.filter((l) => l.result.setup.mode === mode && (!votes || l.votes === votes));

// --- side by side -------------------------------------------------------------

function keyRates(): string {
  const cols: { name: string; run: Run; votes: VotePolicy }[] = [
    ...(prev ? [{ name: `run 1, ${prev.label.split(" ")[0]}`, run: prev, votes: "model" as const }] : []),
    ...runs.map((run) => ({ name: `run 2, ${run.label.split(" ")[0]}`, run, votes: "model" as const })),
    ...runs.map((run) => ({ name: `random votes, ${run.label.split(" ")[0]} clues`, run, votes: "random" as const })),
  ];
  const rows: (string | number)[][] = [];
  for (const mode of MODES) {
    const cell = (f: (ls: GameLog[], run: Run) => string) => cols.map((c) => f(group(c.run.logs, mode, c.votes), c.run));
    const hitAll = (ls: GameLog[]) => voteSanity(results(ls)).find((v) => v.round === "all")!;
    rows.push([`**${mode}**`, ...cols.map(() => "")]);
    rows.push(["games", ...cell((ls) => String(ls.length))]);
    rows.push(["civilians win", ...cell((ls) => rate({ hits: outcomes(results(ls)).civilianWins, n: ls.length }))]);
    rows.push(["civilian votes on the impostor (all rounds)", ...cell((ls) => rate(hitAll(ls)))]);
    rows.push(["… chance level for those votes", ...cell((ls) => pct(hitAll(ls).baseline))]);
    rows.push(["round-1 votes on the impostor", ...cell((ls) => rate(voteSanity(results(ls))[0] ?? { hits: 0, n: 0 }))]);
    rows.push(["invalid clue attempts", ...cell((ls) => { const q = clueQuality(results(ls)); return rate({ hits: q.invalid, n: q.attempts }); })]);
    rows.push(["clue turns passed", ...cell((ls) => { const q = clueQuality(results(ls)); return rate({ hits: q.passes, n: q.turns }); })]);
    rows.push(["impostor clues judged as civilians' word (blend)", ...cols.map((c) => {
      if (c.votes !== "model") return "";
      const js = c.run.judgments.filter((j) => j.mode === mode && j.votes === "model");
      return js.length ? rate(blend(js)[0]!.all) : "–";
    })]);
    if (mode === "mr-white") {
      rows.push(["Mr. White guesses correct", ...cell((ls) => { const m = outcomes(results(ls)).mrWhite; return rate({ hits: m.correct, n: m.eliminated }); })]);
    }
  }
  return table(["", ...cols.map((c) => c.name)], rows);
}

// --- per run -------------------------------------------------------------------

function runSection(run: Run): string {
  const parts = [`## ${run.label}`];
  for (const mode of MODES) {
    const model = modeLogs(run, mode, "model");
    const random = modeLogs(run, mode, "random");
    if (!model.length) continue;
    parts.push(`### ${run.label}: ${mode}`);

    const o = (ls: GameLog[]) => outcomes(results(ls));
    parts.push(table(
      ["votes", "games", "civilians win", "impostor out in round", "end reasons"],
      [model, random].filter((ls) => ls.length).map((ls) => [ls[0]!.votes, ls.length, pct(o(ls).civilianWins / ls.length), fmtMap(o(ls).outRounds), fmtMap(o(ls).endReasons)]),
    ));

    parts.push("Civilian votes that hit the impostor (count, Wilson 95% interval) vs. chance:");
    const vm = voteSanity(results(model));
    const vr = voteSanity(results(random));
    parts.push(table(
      ["round", "model votes", "chance", "random-vote games", "chance"],
      vm.map((v, i) => [v.round, rateCi(v), pct(v.baseline), vr[i] ? rateCi(vr[i]!) : "–", vr[i] ? pct(vr[i]!.baseline) : "–"]),
    ));

    const q = clueQuality(results([...model, ...random]));
    const vreason = voteReasons(results(model));
    parts.push(`Clues (all ${model.length + random.length} games): ${q.turns} turns, ${q.attempts} attempts, ${rate({ hits: q.invalid, n: q.attempts })} invalid (${fmtMap(q.reasons)}); ${q.retriedTurns} turns needed a retry, ${q.passes} passed after 3 rejections.

Vote reasons (model votes): ${vreason.votes} votes, ${vreason.retried} needed a retry (${fmtMap(vreason.reasons)}); ${vreason.noReason} kept their target without a reason, ${vreason.fallbacks} random fallbacks.`);

    const pp = personaPasses(results([...model, ...random]));
    parts.push(table(
      ["persona", "style", "clue turns", "passed", "rejected attempts per turn"],
      [...pp].sort(([, a], [, b]) => b.passes / b.turns - a.passes / a.turns).map(([name, p]) => [name, p.style, p.turns, rate({ hits: p.passes, n: p.turns }), f1(p.invalid / p.turns)]),
    ));

    const js = run.judgments.filter((j) => j.mode === mode && j.votes === "model");
    if (js.length) {
      const b = blend(js);
      parts.push(`Bluff judge (${js[0]!.judgeModel}, temperature 0, ${js.length} clues): share of clues read as the civilians' word${mode === "mr-white" ? ` rather than "none of these"` : " rather than the undercover's word"}.`);
      parts.push(table(["clues by", "round 1", "rounds 2+", "all"], b.map((r) => [r.role, rateCi(r.round1), rateCi(r.later), rateCi(r.all)])));
    }

    if (mode === "undercover") {
      const a = assessStats(model);
      if (a.length) {
        parts.push("Private ODD/FIT step (model-vote games): true-ODD = the undercover answered ODD; false-ODD = a civilian answered ODD.");
        parts.push(table(
          ["round", "true-ODD (undercover)", "… and named the civilians' word", "false-ODD (civilians)"],
          a.map((r) => [r.round, rate(r.imp), `${r.impNamed}`, rate(r.civ)]),
        ));
      }
    } else {
      const rows = [model, random].filter((ls) => ls.length).map((ls) => {
        const m = o(ls).mrWhite;
        return [ls[0]!.votes, m.eliminated, `${m.correct}/${m.eliminated}`, `${m.wordAbsent}/${m.eliminated}`, m.guesses.map((g) => `${g.guess || "(none)"} → ${g.word}`).join("; ")];
      });
      parts.push(table(["votes", "voted out", "correct", "word absent from public log", "guess → word"], rows));
    }
  }
  parts.push(costSection(run));
  return parts.join("\n\n");
}

function costSection(run: Run): string {
  const model = run.logs.filter((l) => l.votes === "model");
  const per = MODES.map((mode) => ({ mode, c: cost(model.filter((l) => l.result.setup.mode === mode)) }));
  const kinds = table(
    ["mode", "call", "calls", "prompt tokens", "evaluated", "generated", "ms on M5"],
    per.flatMap(({ mode, c }) => c.perKind.filter((k) => k.calls).map((k) => [mode, k.kind, k.calls, f0(k.prompt), f0(k.evaluated), f1(k.generated), f0(k.ms)])),
  );
  const rounds = table(
    ["mode", "calls per round", "Mac s per round", "Mac s per game", ...per[0]!.c.phones.flatMap((p) => [`${p.name} ${p.read}/${p.write} tok/s, cached`, "no cache"])],
    per.map(({ mode, c }) => [mode, f1(c.callsPerRound), f1(c.macSecPerRound), f1(c.wallSecPerGame), ...c.phones.flatMap((p) => [`${f0(p.cachedSec)} s`, `${f0(p.uncachedSec)} s`])]),
  );
  const all = cost(model);
  return `### ${run.label}: cost (model-vote games; judge calls excluded)

Tokens per game: ${f0(all.promptPerGame)} prompt, ${f0(all.evaluatedPerGame)} evaluated (${pct(1 - all.evaluatedPerGame / all.promptPerGame)} reused from the KV cache), ${f0(all.generatedPerGame)} generated; ${f1(all.callsPerGame)} calls per game.

${kinds}

Per round, all six seats on one device in sequence (mode A includes the private ODD/FIT calls):

${rounds}`;
}

// --- examples --------------------------------------------------------------------

function transcript(r: GameResult, votes: VotePolicy, run: Run): string {
  const imp = r.setup.players.find((p) => p.role === "impostor")!;
  const tag = (name: string) => (name === imp.name ? `${name} [${r.setup.mode === "undercover" ? "UNDERCOVER" : "MR. WHITE"}]` : name);
  const words = r.setup.mode === "undercover"
    ? `civilians: "${r.setup.civilianWord}", undercover ${imp.name}: "${r.setup.impostorWord}"`
    : `civilians: "${r.setup.civilianWord}", Mr. White: ${imp.name}`;
  const log = run.logs.find((l) => l.result === r)!;
  const judged = new Map(run.judgments.filter((j) => j.gameId === r.setup.id && j.votes === votes).map((j) => [`${j.round}:${j.player}`, j]));
  const lines = [`${r.setup.id}, ${run.label}, ${votes} votes. ${words}`];
  lines.push(`Seats: ${r.setup.players.map((p) => `${p.name} (${p.style})`).join("; ")}`);
  for (const rd of r.rounds) {
    lines.push("", `Round ${rd.round}`);
    for (const a of log.calls.filter((c) => c.kind === "assess" && c.round === rd.round)) lines.push(`  (private) ${tag(a.player)} checks: ${a.output}`);
    for (const c of rd.clues) {
      const j = judged.get(`${rd.round}:${c.name}`);
      const jtxt = j && c.name === imp.name ? `   {judge: ${j.civilian ? "civilians' word" : "not the civilians' word"}}` : "";
      const rej = c.rejected.length ? `   [rejected: ${c.rejected.map((x) => `"${x.text}"`).join("; ")}]` : "";
      lines.push(`  ${tag(c.name)}: ${c.passed ? "(passed)" : `"${c.text}"`}${jtxt}${rej}`);
    }
    for (const v of rd.votes) lines.push(`  vote ${v.voter} -> ${v.target}${v.reason ? `: ${v.reason}` : " (no reason)"}`);
    lines.push(rd.eliminated ? `  => ${rd.eliminated} eliminated (${rd.eliminatedRole})` : "  => tie, nobody eliminated");
  }
  if (r.mrWhiteGuess) lines.push(`  Mr. White guesses "${r.mrWhiteGuess.guess}": ${r.mrWhiteGuess.correct ? "correct" : "wrong"}`);
  lines.push("", `Winner: ${r.winner} (${r.endReason})`);
  return "```text\n" + lines.join("\n") + "\n```";
}

function examplesSection(): string {
  // Each example: "<run dir name>:<game id>:<votes>:<title>"
  return values.examples.split(";").filter(Boolean).map((spec) => {
    const [dirName, id, votes, ...title] = spec.split(":");
    const run = runs.find((r) => r.dir.endsWith(dirName!));
    const l = run?.logs.find((x) => x.result.setup.id === id && x.votes === votes);
    return l && run ? `### ${title.join(":")}\n\n${transcript(l.result, l.votes, run)}` : `(example ${spec} not found)`;
  }).join("\n\n");
}

const notes = existsSync(values.notes) ? readFileSync(values.notes, "utf8").trim() : "";
const top = values.top.split(",").filter((p) => existsSync(p)).map((p) => readFileSync(p, "utf8").trim()).join("\n\n");
const report = `# Impostor agents: simulation report

${top}

# Run 2

Prompt v${runs[0]!.logs[0]?.promptVersion}. Per model: ${runs.map((r) => `${r.label}: ${r.logs.length} games`).join("; ")}.
Each seed is played twice, once with model votes and once with clues from the model and **uniformly random votes**.
Seed *n* deals a different word pair in each mode (40 pairs over seeds 1–20). 6 players, all agents.
Clues are judged after the game by the 4B at temperature 0 (the judge never takes part in a game).
Generated by \`npm run report\`; the "Read" section is hand-written (\`results/observations.md\`). Run 1 is in \`results/run1/\`.

${notes}

## Side by side

${keyRates()}

${runs.map(runSection).join("\n\n")}

## Example games (hidden roles and private checks shown)

${examplesSection()}
`;
writeFileSync(values.out, report.replace(/\n{3,}/g, "\n\n"));
console.log(`wrote ${values.out}`);
