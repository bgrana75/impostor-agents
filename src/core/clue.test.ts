import { describe, expect, it } from "vitest";
import { checkClue, checkGuess, checkReason, isDerivative, trimAtComma } from "./clue.js";

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

describe("meta clues", () => {
  it("rejects stage directions and non-answers", () => {
    for (const c of ["(No clue given)", "pass", "*whispers* sand", "No valid clue", "...", "[skip]", "I'm sorry", "I'm not a musician"]) {
      expect(checkClue(c, "beach", []).ok, c).toBe(false);
    }
    expect(checkClue("passing waves", "beach", []).ok).toBe(true);
  });
});

describe("checkReason", () => {
  it("applies the word rule and a 12-word cap", () => {
    expect(checkReason("clues fit a pool, not mine", "beach").ok).toBe(true);
    expect(checkReason("doesn't match a beach at all", "beach")).toMatchObject({ ok: false });
    expect(checkReason("beaches have sand", "beach").ok).toBe(false);
    expect(checkReason("one two three four five six seven eight nine ten eleven twelve thirteen", "x").ok).toBe(false);
    expect(checkReason("", "x").ok).toBe(false);
  });
  it("has no word rule for Mr. White", () => {
    expect(checkReason("not a beach clue", null).ok).toBe(true);
  });
});

describe("checkGuess", () => {
  it("wants one word that is not a player's name", () => {
    expect(checkGuess("Shark", ["Theo"])).toEqual({ ok: true, text: "shark" });
    expect(checkGuess("theo", ["Theo"]).ok).toBe(false);
    expect(checkGuess("", ["Theo"]).ok).toBe(false);
  });
});

describe("trimming and copied log text", () => {
  it("cuts an over-long comma list at the last comma that fits", () => {
    expect(trimAtComma("Bounces when you hit it, always open, glassy, cold, clear")).toBe("Bounces when you hit it, always open, glassy");
    expect(checkClue("Bounces when you hit it, always open, glassy, cold, clear", "window", [])).toEqual({
      ok: true, text: "Bounces when you hit it, always open, glassy", trimmed: true,
    });
    expect(trimAtComma("one two three four five six seven eight nine, ten")).toBeNull();
    expect(trimAtComma("A tall, clear glass pane that frames the view and the light")).toBeNull();
  });

  it("still applies the word and repeat rules after trimming", () => {
    expect(checkClue("a window pane, very clear, lets in light, keeps rain out", "window", []).ok).toBe(false);
  });

  it("rejects clues that name a player, mention a round or carry quotes", () => {
    expect(checkClue("Theo passed.", "window", [], ["Theo"]).ok).toBe(false);
    expect(checkClue('people like it" (Round 1) - Joe', "window", [], ["Joe"]).ok).toBe(false);
    expect(checkClue("theory of light", "window", [], ["Theo"]).ok).toBe(true);
  });
});
