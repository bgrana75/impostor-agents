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
