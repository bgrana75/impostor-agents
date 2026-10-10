import { describe, expect, it } from "vitest";
import { guessIsCorrect, parseAssessment, parseClue, parseGuess, parseVote } from "./parse.js";

describe("parseClue", () => {
  it("strips labels, quotes and extra lines", () => {
    expect(parseClue('"Salty air"\nmore')).toBe("Salty air");
    expect(parseClue("Clue: salty air")).toBe("salty air");
    expect(parseClue("Marta: salty air", ["Marta"])).toBe("salty air");
    expect(parseClue("Clue turn, Round 4:** earthy, brown")).toBe("earthy, brown");
    expect(parseClue("Summer: hot days", ["Marta"])).toBe("Summer: hot days");
  });
});

describe("parseVote", () => {
  const c = ["Theo", "Lena", "Omar"];
  it("reads Name | reason", () => {
    expect(parseVote("Lena | her clue was off", c)).toEqual({ target: "Lena", reason: "her clue was off" });
  });
  it("falls back to the first candidate mentioned", () => {
    expect(parseVote("I think Omar, not Theo.", c)?.target).toBe("Omar");
  });
  it("returns null when nobody valid is named", () => {
    expect(parseVote("Marta | reasons", c)).toBeNull();
  });
});

describe("guesses", () => {
  it("normalizes and compares by stem", () => {
    expect(parseGuess('"Beaches."')).toBe("beaches");
    expect(parseGuess("silly and nimble")).toBe("silly and nimble");
    expect(parseGuess("The word is guitar")).toBe("guitar");
    expect(guessIsCorrect("beaches", "beach")).toBe(true);
    expect(guessIsCorrect("pool", "beach")).toBe(false);
  });
});

describe("parseAssessment", () => {
  it("reads FIT and ODD <word>", () => {
    expect(parseAssessment("FIT")).toEqual({ odd: false, othersWord: null });
    expect(parseAssessment("ODD beach")).toEqual({ odd: true, othersWord: "beach" });
    expect(parseAssessment("odd: Beach.")).toEqual({ odd: true, othersWord: "beach" });
    expect(parseAssessment("ODD")).toEqual({ odd: true, othersWord: null });
    expect(parseAssessment("not sure")).toEqual({ odd: false, othersWord: null });
  });
});
