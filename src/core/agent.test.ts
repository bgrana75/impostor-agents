import { describe, expect, it } from "vitest";
import { FakeLlm } from "../llm/fake.js";
import { LlmSeat, type CallLog } from "./agent.js";
import type { GenerateRequest, Mode, PlayerView } from "./types.js";

function view(mode: Mode, round: number): PlayerView {
  return {
    setup: { mode, names: ["Ana", "Bo", "Cy"] },
    me: { name: "Ana", style: "a tester", word: mode === "undercover" ? "pool" : null, toldImpostor: mode === "mr-white" },
    rounds: [],
    round,
    alive: ["Ana", "Bo", "Cy"],
  };
}

function seat(answer: (req: GenerateRequest) => string) {
  const calls: CallLog[] = [];
  const llm = new FakeLlm(answer);
  return { seat: new LlmSeat(llm, (c) => calls.push(c), () => 1), calls, llm };
}

const lastUser = (req: GenerateRequest) => req.messages[1]!.content;

describe("ODD/FIT step", () => {
  it("runs once per round from round 2 in undercover mode, privately, before the clue", async () => {
    const { seat: s, calls } = seat((req) => (req.shape?.kind === "assess" ? "FIT" : "warm water"));
    await s.clue(view("undercover", 1), []);
    expect(calls.map((c) => c.kind)).toEqual(["clue"]);
    await s.clue(view("undercover", 2), []);
    await s.clue(view("undercover", 2), [{ text: "x", reason: "too long" }]);
    expect(calls.map((c) => c.kind)).toEqual(["clue", "assess", "clue", "clue"]);
    expect(calls[1]!.private).toBe(true);
    expect(calls.filter((c) => c.kind !== "assess").every((c) => !c.private)).toBe(true);
  });

  it("never runs in Mr. White mode", async () => {
    const { seat: s, calls } = seat(() => "warm water");
    await s.clue(view("mr-white", 3), []);
    expect(calls.map((c) => c.kind)).toEqual(["clue"]);
  });

  it("tells an agent that answered ODD to blend toward the others' word, in clue and vote", async () => {
    const { seat: s, llm } = seat((req) =>
      req.shape?.kind === "assess" ? "ODD beach" : req.shape?.kind === "vote" ? "Bo | odd one" : "sand",
    );
    await s.clue(view("undercover", 2), []);
    await s.vote(view("undercover", 2), ["Bo", "Cy"], []);
    const [, clueReq, voteReq] = llm.requests;
    expect(lastUser(clueReq!)).toContain('You may be the odd one out. Give a clue that fits the others\' word (probably "beach") instead.');
    expect(lastUser(voteReq!)).toContain("look least like the others'");
  });

  it("leaves the clue prompt unchanged after FIT", async () => {
    const { seat: s, llm } = seat((req) => (req.shape?.kind === "assess" ? "FIT" : "sand"));
    await s.clue(view("undercover", 2), []);
    expect(lastUser(llm.requests[1]!)).not.toContain("odd one out");
  });
});

describe("Mr. White prompts", () => {
  it("tells him to bluff toward the others' word and passes player names to the guess grammar", async () => {
    const { seat: s, llm } = seat(() => "shark");
    await s.clue(view("mr-white", 1), []);
    await s.guess(view("mr-white", 2), []);
    expect(lastUser(llm.requests[0]!)).toContain("give clues that fit THAT word");
    expect(llm.requests[1]!.shape).toEqual({ kind: "guess", exclude: ["Ana", "Bo", "Cy"] });
  });
});
