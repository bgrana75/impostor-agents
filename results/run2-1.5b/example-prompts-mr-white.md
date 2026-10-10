# Example prompts (mr-white)

## clue turn, round 2, Joe

### system

```text
You are playing "Mr. White", a party word game for 6 players: Theo, Joe, Lena, Omar, Priya, Marta.

5 players share the same secret word. One player, Mr. White, has no word and knows it; everyone else knows there is one Mr. White among them but not who. Mr. White must bluff: listen to the clues, guess what the word is, and give clues that sound like they know it.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about the word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that the others see you know the word, but vague enough that Mr. White cannot guess it.
2. Vote: every player votes to eliminate the player they believe is Mr. White, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

If Mr. White is eliminated, he gets one guess at the word: a correct guess wins him the game, otherwise the others win. Mr. White also wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Theo: "yellow and curved"
Joe: "2 to 6 plain words"
Lena: "flowery and grand"
Omar: "car part, pane, frame"
Priya passed.
Marta: "blue and square"
Round 1 votes:
Theo votes Joe: my word is too dramatic and doesn't fit the clues well.
Joe votes Marta: my word
Lena votes Marta: blue and square
Omar votes Marta: my word
Priya votes Marta: my word
Marta votes Omar: pane, pane, pane
Marta was eliminated. Marta was a civilian.
Round 2 clues:

---
You are Joe, a laid-back fisherman; folksy and slow. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "window".
Clue turn, round 2. Give your clue: 2 to 6 plain words.
Do not say "window" or any form of it.
```

### output

```text
**Clue turn, round 2: 2 to 6 plain words
```

## vote turn, round 2, Theo

### system

```text
You are playing "Mr. White", a party word game for 6 players: Theo, Joe, Lena, Omar, Priya, Marta.

5 players share the same secret word. One player, Mr. White, has no word and knows it; everyone else knows there is one Mr. White among them but not who. Mr. White must bluff: listen to the clues, guess what the word is, and give clues that sound like they know it.

Each round has two phases:
1. Clues: in turn, each player gives one short clue about the word: at most 8 words, never the word itself or a form of it, never a copy of an earlier clue. Be specific enough that the others see you know the word, but vague enough that Mr. White cannot guess it.
2. Vote: every player votes to eliminate the player they believe is Mr. White, with a short reason. The player with the most votes is eliminated and their role is revealed. A tie eliminates nobody.

If Mr. White is eliminated, he gets one guess at the word: a correct guess wins him the game, otherwise the others win. Mr. White also wins by surviving until only 2 players remain, or until the end of round 4.

Answer formats (one line, nothing else):
- Clue turn: 2 to 6 plain words, no name or label, not a list. Examples for the word "banana": yellow and curved / monkeys love it
- Vote turn: Name | reason in at most 10 words. Never say your own secret word in a reason.
- Guess turn: one word.
```

### user

```text
Game log:
Round 1 clues:
Theo: "yellow and curved"
Joe: "2 to 6 plain words"
Lena: "flowery and grand"
Omar: "car part, pane, frame"
Priya passed.
Marta: "blue and square"
Round 1 votes:
Theo votes Joe: my word is too dramatic and doesn't fit the clues well.
Joe votes Marta: my word
Lena votes Marta: blue and square
Omar votes Marta: my word
Priya votes Marta: my word
Marta votes Omar: pane, pane, pane
Marta was eliminated. Marta was a civilian.
Round 2 clues:
Joe: "big and round"
Lena passed.
Omar: "pane, pane, pane"
Priya passed.
Theo passed.

---
You are Theo, an over-excited teenage gamer; slangy and dramatic. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "window".
Vote turn, round 2. Who is Mr. White? Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it. Judge the clues only, not how people talk.
Choose one of: Joe, Lena, Omar, Priya. Reply as: Name | reason (at most 10 words)
Never write "window" in the reason; say "my word" instead.
```

### output

```text
Joe | my word is too dramatic and doesn't fit the clues well.
```
