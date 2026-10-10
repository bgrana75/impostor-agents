import { CLUE_MAX_WORDS, MAX_ROUNDS } from "./rules.js";
import type { ChatMessage, Mode, PlayerView, Rejection, RoundRecord } from "./types.js";

/** Bumped whenever prompt wording changes, so results stay comparable. */
export const PROMPT_VERSION = 4;

// Layout for KV-cache reuse: the system message is identical for every call in a
// game, the user message starts with the shared public log and ends with the
// caller's private part, so consecutive calls differ only after the log.

const FORMATS = `Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.`;

function rulesUndercover(names: string[]): string {
  return `You are playing "Undercover", a party word game for ${names.length} players: ${names.join(", ")}.

Every player has a secret word. ${names.length - 1} players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most ${CLUE_MAX_WORDS} words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round ${MAX_ROUNDS}.

${FORMATS}`;
}

function rulesMrWhite(names: string[]): string {
  return `You are playing "Mr. White", a party word game for ${names.length} players: ${names.join(", ")}.

${names.length - 1} players share the same secret word. One player, Mr. White, has no word and knows it; everyone else knows there is one Mr. White among them but not who. Mr. White must bluff: listen to the clues, guess what the word is, and give clues that sound like they know it.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about the word: at most ${CLUE_MAX_WORDS} words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that the others see you know the word, but vague enough that Mr. White cannot guess it.
2. Vote: every player votes to eliminate the player they believe is Mr. White, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

If Mr. White is eliminated, he gets one guess at the word: a correct guess wins him the game, otherwise the others win. Mr. White also wins by surviving until only 2 players remain, or until the end of round ${MAX_ROUNDS}.

${FORMATS}`;
}

export function systemPrompt(mode: Mode, names: string[]): string {
  return mode === "undercover" ? rulesUndercover(names) : rulesMrWhite(names);
}

const roleLabel = (mode: Mode, role: string) =>
  role === "civilian" ? "a civilian" : mode === "undercover" ? "the undercover" : "Mr. White";

export function transcript(mode: Mode, rounds: readonly RoundRecord[]): string {
  const lines = ["Game log:"];
  for (const r of rounds) {
    lines.push(`Round ${r.round} clues:`);
    for (const c of r.clues) lines.push(c.passed ? `${c.name} passed.` : `${c.name}: "${c.text}"`);
    if (r.votes.length === 0) continue;
    lines.push(`Round ${r.round} votes:`);
    for (const v of r.votes) lines.push(v.reason ? `${v.voter} votes ${v.target}: ${v.reason}` : `${v.voter} votes ${v.target}.`);
    lines.push(
      r.eliminated
        ? `${r.eliminated} was eliminated. ${r.eliminated} was ${roleLabel(mode, r.eliminatedRole!)}.`
        : "Tie: nobody was eliminated.",
    );
  }
  return lines.join("\n");
}

/** What the private ODD/FIT step concluded (mode A only, never shown to anyone else). */
export interface Assessment {
  odd: boolean;
  /** The word the agent thinks the others have, when odd. */
  othersWord: string | null;
}

function identity(view: PlayerView): string {
  const { me } = view;
  const who = `You are ${me.name}, ${me.style}. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.`;
  if (me.word !== null) return `${who}\nYour secret word: "${me.word}".`;
  return `${who}
You are Mr. White: you do not know the word. Read the others' clues, work out what word they describe, and give clues that fit THAT word so you look like one of them. Never admit you don't know the word.`;
}

function withPrivate(view: PlayerView, privatePart: string): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt(view.setup.mode, view.setup.names) },
    { role: "user", content: `${transcript(view.setup.mode, view.rounds)}\n\n---\n${identity(view)}\n${privatePart}` },
  ];
}

const retries = (rejected: readonly Rejection[], what: string) =>
  rejected.map((r) => `Your ${what} "${r.text}" was rejected: ${r.reason}. Try again.`);

export function assessPrompt(view: PlayerView): ChatMessage[] {
  return withPrivate(
    view,
    `Private check, round ${view.round} (nobody else sees this). Do the other players' clues fit your word "${view.me.word}", or a related but different word? Answer FIT if they fit "${view.me.word}". Otherwise answer ODD followed by the word their clues describe instead (example: ODD marker).`,
  );
}

export function cluePrompt(view: PlayerView, rejected: readonly Rejection[], note?: Assessment): ChatMessage[] {
  const word = view.me.word;
  const lines = [`Clue turn, round ${view.round}. Give your clue: 2 to 6 plain words.`];
  if (word) lines.push(`Do not say "${word}" or any form of it.`);
  if (note?.odd) {
    const theirs = note.othersWord ? ` (probably "${note.othersWord}")` : "";
    lines.push(`You may be the odd one out. Give a clue that fits the others' word${theirs} instead.`);
  }
  return withPrivate(view, [...lines, ...retries(rejected, "clue")].join("\n"));
}

export function votePrompt(
  view: PlayerView,
  candidates: readonly string[],
  rejected: readonly Rejection[],
  note?: Assessment,
): ChatMessage[] {
  const target = view.setup.mode === "undercover" ? "the undercover" : "Mr. White";
  // A clue that fits the word well marks a teammate, not a suspect: small models invert this.
  const how =
    view.me.word === null || note?.odd
      ? "Vote for the player whose clues look least like the others', so your vote looks like a normal pick."
      : "Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it.";
  return withPrivate(
    view,
    [
      `Vote turn, round ${view.round}. Who is ${target}? ${how} Judge the clues only, not how people talk.`,
      `Choose one of: ${candidates.join(", ")}. Reply as: Name | reason (at most 10 words)`,
      ...(view.me.word ? [`Never write "${view.me.word}" in the reason; say "my word" instead.`] : []),
      ...retries(rejected, "vote"),
    ].join("\n"),
  );
}

/**
 * Mr. White's last chance. A bare question over the others' clues: with the rules, the log
 * and its bluffing instructions in front of it, the model answered with another clue.
 */
export function guessPrompt(view: PlayerView, rejected: readonly Rejection[]): ChatMessage[] {
  const clues = view.rounds.flatMap((r) => r.clues).filter((c) => c.name !== view.me.name && !c.passed);
  return [
    { role: "system", content: "You solve word-guessing puzzles. Reply with one word." },
    {
      role: "user",
      content: [
        "These clues all describe the same secret word, a common noun:",
        ...clues.map((c) => `- ${c.text}`),
        "What is the word? Reply with the word only.",
        ...retries(rejected, "guess"),
      ].join("\n"),
    },
  ];
}
