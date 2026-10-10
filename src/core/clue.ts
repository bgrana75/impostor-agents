import { CLUE_MAX_WORDS, REASON_MAX_WORDS } from "./rules.js";

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

export type ClueCheck = { ok: true; text: string; trimmed?: boolean } | { ok: false; reason: string };

export function containsWord(text: string, word: string | null): boolean {
  if (!word) return false;
  const wordTokens = words(word);
  return words(text).some((t) => wordTokens.some((w) => isDerivative(t, w)));
}

const META = /^(pass(es|ed)?|skip|none|nothing|n\/?a|no clue( given)?|i pass|clue|\.+|-+)$/;

/** Stage directions or non-answers copied from the log: "(No clue given)", "pass", "Theo passed.". */
export function isMeta(text: string, names: readonly string[] = []): boolean {
  const t = text.trim();
  if (/^[([{*]/.test(t) || /["()]/.test(t) || /\bround \d/i.test(t)) return true;
  if (names.some((n) => new RegExp(`\\b${n}\\b`, "i").test(t))) return true;
  return META.test(normalize(t)) || /\bno (valid )?clue\b/i.test(t) || /^i('m| am) (sorry|not)\b/i.test(t);
}

/**
 * Over-long clues are usually comma lists ("glassy, cold, always open, bounces when hit");
 * keep the leading parts that fit. Returns null when nothing of 3+ words fits.
 */
export function trimAtComma(text: string): string | null {
  let kept = "";
  for (const part of text.split(/[,;]/)) {
    const next = kept ? `${kept},${part}` : part;
    if (words(next).length > CLUE_MAX_WORDS) break;
    kept = next;
  }
  // "A tall" is what's left of "A tall, clear glass pane that ...": too little to keep.
  return words(kept).length >= 3 ? kept.trim() : null;
}

export function checkClue(
  raw: string,
  ownWord: string | null,
  earlierClues: readonly string[],
  names: readonly string[] = [],
): ClueCheck {
  let text = raw.trim();
  let trimmed = false;
  if (words(text).length === 0) return { ok: false, reason: "empty clue" };
  if (isMeta(text, names)) return { ok: false, reason: "not a clue" };
  if (words(text).length > CLUE_MAX_WORDS) {
    const cut = trimAtComma(text);
    if (!cut) return { ok: false, reason: `more than ${CLUE_MAX_WORDS} words (it has ${words(text).length}; give 2 to 6 words)` };
    [text, trimmed] = [cut, true];
  }
  if (containsWord(text, ownWord)) return { ok: false, reason: "it contains your secret word or a form of it" };
  const norm = normalize(text);
  if (earlierClues.some((c) => normalize(c) === norm)) return { ok: false, reason: "it repeats an earlier clue" };
  return trimmed ? { ok: true, text, trimmed } : { ok: true, text };
}

/** Vote reasons are public too: same word rule as clues, plus a length cap. */
export function checkReason(raw: string, ownWord: string | null): ClueCheck {
  const text = raw.trim();
  const n = words(text).length;
  if (n === 0) return { ok: false, reason: "empty reason" };
  if (n > REASON_MAX_WORDS) return { ok: false, reason: `reason longer than ${REASON_MAX_WORDS} words (it has ${n})` };
  if (containsWord(text, ownWord)) return { ok: false, reason: "the reason contains your secret word or a form of it" };
  return { ok: true, text };
}

/** Mr. White's guess must be one word and not a player's name. */
export function checkGuess(raw: string, names: readonly string[]): ClueCheck {
  const text = normalize(raw);
  if (!/^[a-z]{2,}$/.test(text)) return { ok: false, reason: "not a single word" };
  if (names.some((n) => n.toLowerCase() === text)) return { ok: false, reason: "that is a player's name, not the word" };
  return { ok: true, text };
}
