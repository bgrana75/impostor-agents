import { normalize, stem } from "./clue.js";

const stripQuotes = (s: string) => s.replace(/^["'“”‘’`*]+|["'“”‘’`*]+$/g, "").trim();

function firstLine(text: string): string {
  return text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
}

export function parseClue(text: string, names: readonly string[] = []): string {
  let line = firstLine(text);
  // Models sometimes echo a label: `Clue: ...`, `Clue turn, round 2:** ...` or `Marta: ...`.
  const m = /^\**([^:]{1,25}):\**\s*/.exec(line);
  const label = m ? stripQuotes(m[1]!).toLowerCase() : "";
  if (m && (label.includes("clue") || names.some((n) => n.toLowerCase() === label))) line = line.slice(m[0].length);
  return stripQuotes(line);
}

export function parseVote(text: string, candidates: readonly string[]): { target: string; reason: string } | null {
  const line = firstLine(text);
  const [head = "", ...rest] = line.split("|");
  const byHead = candidates.find((c) => stripQuotes(head).toLowerCase() === c.toLowerCase());
  if (byHead) return { target: byHead, reason: rest.join("|").trim() };
  // Fallback: the first candidate named anywhere in the line.
  const lower = line.toLowerCase();
  let best: { name: string; at: number } | null = null;
  for (const c of candidates) {
    const at = lower.search(new RegExp(`\\b${c.toLowerCase()}\\b`));
    if (at >= 0 && (!best || at < best.at)) best = { name: c, at };
  }
  return best ? { target: best.name, reason: line } : null;
}

export function parseGuess(text: string): string {
  return normalize(stripQuotes(firstLine(text))).split(" ")[0] ?? "";
}

export function guessIsCorrect(guess: string, word: string): boolean {
  const g = normalize(guess);
  const w = normalize(word);
  return g === w || stem(g) === stem(w);
}
