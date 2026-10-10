import type { OutputShape } from "../core/types.js";

const lit = (s: string) => JSON.stringify(s);

interface Trie {
  end: boolean;
  kids: Map<string, Trie>;
}

/**
 * GBNF for one lowercase word of min..max letters that is none of `excluded`.
 * GBNF has no negation, so this walks a trie of the excluded words: any letter that
 * leaves the trie frees the rest of the word, and the word may stop anywhere except
 * exactly at an excluded word. With `banPrefix`, words that merely start with an
 * excluded word are banned too (the model dodges an exact ban as "dolphinphins").
 */
export function wordExcluding(
  excluded: readonly string[],
  { min = 2, max = 24, prefix = "w", banPrefix = false } = {},
): string {
  const root: Trie = { end: false, kids: new Map() };
  for (const w of excluded.map((x) => x.toLowerCase()).filter((x) => /^[a-z]+$/.test(x))) {
    let node = root;
    for (const ch of w) {
      if (!node.kids.has(ch)) node.kids.set(ch, { end: false, kids: new Map() });
      node = node.kids.get(ch)!;
    }
    node.end = true;
  }
  const rules: string[] = [];
  const visit = (node: Trie, depth: number): string => {
    const name = `${prefix}${rules.length}`;
    rules.push(""); // reserve the slot so names stay in creation order
    const alts: string[] = [];
    const free = [..."abcdefghijklmnopqrstuvwxyz"].filter((c) => !node.kids.has(c)).join("");
    const restMin = Math.max(0, min - depth - 1);
    const restMax = max - depth - 1;
    if (free && restMax >= 0) alts.push(`[${free}] [a-z]{${restMin},${restMax}}`);
    if (depth + 1 <= max) {
      for (const [ch, kid] of node.kids) if (!(banPrefix && kid.end)) alts.push(`${lit(ch)} ${visit(kid, depth + 1)}`);
    }
    if (depth >= min && !node.end) alts.push(`""`);
    rules[Number(name.slice(prefix.length))] = `${name} ::= ${alts.join(" | ")}`;
    return name;
  };
  visit(root, 0);
  return [`root ::= ${prefix}0`, ...rules].join("\n");
}

/** GBNF per output shape. Printable ASCII on one line throughout: a word-count grammar
 * made the model glue words together and drift into other scripts. */
export function gbnf(shape: OutputShape): string {
  switch (shape.kind) {
    case "clue":
      return `root ::= [ -~]{1,80}`;
    case "vote":
      // ~72 characters is about 12 words: long reasons were the main cause of retries.
      return `root ::= (${shape.names.map(lit).join(" | ")}) " | " [ -~]{2,72}`;
    case "guess":
      return wordExcluding(shape.exclude);
    case "assess": {
      // The model tends to name its own word after ODD; the grammar rules that out.
      const [, ...rules] = wordExcluding(shape.exclude, { prefix: "o", banPrefix: true }).split("\n");
      return [`root ::= "FIT" | "ODD " o0`, ...rules].join("\n");
    }
    case "judge":
      return `root ::= "A" | "B"`;
  }
}
