## Read (hand-written)

**Short version: with this prompt, Qwen3-4B plays Mr. White (mode B) noticeably better than chance and
Undercover (mode A) at chance.** Ten games per mode is a small sample: a 6/10 win rate has a 95% interval
of about ±30 points, so read the win rates as anecdotes. The per-vote numbers (100+ civilian votes per row) are
the more useful signal.

- **Mode B deduction is real but shallow.** Civilian votes hit Mr. White 34% of the time over all rounds,
  against about 24% expected by chance and 18% in the random-vote games. In round 1 it was 36% vs 20%.
  Mr. White usually gives itself away with persona-flavoured nonsense, and the civilians do catch that:
  for the word *dog*, Mr. White said "faint whispers in the grand hall's hush", and the vote reason was
  *"has no connection to a dog; it's poetic nonsense"*. When Mr. White copies the others' imagery,
  it survives.
- **Mode A deduction is at chance.** Civilian votes hit the undercover 24% of the time, the same as
  random. In rounds 1–2 they hit less often than random (14% and 15% vs 20% and 23%). Civilians mostly
  vote each other out over style ("too clinical", "too poetic") or over related words. In
  `undercover-10` (nurse/doctor) the civilians took out three of their own for clues that "sound like a doctor,
  not a nurse", while the real doctor won by blending in.
- **The undercover rarely notices it is the odd one out.** Most of its valid clues stay on its own word
  until the end. As *pool* among *beach* players, it said "blue water, cool, still, no waves, deep" in
  all four rounds, against a table of "warm sand, waves". As *wolf* among *dog* players, it passed all four
  turns on the length rule and still won. Only two games show any drift: in egg/potato it said "bounces, soft, starts inside,
  warm, grows underground", mixing the two words, and in umbrella/raincoat it said "holds umbrella".
- **Vote reasons leak secret words. This is the biggest flaw, and it is in the rules, not the model.**
  Civilians named their own word in 72% of their vote reasons in mode A and 74% in mode B ("doesn't match a
  shark"). The undercover named its own word in 28 of 33 ("don't match the stillness of a pool"). In the mode B
  model-vote games, the civilians' word was in the public log before **all 8** Mr. White guesses, and
  Mr. White got 3 right. The random-vote games have no vote reasons, and there Mr. White's only correct
  guess (of 3) was *mirror*: in round 1 of `mr-white-4`, after five reflection clues, it had said "smooth
  surface, quiet mirror" itself. The vote reason needs the same word check as clues, or it should be dropped.
- **Clue discipline is poor.** 61% of clue attempts in mode A and 38% in mode B were invalid, mostly for
  being over 8 words. 105 clue turns ended in a pass after three rejections. The flowery personas make
  it worse: in mode A, Lena (opera singer) passed 24 of 55 turns while Marta ("short, flat sentences")
  passed 5 of 51. The model also copies log text: "(No clue given)" and "(whispers) barks, loyal, …" got
  through as clues.
- **Persona bleed into reasoning.** Votes judge personas instead of clues ("lacks the theatrical grandeur of
  a true opera singer"), even though the vote prompt says to judge only the clues.
- **The guess prompt is broken.** In 3 of the 11 Mr. White guesses, the guess was a player name ("theo"),
  because the last thing in the log is the vote list. The grammar should exclude player names.

**Verdict.** A 4B model can produce game-shaped play: valid votes 100% of the time thanks to the
grammar, sensible-sounding reasons, and occasional real catches in mode B. But it does not bluff, and
in mode A it does not deduce. It is not noise in mode B, and it is close to noise in mode A. Before
spending more games, I would fix in this order: (1) a word check on vote reasons, with a retry;
(2) shorter clues: "2 to 5 words", one few-shot example per persona, and lower clue temperature;
(3) a guess grammar without player names; (4) for mode A, a private one-line "do the clues fit my word?"
step before the clue. Point 4 costs about 20 extra generated tokens per turn, which is about 4 s on a
Pixel 6a.

### Prompt history (before these runs)

- v1: clue format "the clue only", no length hint. In the first trial game no round-1 clue was valid:
  almost all were 9+ words or opened with the word itself ("shark-like, swift, …"). Votes judged personas.
- v2: added "2 to 6 words" and a "do not say \"<word>\"" line, and a GBNF grammar capping clues at 8
  space-separated words. The grammar made the model glue words ("cutsThroughwater") and drift into
  Chinese and Russian ("вкусный, белый, как солнце"). Removed. Votes often accused players whose
  clues fit the word *too well*.
- v3 (these runs): printable-ASCII single-line grammars, length enforced by validation and retry, and a vote
  instruction to "vote for the player whose clues fit your word the worst; clues that fit well mean that
  player shares it".

### Method notes

- Seed *n* gives the same word pair, cast and impostor seat in both modes, so the 10 seeds cover 10 word
  pairs. The random-vote baseline replays each seed with clues sampled from the same per-call seeds:
  round-1 clues are identical to the model-vote game, and they diverge after the first vote.
- Rejected clue attempts are private. They never enter the public log, because a rejected clue can
  contain the player's word.
- "Evaluated" tokens are measured by node-llama-cpp's token meter on the context sequence. They matched
  the shared-prefix length computed by hand within 1 token.
