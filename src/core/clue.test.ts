import { describe, expect, it } from "vitest";
import { checkClue, isDerivative } from "./clue.js";

describe("checkClue", () => {
  it("accepts a short clue", () => {
    expect(checkClue("Sand between your toes", "beach", [])).toEqual({ ok: true, text: "Sand between your toes" });
  });
  it("rejects empty and over-long clues", () => {
    expect(checkClue("  ", "beach", []).ok).toBe(false);
    expect(checkClue("one two three four five six seven eight nine", "beach", []).ok).toBe(false);
  });
  it("rejects the word and obvious derivatives", () => {
    for (const clue of ["the BEACH", "beaches galore", "beachy vibes", "sunbeach"]) {
      expect(checkClue(clue, "beach", []).ok, clue).toBe(false);
    }
    expect(checkClue("cats everywhere", "cat", []).ok).toBe(false);
  });
  it("does not reject unrelated words that merely contain a short word", () => {
    expect(checkClue("steam rising from a team", "tea", []).ok).toBe(true);
    expect(isDerivative("category", "cat")).toBe(false);
  });
  it("rejects a verbatim repeat, ignoring case and punctuation", () => {
    expect(checkClue("Warm sand!", "beach", ["warm sand"]).ok).toBe(false);
  });
  it("has no word check for Mr. White", () => {
    expect(checkClue("beach", null, []).ok).toBe(true);
  });
});
