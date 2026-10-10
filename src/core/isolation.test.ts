import { describe, expect, it } from "vitest";
import { PERSONAS } from "../data/personas.js";
import { WORD_PAIRS } from "../data/wordPairs.js";
import { FakeLlm } from "../llm/fake.js";
import { LlmSeat, type CallLog } from "./agent.js";
import { playGame } from "./game.js";
import { makeRng } from "./rng.js";
import { createGame } from "./setup.js";
import type { GameSetup, Mode, Seat } from "./types.js";

async function playLogged(seed: number, mode: Mode) {
  const setup = createGame(seed, mode, WORD_PAIRS, PERSONAS);
  const rng = makeRng(seed);
  // Neutral clues (never a secret word), votes for a seed-dependent candidate, and
  // private ODD/FIT answers that carry a unique marker word we can trace.
  const llm = new FakeLlm((req, i) => {
    if (req.shape?.kind === "vote") return `${req.shape.names[(seed + i) % req.shape.names.length]} | odd clue`;
    if (req.shape?.kind === "assess") return i % 2 ? `ODD zqmark${i}` : "FIT";
    return `fake clue ${i}`;
  });
  const calls: CallLog[] = [];
  const seats = new Map<string, Seat>(
    setup.players.map((p) => [p.name, new LlmSeat(llm, (c) => calls.push(c), () => 0)]),
  );
  const result = await playGame(setup, seats, rng);
  return { setup, calls, result };
}

const privatePart = (c: CallLog) => c.messages[1]!.content.split("\n---\n")[1]!;
const fullText = (c: CallLog) => c.messages.map((m) => m.content).join("\n").toLowerCase();
// Whole word or plural: "tea" must not match the persona "chemistry teacher".
const has = (text: string, word: string) => new RegExp(`\\b${word.toLowerCase()}(e?s)?\\b`).test(text);

function otherSecrets(setup: GameSetup, name: string): string[] {
  const mine = setup.players.find((p) => p.name === name)!.word;
  return [setup.civilianWord, setup.impostorWord].filter((w): w is string => w !== null && w !== mine);
}

describe.each(["undercover", "mr-white"] as const)("agent isolation (%s)", (mode) => {
  it("no prompt ever contains another player's secret word", async () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { setup, calls } = await playLogged(seed, mode);
      expect(calls.length).toBeGreaterThan(10);
      for (const c of calls) {
        for (const w of otherSecrets(setup, c.player)) expect(has(fullText(c), w), `${setup.id} ${c.player}`).toBe(false);
      }
    }
  });

  it("each call carries exactly one private part, its own, at the end", async () => {
    const { setup, calls } = await playLogged(11, mode);
    for (const c of calls) {
      expect(c.messages).toHaveLength(2);
      const priv = privatePart(c);
      expect(priv.startsWith(`You are ${c.player},`)).toBe(true);
      for (const p of setup.players) if (p.name !== c.player) expect(priv).not.toContain(p.style);
    }
  });

  it("uses one identical system message for every call in a game", async () => {
    const { calls } = await playLogged(12, mode);
    expect(new Set(calls.map((c) => c.messages[0]!.content)).size).toBe(1);
  });
});

describe("undercover mode hides roles", () => {
  it("never tells anyone their role, and the undercover's private part reads like a civilian's", async () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { setup, calls } = await playLogged(seed, "undercover");
      const masks = { civilian: new Set<string>(), impostor: new Set<string>() };
      for (const c of calls) {
        const priv = privatePart(c);
        expect(priv).not.toMatch(/you are (the |an? )?(undercover|impostor|civilian)/i);
        const p = setup.players.find((x) => x.name === c.player)!;
        masks[p.role].add(
          priv
            .replace(p.name, "NAME")
            .replace(p.style, "STYLE")
            .replaceAll(`"${p.word}"`, "WORD")
            .replace(/round \d/, "")
            .replace(/zqmark\d+/, "MARK")
            .replace(/Choose one of: .*\. Reply/, "Choose. Reply"),
        );
      }
      // Every kind of prompt the undercover sees, civilians see too: nothing depends on role.
      for (const m of masks.impostor) expect(masks.civilian.has(m), m).toBe(true);
    }
  });

  it("keeps each agent's private ODD/FIT answer out of everyone else's prompts", async () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { calls } = await playLogged(seed, "undercover");
      const assess = calls.filter((c) => c.kind === "assess");
      expect(assess.length).toBeGreaterThan(0);
      expect(assess.every((c) => c.private)).toBe(true);
      for (const a of assess.filter((c) => c.output.startsWith("ODD"))) {
        const marker = a.output.split(" ")[1]!;
        const seenBy = new Set(calls.filter((c) => fullText(c).includes(marker)).map((c) => c.player));
        expect([...seenBy]).toEqual([a.player]);
      }
    }
  });

  it("the public log reveals a role only for eliminated players", async () => {
    const { setup, calls } = await playLogged(4, "undercover");
    for (const c of calls) {
      const log = c.messages[1]!.content.split("\n---\n")[0]!;
      for (const p of setup.players) {
        if (log.includes(`${p.name} was the undercover`) || log.includes(`${p.name} was a civilian`)) {
          expect(log).toContain(`${p.name} was eliminated`);
        }
      }
    }
  });
});
