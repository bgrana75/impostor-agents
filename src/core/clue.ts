import { CLUE_MAX_WORDS } from "./rules.js";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

/** Crude English stem: enough to catch plurals and -ing/-ed/-er forms. */
export function stem(word: string): string {
  const w = word.replace(/'s$/, "");
  for (const suffix of ["ies", "es", "s", "ing", "ed", "er", "y"]) {
    if (w.length - suffix.length >= 3 && w.endsWith(suffix)) return w.slice(0, -suffix.length);
  }
  return w;
}

/** Does `token` look like `word` or an obvious derivative of it (beach -> beaches, beachy, sunbeach)? */
export function isDerivative(token: string, word: string): boolean {
  const t = token.toLowerCase();
  const w = word.toLowerCase();
  if (t === w || stem(t) === stem(w)) return true;
  // Compounds such as "beachside" or "sunbeach"; short words only match whole,
  // or "tea" would reject "team" and "steam".
  return w.length >= 4 && (t.startsWith(w) || t.endsWith(w));
}

export type ClueCheck = { ok: true; text: string } | { ok: false; reason: string };

export function checkClue(raw: string, ownWord: string | null, earlierClues: readonly string[]): ClueCheck {
  const text = raw.trim();
  const tokens = words(text);
  if (tokens.length === 0) return { ok: false, reason: "empty clue" };
  if (tokens.length > CLUE_MAX_WORDS) return { ok: false, reason: `more than ${CLUE_MAX_WORDS} words` };
  if (ownWord) {
    const wordTokens = words(ownWord);
    const hit = tokens.some((t) => wordTokens.some((w) => isDerivative(t, w)));
    if (hit) return { ok: false, reason: "it contains your secret word or a form of it" };
  }
  const norm = normalize(text);
  if (earlierClues.some((c) => normalize(c) === norm)) return { ok: false, reason: "it repeats an earlier clue" };
  return { ok: true, text };
}
