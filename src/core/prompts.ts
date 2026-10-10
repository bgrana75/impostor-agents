import { CLUE_MAX_WORDS, MAX_ROUNDS } from "./rules.js";
import type { ChatMessage, Mode, PlayerView, RoundRecord } from "./types.js";

/** Bumped whenever prompt wording changes, so results stay comparable. */
export const PROMPT_VERSION = 3;

// Layout for KV-cache reuse: the system message is identical for every call in a
// game, the user message starts with the shared public log and ends with the
// caller's private part, so consecutive calls differ only after the log.

const FORMATS = `Answer formats (one line, nothing else):
- Clue turn: the clue only, 2 to 6 words, no name or label. Example for the word "pen": ink on paper
- Vote turn: Name | one short sentence about that player's clues
- Guess turn: one word.`;

function rulesUndercover(names: string[]): string {
  return `You are playing "Undercover", a party word game for ${names.length} players: ${names.join(", ")}.

Every player has a secret word. ${names.length - 1} players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most ${CLUE_MAX_WORDS} words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a one-sentence reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round ${MAX_ROUNDS}.

${FORMATS}`;
}

function rulesMrWhite(names: string[]): string {
  return `You are playing "Mr. White", a party word game for ${names.length} players: ${names.join(", ")}.

${names.length - 1} players share the same secret word. One player, Mr. White, has no word and knows it; everyone else knows there is one Mr. White among them but not who. Mr. White must bluff: listen to the clues, guess what the word is, and give clues that sound like they know it.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about the word: at most ${CLUE_MAX_WORDS} words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that the others see you know the word, but vague enough that Mr. White cannot guess it.
2. Vote: every player votes to eliminate the player they believe is Mr. White, with a one-sentence reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

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
    for (const v of r.votes) lines.push(`${v.voter} votes ${v.target}: ${v.reason}`);
    lines.push(
      r.eliminated
        ? `${r.eliminated} was eliminated. ${r.eliminated} was ${roleLabel(mode, r.eliminatedRole!)}.`
        : "Tie: nobody was eliminated.",
    );
  }
  return lines.join("\n");
}

function identity(view: PlayerView): string {
  const { me } = view;
  const who = `You are ${me.name}, ${me.style}. Speak in that style, briefly.`;
  if (me.word !== null) return `${who}\nYour secret word: "${me.word}".`;
  return `${who}\nYou are Mr. White: you have no word. Bluff using the clues above.`;
}

function withPrivate(view: PlayerView, privatePart: string): ChatMessage[] {
  const names = view.setup.names;
  return [
    { role: "system", content: systemPrompt(view.setup.mode, names) },
    { role: "user", content: `${transcript(view.setup.mode, view.rounds)}\n\n---\n${identity(view)}\n${privatePart}` },
  ];
}

export function cluePrompt(view: PlayerView, rejected: readonly { text: string; reason: string }[]): ChatMessage[] {
  const word = view.me.word;
  const avoid = word ? ` Do not say "${word}" or any form of it.` : "";
  const retry = rejected.map((r) => `Your clue "${r.text}" was rejected: ${r.reason}. Give a different clue.`);
  return withPrivate(
    view,
    [`Clue turn, round ${view.round}. Give your clue: 2 to 6 words.${avoid}`, ...retry].join("\n"),
  );
}

export function votePrompt(view: PlayerView, candidates: readonly string[]): ChatMessage[] {
  const target = view.setup.mode === "undercover" ? "the undercover" : "Mr. White";
  // A clue that fits the word well marks a teammate, not a suspect: small models invert this.
  const how =
    view.me.word === null
      ? "Vote for a player who is not you, ideally one the others already suspect."
      : "Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it.";
  return withPrivate(
    view,
    `Vote turn, round ${view.round}. Who is ${target}? ${how} Judge the clues only, not how people talk. Choose one of: ${candidates.join(", ")}. Reply as: Name | short reason`,
  );
}

export function guessPrompt(view: PlayerView): ChatMessage[] {
  return withPrivate(view, "Guess turn: you were voted out. What is the others' secret word? Reply with one word.");
}
