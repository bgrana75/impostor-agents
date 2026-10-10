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
