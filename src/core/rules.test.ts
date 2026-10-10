import { describe, expect, it } from "vitest";
import { tally, turnOrder } from "./rules.js";
import type { Player, VoteEntry } from "./types.js";

const players = ["A", "B", "C", "D", "E", "F"].map(
  (name, seat): Player => ({ seat, name, style: "", role: "civilian", word: "x" }),
);
const names = (ps: Player[]) => ps.map((p) => p.name).join("");
const v = (voter: string, target: string): VoteEntry => ({ voter, target, reason: "", fallback: false });

describe("turnOrder", () => {
  it("rotates the starting seat each round", () => {
    const all = new Set(players.map((p) => p.name));
    expect(names(turnOrder(players, all, 1))).toBe("ABCDEF");
    expect(names(turnOrder(players, all, 2))).toBe("BCDEFA");
    expect(names(turnOrder(players, all, 4))).toBe("DEFABC");
  });

  it("skips eliminated players without shifting the rotation", () => {
    expect(names(turnOrder(players, new Set(["A", "C", "D", "F"]), 2))).toBe("CDFA");
  });
});

describe("tally", () => {
  it("returns the plurality target", () => {
    expect(tally([v("A", "B"), v("C", "B"), v("B", "D")])).toBe("B");
  });
  it("returns null on a tie for first", () => {
    expect(tally([v("A", "B"), v("B", "A"), v("C", "D"), v("D", "C")])).toBeNull();
  });
});
