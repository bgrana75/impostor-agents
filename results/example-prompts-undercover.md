# Example prompts (undercover)

## clue turn, round 2, Theo

### system

```text
You are playing "Undercover", a party word game for 6 players: Priya, Theo, Marta, Omar, Lena, Joe.

Every player has a secret word. 5 players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a one-sentence reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: the clue only, 2 to 6 words, no name or label. Example for the word "pen": ink on paper
- Vote turn: Name | one short sentence about that player's clues
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Priya: "sharpened teeth, swift movement, deep water predator"
Theo: "fierce bites, ocean rush, chases prey with speed"
Marta: "fierce teeth deep water hunter swift and strong"
Omar: "sharpened teeth, deep water, silent slayer"
Lena passed.
Joe: "tide line, deep water, waits in silence"
Round 1 votes:
Priya votes Omar: His clue "sharpened teeth, deep water, silent slayer" overlaps too much with Priya's clue, but "silent slayer" is vague and not specific enough
Theo votes Joe: His clues about tide line and waiting in silence don't match the active, predatory nature of a shark; too passive and coastal, not deep-water hunting.
Marta votes Omar: His clue is too similar to mine, but "silent slayer" is vague and doesn't match the specific deep-water predator focus of the others.
Omar votes Marta: Her clue is too repetitive and vague, blending "fierce teeth" and "deep water hunter" without distinct specificity that matches a shark's unique traits.
Lena votes Joe: His clue about the tide line and silence doesn't align with a deep water predator; too coastal, too still, unlike the swift, active nature of a dolphin.
Joe votes Lena: Her clues about tide line and silence don't match the deep water, sharp teeth, or predatory nature of a shark, making her stand out the most.
Tie: nobody was eliminated.
Round 2 clues:

---
You are Theo, an over-excited teenage gamer; slangy and dramatic. Speak in that style, briefly.
Your secret word: "shark".
Clue turn, round 2. Give your clue: 2 to 6 words. Do not say "shark" or any form of it.
```

### output

```text
dive deep, savage bite, hunt in shadows, underwater chaos, chases
```

## vote turn, round 2, Priya

### system

```text
You are playing "Undercover", a party word game for 6 players: Priya, Theo, Marta, Omar, Lena, Joe.

Every player has a secret word. 5 players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a one-sentence reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: the clue only, 2 to 6 words, no name or label. Example for the word "pen": ink on paper
- Vote turn: Name | one short sentence about that player's clues
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Priya: "sharpened teeth, swift movement, deep water predator"
Theo: "fierce bites, ocean rush, chases prey with speed"
Marta: "fierce teeth deep water hunter swift and strong"
Omar: "sharpened teeth, deep water, silent slayer"
Lena passed.
Joe: "tide line, deep water, waits in silence"
Round 1 votes:
Priya votes Omar: His clue "sharpened teeth, deep water, silent slayer" overlaps too much with Priya's clue, but "silent slayer" is vague and not specific enough
Theo votes Joe: His clues about tide line and waiting in silence don't match the active, predatory nature of a shark; too passive and coastal, not deep-water hunting.
Marta votes Omar: His clue is too similar to mine, but "silent slayer" is vague and doesn't match the specific deep-water predator focus of the others.
Omar votes Marta: Her clue is too repetitive and vague, blending "fierce teeth" and "deep water hunter" without distinct specificity that matches a shark's unique traits.
Lena votes Joe: His clue about the tide line and silence doesn't align with a deep water predator; too coastal, too still, unlike the swift, active nature of a dolphin.
Joe votes Lena: Her clues about tide line and silence don't match the deep water, sharp teeth, or predatory nature of a shark, making her stand out the most.
Tie: nobody was eliminated.
Round 2 clues:
Theo passed.
Marta: "fierce teeth, deep water, swift movement, hunts alone"
Omar: "breathe through nose, moves in dark, silent hunter"
Lena: "gilded waters, silver leaps, symphony of the deep"
Joe: "moldy fish, old nets, tide pools, quiet waters"
Priya: "sharpened teeth, deep water, active predator"

---
You are Priya, a precise chemistry teacher; careful, logical wording. Speak in that style, briefly.
Your secret word: "shark".
Vote turn, round 2. Who is the undercover? Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it. Judge the clues only, not how people talk. Choose one of: Theo, Marta, Omar, Lena, Joe. Reply as: Name | short reason
```

### output

```text
Joe | His clues about moldy fish, old nets, and tide pools suggest a coastal, decaying environment, not a deep-water predator with sharp teeth and swift movement; no
```
