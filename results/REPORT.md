# Impostor agents: simulation report

## Run 3: human Mr. White vs five agent civilians (Qwen3-4B, prompt v5)

Mr. White is always the human seat, played here by scripted strategies; the five civilians are agents.
20 seeds per strategy, same seeds (same words, cast and seats) across strategies; the impostor's seat rotates with the seed (seat = (seed − 1) mod 6).
The scripted impostor votes for a random player and never attempts the final guess, so "civilians win" = "impostor caught".
Strategies: **perfect** (secretly given the word; honest model clues), **copycat** (recombines words from this or last round's clues), **generic** ("something common", "found at home"), **off-topic** (honest model clues about a random other word).

### Read (hand-written)

**Short version: no, not yet.** The agents give good clues but don't vote on them. Five 4B civilians
catch a human who says "something common" every round no more often than they catch one who gives
honest clues. Their votes sit at chance whatever the impostor does:

| impostor | round-1 votes on the impostor | chance |
|---|---|---|
| perfect | 28% | 20% |
| copycat | 18% | 20% |
| generic | 12% | 20% |
| off-topic | 25% | 20% |

Over all rounds every strategy sits at 22–31% against 25–26% chance. Random voting on the same seeds
catches the copycat as often (65% vs 65%) and the generic impostor more often (55% vs 50%). Each game
also costs 1.6–2.0 civilians wrongly voted out, against 1.1–1.4 with random votes.

- **The clues are fine, the voting isn't.** Asked about one clue at a time (civilians' word vs a random
  distractor), the 4B judge reads the civilians' clues as the word 93% of the time. The generic
  impostor's clues score 54%, a coin flip, and the copycat's 79%. So the information is there, and the
  model can see it one clue at a time. It loses it when it has to compare five clues and output a name.
  Of 975 civilian vote reasons, 463 call some clue "vague/too general". Usually that is a civilian's
  informative clue: "A bird of prey with piercing eyes" for *eagle* was voted out as "too vague, lacks
  key traits like sharp beak".
- **Per-clue scoring would work much better (offline estimate, not played).** Suppose each civilian
  voted for a player whose clue the judge marked as not fitting, at random among them. Round-1 votes
  on the impostor would then be 46% for generic, 51% for off-topic and 35% for copycat (chance 20%).
  Against the perfect impostor they would be 14%, which is fair. That is the design to test next:
  the engine asks the model to rate each clue against the word separately, and votes from the scores.
  It needs no comparison reasoning and no name attribution.
- **Attribution errors happen but are secondary.** When a vote's reason clearly quotes one clue
  (364 votes), 77% vote for that clue's author. When it quotes the human's clue, 102 of 107 vote the
  human. But in the eagle/generic game, three voters called "something common" too vague and voted for
  Joe, who spoke right after the human.
- **Not clue-driven, partly position-driven (fairness).** With the perfect impostor (honest clues):
  - Round-1 votes on it are 28% vs 20% chance (CI 20–37%), only mildly above chance.
  - The first two speakers draw fewer votes (33 and 34 against about 45 for an even split), and
    positions 3–5 draw more (51, 48, 51).
  - When the perfect impostor sat in seat 0, which always opens round 1, it was caught 0 of 4 times.
    In seats 1–4 it was caught 11 of 13.

  Speaking first is a shield. That's a fairness problem for a human player, on top of the votes not
  following the clues.
- **The human's random vote is a big lever.** With 3–4 players left, one deflecting vote decides ties
  and pluralities. In the generic/window game the human survived four rounds while four civilians went
  out, three of them with its vote in the winning plurality.
- **Clue prompt v5: the collapse is gone, and length needed repair.**
  - 5% of accepted clues match "X and Y" (run 2: 50%). The top opener is "A …" (42%), which still carries
    information. Openers are otherwise varied.
  - 54% of accepted clues were trimmed at a comma to fit 8 words: 90% of Lena's, 22% of Marta's.
  - Passes fell to 1%.
  - Remaining rejections are mostly repeats (237) and copied log text (74). "No" still slipped through
    once as a clue.
- **Informativeness doesn't separate run 1 from run 2** (90% vs 91% vs a random distractor). A random
  distractor from another pair is a low bar: "sunny and sweet" is still nearer *jam* than *hammer*.
  It does separate honest clues (93–96%) from generic ones (54%), which is what run 3 needs.

**Cost** (5 agents, 1 free human seat):
- About 9.5 agent calls per round, 5 s on the Mac.
- With the prefix cache, about 86 s per round on a Pixel 6a and 69 s on a Dimensity 8300. Without it,
  352 s and 294 s.
- The human waits about 11 s per agent clue on the Pixel (9 s on the Dimensity), and about 43 s (34 s)
  for the five agent votes.
- That's playable as a slow, turn-based game. The voting, not the speed, is what's broken.

**Verdict:** "human Mr. White vs five 4B civilians" is not a game yet. The civilians can't be beaten
or lost to on skill, because their votes don't follow the clues. One cheap experiment could flip
that. Replace free-form voting with per-clue scoring, using the same model and the same call budget:
one short "does this clue fit the word? A/B" call per other player instead of one vote call. That
removes the comparison and the name attribution. The offline estimate says it would catch generic
and off-topic humans 2–2.5× more often than chance while leaving honest clues alone. If a played run
confirms that, the game is worth building, with seat order shuffled each round to remove the
first-speaker shield.

### Catch rate per strategy vs chance

| impostor | votes | games | caught (civilians win) | caught in round 1/2/3/4 | round-1 civilian votes on impostor | chance | all-round votes on impostor | chance | civilians wrongly voted out per game |
|---|---|---|---|---|---|---|---|---|---|
| perfect | model | 20 | 12/20 = 60% | 6 / 1 / 3 / 2 | 28/100 = 28% [20%–37%] | 20% | 70/228 = 31% [25%–37%] | 25% | 1.6 |
| copycat | model | 20 | 13/20 = 65% | 3 / 4 / 1 / 5 | 18/100 = 18% [12%–27%] | 20% | 64/251 = 25% [21%–31%] | 25% | 2.0 |
| generic | model | 20 | 10/20 = 50% | 1 / 4 / 2 / 3 | 12/100 = 12% [7%–20%] | 20% | 59/269 = 22% [17%–27%] | 25% | 2.0 |
| off-topic | model | 20 | 13/20 = 65% | 4 / 3 / 3 / 3 | 25/100 = 25% [18%–34%] | 20% | 63/227 = 28% [22%–34%] | 26% | 2.0 |
| copycat | random | 20 | 13/20 = 65% | 4 / 4 / 3 / 2 | 24/100 = 24% [17%–33%] | 20% | 64/256 = 25% [20%–31%] | 22% | 1.1 |
| generic | random | 20 | 11/20 = 55% | 3 / 1 / 5 / 2 | 24/100 = 24% [17%–33%] | 20% | 75/282 = 27% [22%–32%] | 23% | 1.4 |

