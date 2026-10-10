import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { GameResult, Mode } from "../core/types.js";
import { clueQuality, cost, group, outcomes, voteSanity } from "./metrics.js";
import type { GameLog, VotePolicy } from "./types.js";

const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "results" },
    examples: { type: "string", default: "" },
  },
});

const logs: GameLog[] = readFileSync(join(values.dir, "games.jsonl"), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const MODES: Mode[] = ["undercover", "mr-white"];
const POLICIES: VotePolicy[] = ["model", "random"];
const pct = (x: number) => (Number.isNaN(x) ? "–" : `${Math.round(x * 100)}%`);
const f1 = (x: number) => (Number.isNaN(x) ? "–" : x.toFixed(1));
const f0 = (x: number) => (Number.isNaN(x) ? "–" : Math.round(x).toString());
const fmtMap = (m: Map<string | number, number>) => [...m].sort().map(([k, v]) => `${k}: ${v}`).join(", ") || "–";
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const results = (ls: GameLog[]) => ls.map((l) => l.result);
const present = MODES.filter((m) => logs.some((l) => l.result.setup.mode === m));

function outcomesSection(): string {
  const rows = present.flatMap((mode) =>
    POLICIES.map((p) => {
      const o = outcomes(results(group(logs, mode, p)));
      return [mode, p, o.games, pct(o.civilianWins / o.games), pct(o.impostorWins / o.games), fmtMap(o.outRounds), fmtMap(o.endReasons)];
    }),
  );
  return table(["mode", "votes", "games", "civilians win", "impostor wins", "impostor out in round", "end reasons"], rows);
}

function votesSection(): string {
  const rows = present.flatMap((mode) =>
    POLICIES.flatMap((p) =>
      voteSanity(results(group(logs, mode, p))).map((v) => [
        mode, p, v.round, v.civilianVotes, `${v.hits} (${pct(v.hits / v.civilianVotes)})`, pct(v.baseline),
      ]),
    ),
  );
  return table(["mode", "votes", "round", "civilian votes", "hit the impostor", "random baseline"], rows);
}

function cluesSection(): string {
  const rows = present.map((mode) => {
    const q = clueQuality(results(logs.filter((l) => l.result.setup.mode === mode)));
    return [mode, q.turns, q.attempts, `${q.invalid} (${pct(q.invalidRate)})`, fmtMap(q.reasons), q.retriedTurns, q.passes];
  });
  return table(["mode", "clue turns", "attempts", "invalid attempts", "by reason", "turns needing a retry", "passes (3 rejections)"], rows);
}

function mrWhiteSection(): string {
  if (!present.includes("mr-white")) return "";
  const rows = POLICIES.map((p) => {
    const rs = results(group(logs, "mr-white", p));
    const o = outcomes(rs);
    const guesses = rs.filter((r) => r.mrWhiteGuess).map((r) => `${r.mrWhiteGuess!.guess} → ${r.setup.civilianWord}`);
    return [p, o.mrWhite.eliminated, `${o.mrWhite.correct}/${o.mrWhite.eliminated}`, guesses.join("; ")];
  });
  return `### Mr. White's guess when voted out\n\n${table(["votes", "times voted out", "correct", "guess → word"], rows)}`;
}

function undercoverDrift(): string {
  if (!present.includes("undercover")) return "";
  const rows = group(logs, "undercover", "model").map(({ result: r }) => {
    const imp = r.setup.players.find((p) => p.role === "impostor")!;
    const clues = r.rounds.map((rd) => {
      const c = rd.clues.find((x) => x.name === imp.name);
      return c ? (c.passed ? "(passed)" : c.text) : "";
    });
    while (clues.length < 4) clues.push("");
    return [r.setup.id, `${r.setup.civilianWord} / **${r.setup.impostorWord}**`, ...clues, r.winner];
  });
  return `### Undercover's clues by round (model votes)\n\nCivilians' word / **undercover's word**. Does the undercover drift toward the civilians' word?\n\n${table(
    ["game", "words", "round 1", "round 2", "round 3", "round 4", "winner"],
    rows,
  )}`;
}

function costSection(): string {
  const model = logs.filter((l) => l.votes === "model");
  const c = cost(model);
  const kinds = table(
    ["call", "calls", "prompt tokens", "evaluated (not cached)", "generated", "ms on M5 (Metal)"],
    c.perKind.filter((k) => k.calls).map((k) => [k.kind, k.calls, f0(k.prompt), f0(k.evaluated), f1(k.generated), f0(k.ms)]),
  );
  const phones = table(
    ["phone", "read tok/s", "write tok/s", "per round, with prefix cache", "per round, no cache", "per game (with cache)"],
    c.phones.map((p) => [p.name, p.read, p.write, `${f0(p.cachedSec)} s`, `${f0(p.uncachedSec)} s`, `${f0(p.cachedSec * c.roundsPerGame)} s`]),
  );
  return `Model-vote games only (${model.length} games).

- Calls per game: ${f1(c.callsPerGame)}; rounds per game: ${f1(c.roundsPerGame)}
- Wall time per game on the Mac: ${f1(c.wallSecPerGame)} s
- Tokens per game: ${f0(c.promptPerGame)} prompt tokens, of which ${f0(c.evaluatedPerGame)} evaluated (${pct(
    1 - c.evaluatedPerGame / c.promptPerGame,
  )} reused from the KV cache); ${f0(c.generatedPerGame)} generated

${kinds}

Phone estimate (measured BOAR rates for this model; whole round = every alive player's clue + vote, all on one phone, sequentially):

${phones}`;
}

function transcript(r: GameResult, votes: VotePolicy): string {
  const imp = r.setup.players.find((p) => p.role === "impostor")!;
  const tag = (name: string) => (name === imp.name ? `${name} [${r.setup.mode === "undercover" ? "UNDERCOVER" : "MR. WHITE"}]` : name);
  const words =
    r.setup.mode === "undercover"
      ? `civilians: "${r.setup.civilianWord}", undercover ${imp.name}: "${r.setup.impostorWord}"`
      : `civilians: "${r.setup.civilianWord}", Mr. White: ${imp.name}`;
  const lines = [`${r.setup.id} (${votes} votes). ${words}`];
  lines.push(`Seats: ${r.setup.players.map((p) => `${p.name} (${p.style})`).join("; ")}`);
  for (const rd of r.rounds) {
    lines.push("", `Round ${rd.round}`);
    for (const c of rd.clues) {
      const rej = c.rejected.length ? `   [rejected: ${c.rejected.map((x) => `"${x.text}" (${x.reason})`).join("; ")}]` : "";
      lines.push(`  ${tag(c.name)}: ${c.passed ? "(passed)" : `"${c.text}"`}${rej}`);
    }
    for (const v of rd.votes) lines.push(`  vote ${v.voter} -> ${v.target}: ${v.reason}`);
    lines.push(rd.eliminated ? `  => ${rd.eliminated} eliminated (${rd.eliminatedRole})` : "  => tie, nobody eliminated");
  }
  if (r.mrWhiteGuess) lines.push(`  Mr. White guesses "${r.mrWhiteGuess.guess}": ${r.mrWhiteGuess.correct ? "correct" : "wrong"}`);
  lines.push("", `Winner: ${r.winner} (${r.endReason})`);
  return "```text\n" + lines.join("\n") + "\n```";
}

function examplesSection(): string {
  const ids = values.examples.split(",").filter(Boolean);
  return ids
    .map((id) => {
      const [gameId, votes = "model"] = id.split(":");
      const l = logs.find((x) => x.result.setup.id === gameId && x.votes === votes);
      return l ? transcript(l.result, l.votes) : `(game ${id} not found)`;
    })
    .join("\n\n");
}

const notesPath = join(values.dir, "observations.md");
const notes = existsSync(notesPath) ? readFileSync(notesPath, "utf8").trim() : "";
const first = logs[0]!;
const seeds = [...new Set(logs.map((l) => l.result.setup.seed))];

const report = `# Impostor agents: simulation report

Model \`${first.model}\`, prompt v${first.promptVersion}, ${logs.length} games (seeds ${Math.min(...seeds)}–${Math.max(...seeds)} per mode).
Each seed is played twice: once with the model voting, once with clues from the model but **uniformly random votes**
(the baseline). Sampling seeds are per call, so round-1 clues are the same in both runs. 6 players, all agents.
Generated by \`npm run report\` from \`results/games.jsonl\`; the "Read" section is hand-written (\`results/observations.md\`).

${notes}

## Outcomes

${outcomesSection()}

## Do the votes deduce? (civilian votes only)

${votesSection()}

## Clue quality

${cluesSection()}

${mrWhiteSection()}

${undercoverDrift()}

## Cost

${costSection()}

## Example games (hidden roles shown)

${examplesSection()}
`;
writeFileSync(join(values.dir, "REPORT.md"), report.replace(/\n{3,}/g, "\n\n"));
console.log(`wrote ${join(values.dir, "REPORT.md")}`);
