# Example prompts (undercover)

## assess turn, round 2, Lena

### system

```text
You are playing "Undercover", a party word game for 6 players: Marta, Lena, Joe, Priya, Omar, Theo.

Every player has a secret word. 5 players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Marta: "sleek and swift in water"
Lena: "sleek and graceful in motion"
Joe: "cruel and silent in deep blue waters"
Priya: "magnetic and playful in waves"
Omar: "sleek and quick in the waves"
Theo: "ninja of the waves, swift and smart"
Round 1 votes:
Marta votes Joe: silent in deep blue waters doesn't match my word
Lena votes Omar: his clue is too generic, not specific to my word
Joe votes Omar: his clue is too vague and doesn't match my word
Priya votes Theo: too ninja-like, not matching my word
Omar votes Theo: too ninja-like, not matching my word
Theo votes Joe: silent in deep blue waters doesn't match my word
Tie: nobody was eliminated.
Round 2 clues:

---
You are Lena, a theatrical opera singer; flowery and grand. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "dolphin".
Private check, round 2 (nobody else sees this). Do the other players' clues fit your word "dolphin", or a related but different word? Answer FIT if they fit "dolphin". Otherwise answer ODD followed by the word their clues describe instead (example: ODD marker).
```

### output

```text
ODD whale
```

## clue turn, round 2, Lena

### system

```text
You are playing "Undercover", a party word game for 6 players: Marta, Lena, Joe, Priya, Omar, Theo.

Every player has a secret word. 5 players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Marta: "sleek and swift in water"
Lena: "sleek and graceful in motion"
Joe: "cruel and silent in deep blue waters"
Priya: "magnetic and playful in waves"
Omar: "sleek and quick in the waves"
Theo: "ninja of the waves, swift and smart"
Round 1 votes:
Marta votes Joe: silent in deep blue waters doesn't match my word
Lena votes Omar: his clue is too generic, not specific to my word
Joe votes Omar: his clue is too vague and doesn't match my word
Priya votes Theo: too ninja-like, not matching my word
Omar votes Theo: too ninja-like, not matching my word
Theo votes Joe: silent in deep blue waters doesn't match my word
Tie: nobody was eliminated.
Round 2 clues:

---
You are Lena, a theatrical opera singer; flowery and grand. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "dolphin".
Clue turn, round 2. Give your clue: 2 to 6 plain words.
Do not say "dolphin" or any form of it.
You may be the odd one out. Give a clue that fits the others' word (probably "whale") instead.
```

### output

```text
magnetic and playful in waves
```

## vote turn, round 2, Marta

### system

```text
You are playing "Undercover", a party word game for 6 players: Marta, Lena, Joe, Priya, Omar, Theo.

Every player has a secret word. 5 players share the same word. One player, the undercover, has a different but related word (like "pen" vs "marker"). Nobody is told whether they are the undercover; you must work it out from the clues. If the other clues do not quite fit your word, you are probably the undercover: then give clues that fit what the others seem to describe, so you blend in, and vote for someone else.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about their word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that players with your word recognize it, but vague enough not to give the word away.
2. Vote: every player votes to eliminate the player they believe is the undercover, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

The others win if the undercover is eliminated. The undercover wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Marta: "sleek and swift in water"
Lena: "sleek and graceful in motion"
Joe: "cruel and silent in deep blue waters"
Priya: "magnetic and playful in waves"
Omar: "sleek and quick in the waves"
Theo: "ninja of the waves, swift and smart"
Round 1 votes:
Marta votes Joe: silent in deep blue waters doesn't match my word
Lena votes Omar: his clue is too generic, not specific to my word
Joe votes Omar: his clue is too vague and doesn't match my word
Priya votes Theo: too ninja-like, not matching my word
Omar votes Theo: too ninja-like, not matching my word
Theo votes Joe: silent in deep blue waters doesn't match my word
Tie: nobody was eliminated.
Round 2 clues:
Lena passed.
Joe: "cruel and still in dark water"
Priya: "sleek and playful in the waves"
Omar: "sleek and playful in waves"
Theo passed.
Marta: "sleek and playful in water"

---
You are Marta, a blunt retired nurse; short, flat sentences. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "dolphin".
Vote turn, round 2. Who is the undercover? Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it. Judge the clues only, not how people talk.
Choose one of: Lena, Joe, Priya, Omar, Theo. Reply as: Name | reason (at most 10 words)
Never write "dolphin" in the reason; say "my word" instead.
```

### output

```text
Omar | his clue is too vague, not specific to my word
```