| impostor | votes | round | civilian votes on impostor [95% CI] | chance |
|---|---|---|---|---|
| perfect | model | 1 | 28/100 = 28% [20%–37%] | 20% |
| perfect | model | 2 | 16/58 = 28% [18%–40%] | 24% |
| perfect | model | 3 | 15/44 = 34% [22%–49%] | 30% |
| perfect | model | 4 | 11/26 = 42% [26%–61%] | 38% |
| copycat | model | 1 | 18/100 = 18% [12%–27%] | 20% |
| copycat | model | 2 | 21/72 = 29% [20%–41%] | 24% |
| copycat | model | 3 | 10/46 = 22% [12%–36%] | 28% |
| copycat | model | 4 | 15/33 = 45% [30%–62%] | 36% |
| generic | model | 1 | 12/100 = 12% [7%–20%] | 20% |
| generic | model | 2 | 21/81 = 26% [18%–36%] | 23% |
| generic | model | 3 | 14/51 = 27% [17%–41%] | 29% |
| generic | model | 4 | 12/37 = 32% [20%–49%] | 35% |
| off-topic | model | 1 | 25/100 = 25% [18%–34%] | 20% |
| off-topic | model | 2 | 14/65 = 22% [13%–33%] | 25% |
| off-topic | model | 3 | 15/40 = 38% [24%–53%] | 33% |
| off-topic | model | 4 | 9/22 = 41% [23%–61%] | 45% |
| copycat | random | 1 | 24/100 = 24% [17%–33%] | 20% |
| copycat | random | 2 | 19/72 = 26% [18%–38%] | 22% |
| copycat | random | 3 | 13/49 = 27% [16%–40%] | 24% |
| copycat | random | 4 | 8/35 = 23% [12%–39%] | 26% |
| generic | random | 1 | 24/100 = 24% [17%–33%] | 20% |
| generic | random | 2 | 15/77 = 19% [12%–30%] | 22% |
| generic | random | 3 | 21/66 = 32% [22%–44%] | 24% |
| generic | random | 4 | 15/39 = 38% [25%–54%] | 28% |

