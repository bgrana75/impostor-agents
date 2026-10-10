## What changed since run 1

- **Leaks closed.** Vote reasons now get the same word check as clues (the voter's own word and its
  forms), plus a 12-word cap, with up to 3 tries. If all 3 fail, the vote keeps its target and drops
  the reason. Voters are told to write "my word" instead of the word: 491 of 643 4B reasons do.
  Over all 35 run-2 Mr. White guesses, the civilians' word was absent from the public log every
  time (run 1: present before all 8 model-vote guesses).
- **Clues.** The prompt is now example-led ("for the word banana: yellow and curved / monkeys love it"),
  asks for 2–6 words, and runs at temperature 0.5. Meta clues ("(No clue given)", "pass") are invalid.
  Every agent is told that the length rules override its persona.
- **Bluffing.** Mr. White is told to work out the word from the others' clues and fit it, never
  admitting it doesn't know. In mode A, every agent privately answers FIT or ODD before its clue
  from round 2 on. The answer is never in anyone else's prompt; the isolation test checks this.
- **Guess.** Mr. White's guess is now a bare puzzle: the other players' clues and "what is the
  word?". It must be one word and not a player's name, with up to 3 tries. Three versions failed
  before this one (details at the end).
- **Deals.** Seed *n* deals different pairs per mode: 40 pairs over 20 seeds.
- **Judge.** A post-hoc bluff judge (the 4B, temperature 0) reads every clue and says which word it
  describes.

## Read (hand-written)

**Short version:** neither model plays this game well enough to build on with this prompt. The 4B now
deduces at chance in *both* modes, which is worse than run 1 in mode B. Its bluffing is mostly
accidental. The 1.5B mostly can't follow the format at all. Most of the regression traces to
one prompt change: the banana example collapsed clues into a template.

- **Clues collapsed into "adjective and adjective".** 50% of the 4B's accepted clues in run 2 match
  "X and Y…", against 2% in run 1. "sunny" opens 152 clues for every kind of word: "sunny and sweet"
  for jam, eagle, cat and nurse alike. The template carries almost no information, so:
  - civilian votes hit the impostor 22% (mode A) and 19% (mode B) of the time, against about 25% chance;
  - Mr. White guessed 1/10 for the 4B, even with a clean log;
  - "it repeats an earlier clue" became the second-biggest rejection reason: 243 in mode A,
    309 in mode B (52 and 53 in run 1).

  Run 1's mode-B edge (34% vs 24%) is gone. Mr. White's clues are no longer the odd ones out,
  because nobody's clues stand out.
- **Bluffing, measured in mode A (the judge is informative there).** On civilians' clues the judge
  picks the civilians' word 80% of the time (control). On the undercover's clues it does so 19% of the
  time: 29% in round 1 and **15% in rounds 2+**. The undercover's clues describe its *own* word, and
  they get *less* blended after the private ODD/FIT step, not more.
- **The ODD/FIT step barely discriminates.** In round 2, the undercover answered ODD 31% of the time
  (5/16) and civilians 26% (18/69); in round 3 it was 31% vs 12%. When the undercover did say ODD, it
  named the civilians' word 4 times. Even then it rarely acted on it. In `undercover-4` (hat/helmet),
  the undercover privately answered "ODD hat" in rounds 2 and 3, then kept saying "metal, tough,
  protects head" and was voted out. The 1.5B answered FIT 431 times out of 431. The step is about 18%
  of mode-A phone time.
- **Mr. White does blend, mostly by copying.** In `mr-white-15` (pear), Mr. White spoke first with
  "sour and sticky", then took the table's vocabulary ("silk and juicy, tree fruit, soft and round"),
  drew no votes in four rounds, and won. That is a real bluff, and the instruction to fit the others'
  word works. But civilians copy each other just as much, so the vote can't separate them. The mode-B
  judge is not informative: with "the word vs. none of these" it picks the word 99% of the time even
  for civilians, and it reads "sunny and sweet" as *cat* and *nurse*. I report its 95% only for
  completeness.
- **Deduction does happen when one clue really stands out.** In `undercover-13` (dog/wolf), the
  undercover said "fierce and free, howls at moonlight" after five barking clues. It got 5 of 5
  civilian votes, all with reason "howls at moonlight doesn't match my word". 4B round-1 hits are 26%
  vs 20% chance in mode A, a hint but inside the noise. Later rounds sit at or below chance.
- **Personas: much better, not fixed.** For Lena (opera singer), the 4B's pass rate fell from 44% to
  12% in mode A (24/55 → 15/123) and from 14% to 4% in mode B. Joe (fisherman) is now the worst at 15%.
  Persona bleed into votes is mostly gone: 4B reasons are short and clue-focused.
- **1.5B: not viable as a player.**
  - 78% of mode-A clue attempts were invalid and half of all clue turns passed.
  - Of its 3,083 clue attempts, 953 echo the prompt ("Clue turn, round 1. Give your clue: 2 to") and
    637 name a persona trait ("flowery and grand / I'm not").
  - 90 copy the banana example, e.g. "yellow and curved / monkeys love it" as a clue for *lion*.
  - Its vote reasons are literal: "my word is orange and spotted / I'm not".
  - Its 45% mode-A "blend" is an artifact of those copied lines, not bluffing.
  - Its Mr. White guesses were better than the 4B's (3/7: eagle, rose, beer), probably because the
    4B's clue collapse left the 4B Mr. White less to go on.

**Verdict.** Not worth building as a phone game on these models with this approach yet. The engine,
isolation and measurement are solid and reusable. The model side has two separate problems, and neither
has been shown solvable here:

1. *Clue quality is fragile to the prompt.* Run 1's flowery-but-informative clues gave a real mode-B
   signal. Run 2's example-led prompt fixed the length problem and destroyed the information.
2. *Theory of mind is weak.* The undercover rarely realizes it is odd, and when it does, it doesn't
   change its clues. The 4B can copy, not plan.

If you want one more try before deciding, I'd run a v5 with several varied clue examples that
aren't all "X and Y", no example in the guess, and no ODD step (it costs 18% and doesn't work), on mode B
only. Mode B is the variant where a 4B showed real signal in run 1. A 4B round costs about 110–130 s on a
Pixel 6a even with the prefix cache: about 9 s per agent vote and 6 s per clue. That is slow but tolerable
for a turn-based party game if the human's own turns overlap with agent thinking.

### Guess prompt attempts (mode B, before the kept run)

1. A one-word letters-only grammar. The model wanted a description, so it glued one: "sillyandnimble"
   for *cat*, "transparentandclear" for *window* (18/19 guesses).
2. Same grammar, word capped at 14 letters: still glued.
3. A free line plus "The word is …" lead-in: the 4B hedged with "likely a fruit with sticky…", and
   the 1.5B copied the example ("banana").
4. Kept: no rules, no log, no bluff instructions. Just the other players' accepted clues and "What is the
   word? Reply with the word only." On the same game states it gave caramel/jam, eagle/eagle, violin/guitar.

The guess runs only when Mr. White is voted out, so mode A was unaffected. All run-2 mode-B games
were re-run with the kept prompt.

### Method notes

- Sampling is seeded per call, but the KV-cache state differs between runs, so a replayed seed
  diverges slightly. Reproducibility is per run, not bit-exact across runs.
- Votes with all three reasons rejected keep their target with no reason: 16 + 13 for the 4B, 58 + 46
  for the 1.5B.
- The judge alternates which option is A and which is B, to cancel position bias. Its calls are excluded
  from game cost.
