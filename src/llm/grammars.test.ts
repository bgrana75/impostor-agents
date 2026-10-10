import { describe, expect, it } from "vitest";
import { gbnf, wordExcluding } from "./grammars.js";

// A tiny matcher for the subset of GBNF that wordExcluding emits, so the grammar's
// language can be checked without loading a model.
function matcher(grammar: string): (s: string) => boolean {
  const rules = new Map<string, string[][]>();
  for (const line of grammar.split("\n")) {
    const [name, body] = line.split(" ::= ") as [string, string];
    rules.set(name, body.split(" | ").map((alt) => alt.match(/\[[a-z]+\] \[a-z\]\{\d+,\d+\}|"[^"]*"|w\d+/g) ?? []));
  }
  const match = (name: string, s: string): boolean =>
    rules.get(name)!.some((alt) => {
      let rest = s;
      for (const part of alt) {
        if (part.startsWith('"')) {
          const l = JSON.parse(part) as string;
          if (!rest.startsWith(l)) return false;
          rest = rest.slice(l.length);
        } else if (part.startsWith("[")) {
          const [, set, lo, hi] = /^\[([a-z]+)\] \[a-z\]\{(\d+),(\d+)\}$/.exec(part)!;
          if (!rest || !set!.includes(rest[0]!)) return false;
          const tail = rest.slice(1);
          return /^[a-z]*$/.test(tail) && tail.length >= Number(lo) && tail.length <= Number(hi);
        } else return match(part, rest);
      }
      return rest === "";
    });
  return (s) => match("root", s);
}

describe("wordExcluding", () => {
  const ok = matcher(wordExcluding(["Joe", "Lena", "Marta", "Theo"]));
  it("rejects the excluded names", () => {
    for (const n of ["joe", "lena", "marta", "theo"]) expect(ok(n), n).toBe(false);
  });
  it("accepts other words, including ones that share a prefix with a name", () => {
    for (const w of ["shark", "jo", "joey", "lens", "theory", "mar", "egg", "martas"]) expect(ok(w), w).toBe(true);
  });
  it("rejects one-letter words and capitals", () => {
    expect(ok("a")).toBe(false);
    expect(ok("Shark")).toBe(false);
  });
});

describe("assess grammar", () => {
  it("is FIT or ODD followed by a word other than the agent's own", () => {
    const g = gbnf({ kind: "assess", exclude: ["pool"] });
    expect(g.split("\n")[0]).toBe('root ::= "FIT" | "ODD " o0');
    const word = matcher(["root ::= o0", ...g.split("\n").slice(1)].join("\n").replaceAll(/\bo(\d+)/g, "w$1"));
    for (const w of ["pool", "pools", "poolside"]) expect(word(w), w).toBe(false);
    for (const w of ["beach", "poo", "pond"]) expect(word(w), w).toBe(true);
  });
});