Fairness check on the **perfect** set (the impostor's clues are honest, so votes on it should be at chance).
Civilian votes received by position in the round's clue order, against an even split of the same votes:

| clue position | votes received | even split |
|---|---|---|
| 1 | 33 | 44.6 |
| 2 | 34 | 45.7 |
| 3 | 51 | 45.0 |
| 4 | 48 | 41.5 |
| 5 | 51 | 32.9 |
| 6 | 11 | 18.4 |

Perfect impostor caught, by its seat: seat 0: 0/4, seat 1: 4/4, seat 2: 2/3, seat 3: 2/3, seat 4: 3/3, seat 5: 1/3.

### Clue informativeness (judge: civilians' word vs a random distractor)

Each clue is judged by the 4B at temperature 0: does it describe the civilians' word or a random word from another pair (A/B order alternates)? 50% is a coin flip.

| clues | judged as the civilians' word [95% CI] |
|---|---|
| run 1 (4B, prompt v3), civilians | 86/96 = 90% [82%–94%] |
| run 2 (4B, prompt v4), civilians | 244/268 = 91% [87%–94%] |
| run 3 (4B, prompt v5), civilians, all sets | 1385/1493 = 93% [91%–94%] |
| run 3, impostor clues: perfect | 54/56 = 96% [88%–99%] |
| run 3, impostor clues: copycat | 49/62 = 79% [67%–87%] |
| run 3, impostor clues: generic | 36/67 = 54% [42%–65%] |
| run 3, impostor clues: off-topic | 35/59 = 59% [47%–71%] |

### Clue quality

Civilian clues over all 120 games: 1513 turns, 1916 attempts, 423/1916 = 22% invalid (it repeats an earlier clue: 237, not a clue: 74, more than 8 words: 110, it contains your secret word or a form of it: 2); 20/1513 = 1% turns passed; 811/1493 = 54% accepted clues were trimmed at a comma to fit 8 words. (All seats, impostor included: 21 passes in 1879 turns.)

Template check: 73/1493 = 5% of accepted civilian clues match "X and Y …" (run 2: 50%). Top opening words: a 633, bubbles 42, sour 30, red 26, fruit 25, soft 25, golden 25, sleek 25, fragrant 25, sweeps 24.

| persona (civilian turns) | style | turns | passed | trimmed |
|---|---|---|---|---|
| Theo | an over-excited teenage gamer; slangy and dramatic | 231 | 7/231 = 3% | 136/231 = 59% |
| Priya | a precise chemistry teacher; careful, logical wording | 331 | 8/331 = 2% | 104/331 = 31% |
| Lena | a theatrical opera singer; flowery and grand | 257 | 2/257 = 1% | 232/257 = 90% |
| Joe | a laid-back fisherman; folksy and slow | 263 | 2/263 = 1% | 169/263 = 64% |
| Omar | a suspicious taxi driver; dry, sarcastic remarks | 216 | 1/216 = 0% | 123/216 = 57% |
| Marta | a blunt retired nurse; short, flat sentences | 215 | 0/215 = 0% | 47/215 = 22% |

### Cost and waiting time

Five agent civilians plus one free human seat (the human's own calls excluded), model-vote games: 9.5 agent calls per round.

| device | whole round (agents) | first agent clue of a round | an agent clue turn (with retries) | vote phase (5 agent votes) |
|---|---|---|---|---|
| M5 Mac (measured) | 5 s | 0.6 s | 0.5 s | 2 s |
| Pixel 6a (6 GB) 22/5 tok/s, prefix cache | 86 s | 15.9 s | 10.8 s | 43 s |
| Pixel 6a (6 GB), no cache | 352 s | 43.0 s | 43.9 s | 177 s |
| Dimensity 8300 (12 GB) 26/7 tok/s, prefix cache | 69 s | 13.0 s | 8.7 s | 34 s |
| Dimensity 8300 (12 GB), no cache | 294 s | 36.0 s | 36.7 s | 148 s |

### Example games

#### Clean catch of the copycat (eagle): four of five civilians name "always silent"

```text
copycat impostor, seed 5, model votes. Civilians' word: "eagle". Human seat (Mr. White): Omar, seat 4

Round 1
  Marta: "Sharp beak, flies high, strong wings, sees"   {judge: fits vs honey}
  Theo: (passed)
  Lena: "A noble bird, soaring with grace, sharp vision" (trimmed)   {judge: fits vs yogurt}
  Priya: "A silent hunter, sharp eyes, swift flight"   {judge: fits vs blanket}
  Omar [HUMAN/MR. WHITE]: "always silent"   {judge: distractor vs sun}
  Joe: "Fish in the sky, strong and keen" (trimmed)   {judge: fits vs jam}
  vote Marta -> Omar: always silent doesn't fit my word
  vote Theo -> Lena: her clue is too vague, no clear bird traits
  vote Lena -> Omar: silent does not match noble bird or sharp vision
  vote Priya -> Omar: always silent contradicts my word
  vote Omar -> Marta: seemed like a guess
  vote Joe -> Omar: always silent doesn't fit any bird clue
  => Omar eliminated (impostor)

Caught in round 1.
```

#### Same seed, perfect impostor wrongly hunted: "A bird of prey with piercing eyes" called too vague

```text
perfect impostor, seed 5, model votes. Civilians' word: "eagle". Human seat (Mr. White): Omar, seat 4

Round 1
  Marta: "Sharp beak, flies high, strong wings, sees"   {judge: fits vs honey}
  Theo: (passed)
  Lena: "A noble bird, soaring with grace, sharp vision" (trimmed)   {judge: fits vs yogurt}
  Priya: "A silent hunter, sharp eyes, swift flight"   {judge: fits vs blanket}
  Omar [HUMAN/MR. WHITE]: "A bird of prey with piercing eyes" (trimmed)   {judge: fits vs sun}
  Joe: "Fierce, strong, watches from high cliffs, sharp eyes" (trimmed)   {judge: fits vs jam}
  vote Marta -> Omar: sees clearly, hunts, strong, high flight, sharp eyes, noble bird, fierce
  vote Theo -> Omar: weak clue, no unique traits, lacks precision
  vote Lena -> Omar: lacks grace, not noble, misses soaring elegance
  vote Priya -> Omar: too general, lacks specific traits like sharp beak or high flight
  vote Omar -> Marta: seemed like a guess
  vote Joe -> Omar: too vague, lacks key traits like sharp beak or high cliffs
  => Omar eliminated (impostor)

Caught in round 1.
```

#### Generic clues slip through (window): four civilians voted out, "something common" never questioned

```text
generic impostor, seed 1, model votes. Civilians' word: "window". Human seat (Mr. White): Theo, seat 0

Round 1
  Theo [HUMAN/MR. WHITE]: "people like it"   {judge: distractor vs bread}
  Joe: "sunny and clear in the morning"   {judge: fits vs raincoat}
  Lena: "A glass pane, tall and wide" (trimmed)   {judge: fits vs snow}
  Omar: "A tall, clear pane in a building" (trimmed)   {judge: fits vs axe}
  Priya: "transparent and rectangular structure"   {judge: fits vs scissors}
  Marta: "transparent, tall, sees through, glass, in a house"   {judge: fits vs bread}
  vote Theo -> Priya: not convinced
  vote Joe -> Lena: clue too vague, misses key shape and use
  vote Lena -> Marta: her clue is too broad and lacks specificity in form and function
  vote Omar -> Lena: too vague, misses key traits of my word
  vote Priya -> Marta: clue overlaps too much with others, lacks specificity
  vote Marta -> Lena: too vague, missing key traits of my word
  => Lena eliminated (civilian)

Round 2
  Joe: "A clear tall thing, flat, seen from outside" (trimmed)   {judge: fits vs tea}
  Omar: "A tall, clear, flat surface" (trimmed)   {judge: fits vs temple}
  Priya: "transparent and flat in a building's frame"   {judge: fits vs cake}
  Marta: "transparent, flat, in a house, lets light in" (trimmed)   {judge: fits vs axe}
  Theo [HUMAN/MR. WHITE]: "you see it often"   {judge: fits vs honey}
  vote Theo -> Omar: just a hunch
  vote Joe -> Omar: clue too vague, misses flatness and location key traits of my word
  vote Omar -> Marta: her clue is too broad, misses flatness and frame detail, doesn't match *
  vote Priya -> Marta: clue overlaps too much, lacks unique form detail of my word
  vote Marta -> Omar: clue too vague, misses flatness and use in building
  => Omar eliminated (civilian)

Round 3
  Priya: "transparent, flat, lets light pass, in a building" (trimmed)   {judge: fits vs guitar}
  Marta: "transparent, flat, lets light in, in a house" (trimmed)   {judge: fits vs palace}
  Theo [HUMAN/MR. WHITE]: "pretty useful"   {judge: distractor vs lamp}
  Joe: "A clear, flat thing in a building" (trimmed)   {judge: fits vs bicycle}
  vote Theo -> Marta: too vague for me
  vote Joe -> Marta: her clue is too broad, misses flatness and frame detail, doesn't match *
  vote Priya -> Marta: her clue overlaps too much, lacks unique form detail of my word
  vote Marta -> Theo: clue too vague, doesn't mention form or use in my word
  => Marta eliminated (civilian)

Round 4
  Priya: "transparent, flat, lets light pass" (trimmed)   {judge: fits vs nurse}
  Theo [HUMAN/MR. WHITE]: "something common"   {judge: fits vs blanket}
  Joe: "sunny morning, sees through, in a house" (trimmed)   {judge: fits vs candle}
  vote Theo -> Joe: just a hunch
  vote Joe -> Theo: clue too vague, doesn't mention form or use in my word
  vote Priya -> Joe: clue misses flatness and key structural detail of my word
  => Joe eliminated (civilian)

Survived (two-left).
```

# Run 2

Prompt v4. Per model: 4B (run2): 80 games; 1.5B (run2-1.5b): 80 games.
Each seed is played twice, once with model votes and once with clues from the model and **uniformly random votes**.
Seed *n* deals a different word pair in each mode (40 pairs over seeds 1–20). 6 players, all agents.
Clues are judged after the game by the 4B at temperature 0 (the judge never takes part in a game).
Generated by `npm run report`; the "Read" section is hand-written (`results/observations.md`). Run 1 is in `results/run1/`.

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

## Side by side

|  | run 1, 4B | run 2, 4B | run 2, 1.5B | random votes, 4B clues | random votes, 1.5B clues |
|---|---|---|---|---|---|
| **undercover** |  |  |  |  |  |
| games | 10 | 20 | 20 | 20 | 20 |
| civilians win | 6/10 = 60% | 9/20 = 45% | 11/20 = 55% | 7/20 = 35% | 7/20 = 35% |
| civilian votes on the impostor (all rounds) | 32/132 = 24% | 58/263 = 22% | 65/231 = 28% | 67/311 = 22% | 67/311 = 22% |
| … chance level for those votes | 25% | 25% | 25% | 23% | 23% |
| round-1 votes on the impostor | 7/50 = 14% | 26/100 = 26% | 32/100 = 32% | 19/100 = 19% | 19/100 = 19% |
| invalid clue attempts | 190/315 = 60% | 284/580 = 49% | 510/653 = 78% | 300/653 = 46% | 697/878 = 79% |
| clue turns passed | 40/165 = 24% | 33/329 = 10% | 145/288 = 50% | 30/383 = 8% | 202/383 = 53% |
| impostor clues judged as civilians' word (blend) | – | 11/58 = 19% | 14/31 = 45% |  |  |
| **mr-white** |  |  |  |  |  |
| games | 10 | 20 | 20 | 20 | 20 |
| civilians win | 5/10 = 50% | 9/20 = 45% | 4/20 = 20% | 8/20 = 40% | 6/20 = 30% |
| civilian votes on the impostor (all rounds) | 35/102 = 34% | 53/275 = 19% | 46/284 = 16% | 68/294 = 23% | 68/294 = 23% |
| … chance level for those votes | 25% | 25% | 25% | 22% | 22% |
| round-1 votes on the impostor | 18/50 = 36% | 12/100 = 12% | 11/100 = 11% | 16/100 = 16% | 16/100 = 16% |
| invalid clue attempts | 67/186 = 36% | 212/546 = 39% | 580/776 = 75% | 204/555 = 37% | 565/776 = 73% |
| clue turns passed | 8/127 = 6% | 9/343 = 3% | 160/356 = 45% | 9/360 = 3% | 149/360 = 41% |
| impostor clues judged as civilians' word (blend) | – | 63/66 = 95% | 34/40 = 85% |  |  |
| Mr. White guesses correct | 3/8 = 38% | 1/10 = 10% | 3/7 = 43% | 1/9 = 11% | 3/9 = 33% |

## 4B (run2)

### 4B (run2): undercover

| votes | games | civilians win | impostor out in round | end reasons |
|---|---|---|---|---|
| model | 20 | 45% | 1: 4, 3: 2, 4: 3 | impostor-eliminated: 9, max-rounds: 5, two-left: 6 |
| random | 20 | 35% | 1: 1, 2: 2, 3: 1, 4: 3 | impostor-eliminated: 7, max-rounds: 12, two-left: 1 |

Civilian votes that hit the impostor (count, Wilson 95% interval) vs. chance:

| round | model votes | chance | random-vote games | chance |
|---|---|---|---|---|
| 1 | 26/100 = 26% [18%–35%] | 20% | 19/100 = 19% [13%–28%] | 20% |
| 2 | 9/69 = 13% [7%–23%] | 23% | 21/86 = 24% [17%–34%] | 22% |
| 3 | 10/57 = 18% [10%–29%] | 28% | 12/68 = 18% [10%–28%] | 25% |
| 4 | 13/37 = 35% [22%–51%] | 38% | 15/57 = 26% [17%–39%] | 28% |
| all | 58/263 = 22% [17%–27%] | 25% | 67/311 = 22% [17%–26%] | 23% |

Clues (all 40 games): 712 turns, 1233 attempts, 584/1233 = 47% invalid (it contains your secret word or a form of it: 3, it repeats an earlier clue: 243, more than 8 words: 336, not a clue: 2); 390 turns needed a retry, 63 passed after 3 rejections.

Vote reasons (model votes): 329 votes, 47 needed a retry (reason longer than 12 words: 82, the reason contains your secret word or a form of it: 15); 16 kept their target without a reason, 0 random fallbacks.

| persona | style | clue turns | passed | rejected attempts per turn |
|---|---|---|---|---|
| Joe | a laid-back fisherman; folksy and slow | 123 | 18/123 = 15% | 0.9 |
| Lena | a theatrical opera singer; flowery and grand | 123 | 15/123 = 12% | 1.0 |
| Priya | a precise chemistry teacher; careful, logical wording | 137 | 11/137 = 8% | 0.8 |
| Omar | a suspicious taxi driver; dry, sarcastic remarks | 114 | 8/114 = 7% | 0.8 |
| Marta | a blunt retired nurse; short, flat sentences | 108 | 7/108 = 6% | 0.7 |
| Theo | an over-excited teenage gamer; slangy and dramatic | 107 | 4/107 = 4% | 0.7 |

Bluff judge (Qwen3-4B-Instruct-2507-Q4_K_M.gguf, temperature 0, 296 clues): share of clues read as the civilians' word rather than the undercover's word.

| clues by | round 1 | rounds 2+ | all |
|---|---|---|---|
| impostor | 5/17 = 29% [13%–53%] | 6/41 = 15% [7%–28%] | 11/58 = 19% [11%–31%] |
| civilian | 72/89 = 81% [72%–88%] | 118/149 = 79% [72%–85%] | 190/238 = 80% [74%–84%] |

Private ODD/FIT step (model-vote games): true-ODD = the undercover answered ODD; false-ODD = a civilian answered ODD.

| round | true-ODD (undercover) | … and named the civilians' word | false-ODD (civilians) |
|---|---|---|---|
| 2 | 5/16 = 31% | 2 | 18/69 = 26% |
| 3 | 5/16 = 31% | 1 | 7/57 = 12% |
| 4 | 2/14 = 14% | 1 | 5/37 = 14% |

### 4B (run2): mr-white

| votes | games | civilians win | impostor out in round | end reasons |
|---|---|---|---|---|
| model | 20 | 45% | 1: 2, 2: 2, 3: 2, 4: 4 | impostor-eliminated: 9, max-rounds: 7, mr-white-guessed: 1, two-left: 3 |
| random | 20 | 40% | 1: 3, 2: 1, 3: 3, 4: 2 | impostor-eliminated: 8, max-rounds: 11, mr-white-guessed: 1 |

Civilian votes that hit the impostor (count, Wilson 95% interval) vs. chance:

| round | model votes | chance | random-vote games | chance |
|---|---|---|---|---|
| 1 | 12/100 = 12% [7%–20%] | 20% | 16/100 = 16% [10%–24%] | 20% |
| 2 | 14/76 = 18% [11%–29%] | 24% | 17/79 = 22% [14%–32%] | 22% |
| 3 | 15/57 = 26% [17%–39%] | 28% | 17/65 = 26% [17%–38%] | 25% |
| 4 | 12/42 = 29% [17%–44%] | 33% | 18/50 = 36% [24%–50%] | 26% |
| all | 53/275 = 19% [15%–24%] | 25% | 68/294 = 23% [19%–28%] | 22% |

Clues (all 40 games): 703 turns, 1101 attempts, 416/1101 = 38% invalid (it contains your secret word or a form of it: 5, it repeats an earlier clue: 309, more than 8 words: 92, not a clue: 10); 325 turns needed a retry, 18 passed after 3 rejections.

Vote reasons (model votes): 343 votes, 37 needed a retry (reason longer than 12 words: 72, the reason contains your secret word or a form of it: 4); 13 kept their target without a reason, 0 random fallbacks.

| persona | style | clue turns | passed | rejected attempts per turn |
|---|---|---|---|---|
| Lena | a theatrical opera singer; flowery and grand | 124 | 5/124 = 4% | 0.5 |
| Priya | a precise chemistry teacher; careful, logical wording | 127 | 4/127 = 3% | 0.6 |
| Omar | a suspicious taxi driver; dry, sarcastic remarks | 105 | 3/105 = 3% | 0.6 |
| Marta | a blunt retired nurse; short, flat sentences | 108 | 2/108 = 2% | 0.6 |
| Theo | an over-excited teenage gamer; slangy and dramatic | 114 | 2/114 = 2% | 0.7 |
| Joe | a laid-back fisherman; folksy and slow | 125 | 2/125 = 2% | 0.6 |

Bluff judge (Qwen3-4B-Instruct-2507-Q4_K_M.gguf, temperature 0, 334 clues): share of clues read as the civilians' word rather than "none of these".

| clues by | round 1 | rounds 2+ | all |
|---|---|---|---|
| impostor | 18/19 = 95% [75%–99%] | 45/47 = 96% [86%–99%] | 63/66 = 95% [87%–98%] |
| civilian | 95/96 = 99% [94%–100%] | 170/172 = 99% [96%–100%] | 265/268 = 99% [97%–100%] |

| votes | voted out | correct | word absent from public log | guess → word |
|---|---|---|---|---|
| model | 10 | 1/10 | 10/10 | violet → window; jelly → jam; (none) → guitar; pen → pencil; silk → tea; (none) → rose; knife → knife; cider → beer; silk → cat; (none) → nurse |
| random | 9 | 1/9 | 9/9 | caramel → jam; fiddle → guitar; eagle → eagle; golden → tea; honeycomb → bee; caramel → bread; cider → beer; silk → cat; saw → hammer |

### 4B (run2): cost (model-vote games; judge calls excluded)

Tokens per game: 41401 prompt, 5986 evaluated (86% reused from the KV cache), 650 generated; 54.3 calls per game.

| mode | call | calls | prompt tokens | evaluated | generated | ms on M5 |
|---|---|---|---|---|---|---|
| undercover | clue | 580 | 733 | 70 | 12.3 | 364 |
| undercover | assess | 209 | 863 | 155 | 3.2 | 251 |
| undercover | vote | 410 | 834 | 130 | 17.0 | 542 |
| mr-white | clue | 546 | 702 | 102 | 8.0 | 287 |
| mr-white | vote | 406 | 796 | 138 | 16.6 | 528 |
| mr-white | guess | 19 | 148 | 82 | 6.1 | 231 |

Per round, all six seats on one device in sequence (mode A includes the private ODD/FIT calls):

| mode | calls per round | Mac s per round | Mac s per game | Pixel 6a (6 GB) 22/5 tok/s, cached | no cache | Dimensity 8300 (12 GB) 26/7 tok/s, cached | no cache |
|---|---|---|---|---|---|---|---|
| undercover | 18.2 | 7.4 | 24.4 | 132 s | 697 s | 106 s | 584 s |
| mr-white | 14.3 | 5.5 | 18.8 | 109 s | 507 s | 88 s | 425 s |

## 1.5B (run2-1.5b)

### 1.5B (run2-1.5b): undercover

| votes | games | civilians win | impostor out in round | end reasons |
|---|---|---|---|---|
| model | 20 | 55% | 1: 6, 2: 2, 3: 1, 4: 2 | impostor-eliminated: 11, max-rounds: 4, two-left: 5 |
| random | 20 | 35% | 1: 1, 2: 2, 3: 1, 4: 3 | impostor-eliminated: 7, max-rounds: 12, two-left: 1 |

Civilian votes that hit the impostor (count, Wilson 95% interval) vs. chance:

| round | model votes | chance | random-vote games | chance |
|---|---|---|---|---|
| 1 | 32/100 = 32% [24%–42%] | 20% | 19/100 = 19% [13%–28%] | 20% |
| 2 | 12/60 = 20% [12%–32%] | 23% | 21/86 = 24% [17%–34%] | 22% |
| 3 | 11/42 = 26% [15%–41%] | 29% | 12/68 = 18% [10%–28%] | 25% |
| 4 | 10/29 = 34% [20%–53%] | 38% | 15/57 = 26% [17%–39%] | 28% |
| all | 65/231 = 28% [23%–34%] | 25% | 67/311 = 22% [17%–26%] | 23% |

Clues (all 40 games): 671 turns, 1531 attempts, 1207/1531 = 79% invalid (it contains your secret word or a form of it: 156, it repeats an earlier clue: 364, more than 8 words: 687); 488 turns needed a retry, 347 passed after 3 rejections.

Vote reasons (model votes): 288 votes, 65 needed a retry (reason longer than 12 words: 141, the reason contains your secret word or a form of it: 48); 62 kept their target without a reason, 0 random fallbacks.

| persona | style | clue turns | passed | rejected attempts per turn |
|---|---|---|---|---|
| Priya | a precise chemistry teacher; careful, logical wording | 128 | 75/128 = 59% | 1.9 |
| Theo | an over-excited teenage gamer; slangy and dramatic | 113 | 65/113 = 58% | 1.9 |
| Joe | a laid-back fisherman; folksy and slow | 116 | 61/116 = 53% | 1.8 |
| Omar | a suspicious taxi driver; dry, sarcastic remarks | 98 | 47/98 = 48% | 1.7 |
| Lena | a theatrical opera singer; flowery and grand | 108 | 50/108 = 46% | 1.7 |
| Marta | a blunt retired nurse; short, flat sentences | 108 | 49/108 = 45% | 1.6 |

Bluff judge (Qwen3-4B-Instruct-2507-Q4_K_M.gguf, temperature 0, 143 clues): share of clues read as the civilians' word rather than the undercover's word.

| clues by | round 1 | rounds 2+ | all |
|---|---|---|---|
| impostor | 4/9 = 44% [19%–73%] | 10/22 = 45% [27%–65%] | 14/31 = 45% [29%–62%] |
| civilian | 34/45 = 76% [61%–86%] | 46/67 = 69% [57%–78%] | 80/112 = 71% [62%–79%] |

Private ODD/FIT step (model-vote games): true-ODD = the undercover answered ODD; false-ODD = a civilian answered ODD.

| round | true-ODD (undercover) | … and named the civilians' word | false-ODD (civilians) |
|---|---|---|---|
| 2 | 0/14 = 0% | 0 | 0/60 = 0% |
| 3 | 0/12 = 0% | 0 | 0/42 = 0% |
| 4 | 0/11 = 0% | 0 | 0/29 = 0% |

### 1.5B (run2-1.5b): mr-white

| votes | games | civilians win | impostor out in round | end reasons |
|---|---|---|---|---|
| model | 20 | 20% | 1: 1, 2: 1, 3: 3, 4: 2 | impostor-eliminated: 4, max-rounds: 10, mr-white-guessed: 3, two-left: 3 |
| random | 20 | 30% | 1: 3, 2: 1, 3: 3, 4: 2 | impostor-eliminated: 6, max-rounds: 11, mr-white-guessed: 3 |

Civilian votes that hit the impostor (count, Wilson 95% interval) vs. chance:

| round | model votes | chance | random-vote games | chance |
|---|---|---|---|---|
| 1 | 11/100 = 11% [6%–19%] | 20% | 16/100 = 16% [10%–24%] | 20% |
| 2 | 13/80 = 16% [10%–26%] | 24% | 17/79 = 22% [14%–32%] | 22% |
| 3 | 13/61 = 21% [13%–33%] | 30% | 17/65 = 26% [17%–38%] | 25% |
| 4 | 9/43 = 21% [11%–35%] | 35% | 18/50 = 36% [24%–50%] | 26% |
| all | 46/284 = 16% [12%–21%] | 25% | 68/294 = 23% [19%–28%] | 22% |

Clues (all 40 games): 716 turns, 1552 attempts, 1145/1552 = 74% invalid (it contains your secret word or a form of it: 88, it repeats an earlier clue: 481, more than 8 words: 576); 486 turns needed a retry, 309 passed after 3 rejections.

Vote reasons (model votes): 356 votes, 46 needed a retry (reason longer than 12 words: 111, the reason contains your secret word or a form of it: 27); 46 kept their target without a reason, 0 random fallbacks.

| persona | style | clue turns | passed | rejected attempts per turn |
|---|---|---|---|---|
| Priya | a precise chemistry teacher; careful, logical wording | 131 | 64/131 = 49% | 1.8 |
| Theo | an over-excited teenage gamer; slangy and dramatic | 128 | 60/128 = 47% | 1.6 |
| Joe | a laid-back fisherman; folksy and slow | 127 | 57/127 = 45% | 1.6 |
| Lena | a theatrical opera singer; flowery and grand | 123 | 53/123 = 43% | 1.6 |
| Omar | a suspicious taxi driver; dry, sarcastic remarks | 104 | 38/104 = 37% | 1.4 |
| Marta | a blunt retired nurse; short, flat sentences | 103 | 37/103 = 36% | 1.5 |

Bluff judge (Qwen3-4B-Instruct-2507-Q4_K_M.gguf, temperature 0, 196 clues): share of clues read as the civilians' word rather than "none of these".

| clues by | round 1 | rounds 2+ | all |
|---|---|---|---|
| impostor | 12/14 = 86% [60%–96%] | 22/26 = 85% [66%–94%] | 34/40 = 85% [71%–93%] |
| civilian | 51/53 = 96% [87%–99%] | 96/103 = 93% [87%–97%] | 147/156 = 94% [89%–97%] |

| votes | voted out | correct | word absent from public log | guess → word |
|---|---|---|---|---|
| model | 7 | 3/7 | 7/7 | glass → window; eagle → eagle; rose → rose; apple → bread; beer → beer; coins → moon; tool → hammer |
| random | 9 | 3/9 | 9/9 | fish → jam; violin → guitar; eagle → eagle; grapevine → tea; bee → bee; bread → bread; cocktail → beer; fish → cat; fisherman → hammer |

### 1.5B (run2-1.5b): cost (model-vote games; judge calls excluded)

Tokens per game: 40923 prompt, 5789 evaluated (86% reused from the KV cache), 802 generated; 61.7 calls per game.

| mode | call | calls | prompt tokens | evaluated | generated | ms on M5 |
|---|---|---|---|---|---|---|
| undercover | clue | 653 | 633 | 60 | 13.1 | 155 |
| undercover | assess | 168 | 726 | 140 | 2.0 | 75 |
| undercover | vote | 415 | 692 | 115 | 16.3 | 210 |
| mr-white | clue | 776 | 647 | 81 | 12.9 | 159 |
| mr-white | vote | 448 | 695 | 128 | 14.2 | 195 |
| mr-white | guess | 7 | 100 | 95 | 2.1 | 53 |

Per round, all six seats on one device in sequence (mode A includes the private ODD/FIT calls):

| mode | calls per round | Mac s per round | Mac s per game | Pixel 6a (6 GB) 45/14 tok/s, cached | no cache |
|---|---|---|---|---|---|
| undercover | 21.7 | 3.5 | 10.1 | 63 s | 340 s |
| mr-white | 17.1 | 2.9 | 10.6 | 54 s | 268 s |

## Example games (hidden roles and private checks shown)

### Bluff that worked: Mr. White copies the table and is never suspected (4B)

```text
mr-white-15, 4B (run2), model votes. civilians: "pear", Mr. White: Priya
Seats: Priya (a precise chemistry teacher; careful, logical wording); Lena (a theatrical opera singer; flowery and grand); Theo (an over-excited teenage gamer; slangy and dramatic); Marta (a blunt retired nurse; short, flat sentences); Joe (a laid-back fisherman; folksy and slow); Omar (a suspicious taxi driver; dry, sarcastic remarks)

Round 1
  Priya [MR. WHITE]: "sour and sticky"   {judge: civilians' word}
  Lena: "soft and juicy, grows on trees"   [rejected: "sweet and juicy, soft and round, like a fruit from the tree"]
  Theo: "sour and juicy, tree fruit, soft and round"   [rejected: "sour and juicy, grows on trees, soft and round, sweet when ripe"]
  Marta: "sour and round grows on trees"   [rejected: "sour and round, grows on trees, soft when ripe"]
  Joe: "tasty and smooth grows on trees"   [rejected: "tasty and smooth, grows on trees, soft when ripe"]
  Omar: "sour and smooth grows on trees"   [rejected: "sour and smooth, grows on trees, soft and round"]
  vote Priya -> Omar: his clue repeats "sour and smooth" too much, unlike others' unique phras
  vote Lena -> Marta: clue too vague, doesn't match my word clearly
  vote Theo -> Marta: clue too vague, doesn't match my word clearly
  vote Marta -> Omar: clue says "smooth" but my word is sour and round, not smooth
  vote Joe -> Marta: clue overlaps too much with others, lacks distinctness
  vote Omar -> Marta: clue repeats sour and round, misses smooth and tree growth
  => Marta eliminated (civilian)

Round 2
  Lena: "silk and crisp, grows on trees, juicy inside"   [rejected: "sour and round grows on trees"]
  Theo: "sour and crisp grows on trees"   [rejected: "sour and crisp, grows on trees, juicy inside, soft and round,"]
  Joe: "silk and smooth, juicy inside, tree fruit"   [rejected: "sour and crisp grows on trees"]
  Omar: "sour and crisp, tree fruit, soft and round"   [rejected: "sour and crisp grows on trees, juicy inside, soft and round"; "sour and crisp grows on trees"]
  Priya [MR. WHITE]: "silk and juicy, tree fruit, soft and smooth"   {judge: civilians' word}   [rejected: "sour and crisp grows on trees"]
  vote Priya -> Omar: clue too vague, repeats sour and crisp without distinction
  vote Lena -> Joe (no reason)
  vote Theo -> Omar (no reason)
  vote Joe -> Omar (no reason)
  vote Omar -> Joe (no reason)
  => Omar eliminated (civilian)

Round 3
  Theo: "sour and crisp tree fruit"   [rejected: "sour and crisp grows on trees"; "sour and round, juicy inside, tree fruit, soft flesh"]
  Joe: "silk and juicy inside tree fruit"   [rejected: "sour and crisp tree fruit"]
  Priya [MR. WHITE]: "silk and juicy, soft and round, tree fruit"   {judge: civilians' word}   [rejected: "sour and crisp tree fruit"]
  Lena: "silk and crisp, juicy core, tree born"
  vote Priya -> Joe: clue mixes silk and juicy, too vague compared to others' precision
  vote Lena -> Joe (no reason)
  vote Theo -> Joe (no reason)
  vote Joe -> Theo: clue too vague, misses silk and juicy, not specific to my word
  => Joe eliminated (civilian)

Round 4
  Priya [MR. WHITE]: "silk and juicy, soft and round, tree born"   {judge: civilians' word}   [rejected: "sour and crisp tree fruit"]
  Lena: "silk and bright, cool and smooth, tree grown"   [rejected: "silk and crisp, juicy core, tree born"]
  Theo: "silk and crisp, juicy inside, tree born"   [rejected: "sour and crisp tree fruit"]
  vote Priya -> Theo: clue too vague, lacks silk and crisp distinction
  vote Lena -> Theo: clue lacks silk and bright, misses my word's core traits
  vote Theo -> Lena (no reason)
  => Theo eliminated (civilian)

Winner: impostor (two-left)
```

### Deduction catch: one clue stands out, five civilian votes (4B)

```text
undercover-13, 4B (run2), model votes. civilians: "dog", undercover Lena: "wolf"
Seats: Joe (a laid-back fisherman; folksy and slow); Theo (an over-excited teenage gamer; slangy and dramatic); Omar (a suspicious taxi driver; dry, sarcastic remarks); Marta (a blunt retired nurse; short, flat sentences); Priya (a precise chemistry teacher; careful, logical wording); Lena (a theatrical opera singer; flowery and grand)

Round 1
  Joe: "barks loudly and follows you around"
  Theo: "barks loud, follows, never still, full of energy"   [rejected: "barks nonstop, always around, loyal, playful, runs fast, follows"; "barks loud, follows close, never still, full of energy"]
  Omar: "barks, runs, never still, full of energy"   [rejected: "barks nonstop, always on the move, loyal companion, never sleeps,"; "barks, runs, never still, full of energy, loyal, always around"]
  Marta: "leaps, barks, loyal, stays close, playful, energetic"
  Priya: "fierce, loyal, protective, watches, alert, stays near"   [rejected: "leaps, barks, loyal, stays close, playful, energetic"]
  Lena [UNDERCOVER]: "fierce and free, howls at moonlight"   {judge: not the civilians' word}   [rejected: "magnificent howl echoes through the night, fierce and free"]
  vote Joe -> Lena: howls at moonlight doesn't match my word, too specific, not common
  vote Theo -> Lena: howls at moonlight doesn't match my word, too specific, not energetic
  vote Omar -> Lena: howls at moonlight doesn't match my word
  vote Marta -> Lena: howls at moonlight doesn't match my word
  vote Priya -> Lena: howls at moonlight is too specific, not my word
  vote Lena -> Marta: too many playful traits, not my word
  => Lena eliminated (impostor)

Winner: civilians (impostor-eliminated)
```

### Failure: the undercover privately names the civilians' word, then keeps giving its own clues (4B)

```text
undercover-4, 4B (run2), model votes. civilians: "hat", undercover Theo: "helmet"
Seats: Omar (a suspicious taxi driver; dry, sarcastic remarks); Marta (a blunt retired nurse; short, flat sentences); Lena (a theatrical opera singer; flowery and grand); Priya (a precise chemistry teacher; careful, logical wording); Theo (an over-excited teenage gamer; slangy and dramatic); Joe (a laid-back fisherman; folksy and slow)

Round 1
  Omar: (passed)   [rejected: "The wind blows through the streets, and I see a shadow on the side of"; "The wind howls, and I see a shadow on the side of a building"; "The wind howls, shadow on a roof, cold and sharp"]
  Marta: "wears on head, keeps things dry, covers face"   [rejected: "wears on head, keeps things dry, covers face, protects from wind,"]
  Lena: "fashionable, elegant, worn during shows"   [rejected: "wears on head, keeps things dry, covers face"; "magnificent and grand, worn during performances, hides the face"]
  Priya: "wears on head, shields from sun, keeps dry"   [rejected: "wears on head, keeps things dry, covers face, protects from sun,"; "wears on head, shields from sun, keeps dry, covers face"]
  Theo [UNDERCOVER]: "cops wear, tough, protects head, metal, strong"   {judge: not the civilians' word}   [rejected: "cops wear, protects head, metal, tough, shields from blows, strong"]
  Joe: (passed)   [rejected: "fisherman's cap, keeps wind off, worn on head, sunny days"; "windy days, worn on head, keeps sun off, simple design"; "worn on head, keeps sun off, simple, sturdy cap"]
  vote Omar -> Theo: his clue has metal and tough, not my word
  vote Marta -> Theo: metal and tough doesn't fit my word
  vote Lena -> Marta: her clue fits my word best, others don't match clearly
  vote Priya -> Marta: her clue matches my word best, others differ slightly
  vote Theo -> Marta: her clue fits my word the worst, no headwear connection
  vote Joe -> Theo: his clue is too metal and tough for my word
  => tie, nobody eliminated

Round 2
  (private) Marta checks: FIT
  (private) Lena checks: FIT
  (private) Priya checks: FIT
  (private) Theo [UNDERCOVER] checks: ODD hat
  (private) Joe checks: FIT
  (private) Omar checks: ODD cap
  Marta: (passed)   [rejected: "wears on head, keeps dry, covers face, protects from sun, common"; "wears on head, keeps dry, protects from sun, common item"; "wears on head, keeps dry, common, protects from sun"]
  Lena: "fashionable, grand, worn in performances, shines under lights"   [rejected: "fashionable, elegant, worn during shows"]
  Priya: "shields from sun, keeps dry, worn on head"
  Theo [UNDERCOVER]: "protects head, strong, made of metal, used in"   {judge: not the civilians' word}
  Joe: "wears on head, keeps dry, soft, sunny days"   [rejected: "wears on head, keeps dry, sunny days, soft material"]
  Omar: "soft and worn, keeps dry, sunny days"
  vote Omar -> Joe: his clue is too soft, doesn't match others' dry, protective headwear
  vote Marta -> Theo: his clue has metal, not my word
  vote Lena -> Theo: his clue is too metal and tough, not my word
  vote Priya -> Joe: his clue has soft, not my word's structure or material
  vote Theo -> Joe: his clue is too soft, not strong or protective like my word
  vote Joe -> Theo: his clue is too metal and tough for my word
  => tie, nobody eliminated

Round 3
  (private) Lena checks: FIT
  (private) Priya checks: FIT
  (private) Theo [UNDERCOVER] checks: ODD hat
  (private) Joe checks: FIT
  (private) Omar checks: ODD cap
  (private) Marta checks: FIT
  Lena: "shines under lights, elegant, worn in grand shows"   [rejected: "shines under lights, elegant, worn in grand performances, makes a statement"]
  Priya: "shines in daylight, covers face, protects from heat"   [rejected: "shields from sun, keeps dry, worn on head"]
  Theo [UNDERCOVER]: (passed)   [rejected: "shines under lights, protects head, strong, metal, used in races"; "shines under lights, protects head, strong, metal, used in races ("; "shines under lights, strong, metal, protects head, used in races ("]
  Joe: "sunny days, soft cover, keeps head dry"
  Omar: "sunny days, soft, covers head, keeps dry"   [rejected: "sunny days, soft cover, keeps head dry"; "sunny days, light, soft, covers head, keeps dry, worn in"]
  Marta: "wears on head, keeps dry, covers face"
  vote Omar -> Joe: his clue is too soft, not protective or dry like my word
  vote Marta -> Joe: his soft clue doesn't match my word's dry, protective structure
  vote Lena -> Marta: her clue fits my word best, others differ slightly
  vote Priya -> Joe: his clue is too soft, not protective or dry like my word
  vote Theo -> Joe: his clue is too soft, not strong or protective like my word
  vote Joe -> Theo: his clue is too metal and tough, not my word
  => Joe eliminated (civilian)

Round 4
  (private) Priya checks: FIT
  (private) Theo [UNDERCOVER] checks: FIT
  (private) Omar checks: FIT
  (private) Marta checks: FIT
  (private) Lena checks: FIT
  Priya: "shields sun, keeps dry, worn on head"   [rejected: "shields from sun, keeps head dry, worn on top"]
  Theo [UNDERCOVER]: "racing, strong, guards head, metal, tough"   {judge: not the civilians' word}   [rejected: "brute force, protects head, tough metal, used in racing"]
  Omar: (passed)   [rejected: "sunny days, soft cover, keeps head dry"; "sunny, soft, covers head, keeps dry, worn in summer"; "sunny, soft, covers head, keeps dry, worn in summer (adjusted"]
  Marta: "wears on head, keeps dry, protects from rain"   [rejected: "wears on head, keeps dry, covers face"]
  Lena: "shines under lights, elegant, worn in grand performances"
  vote Omar -> Theo: his metal and tough clue doesn't match my word's dry, soft headwear
  vote Marta -> Theo: his metal and tough clue doesn't fit my word
  vote Lena -> Theo: his clue is too metal and tough, not my word
  vote Priya -> Theo (no reason)
  vote Theo -> Marta: her clue fits my word worst, no metal or strength mentioned
  => Theo eliminated (impostor)

Winner: civilians (impostor-eliminated)
```
