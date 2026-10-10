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
Theo: "violet and glassy"
Joe: "sunny and open"
Lena: "sunny and glassy"
Omar: "sunny and clear"
Priya: "sunny and transparent"
Marta: "A glassy pane with light through it"
Round 1 votes:
Theo votes Omar: his clue is too vague and doesn't match my word clearly
Joe votes Omar: his clue is too vague and doesn't match my word well
Lena votes Marta: her clue is too specific and poetic, unlike others' simple descriptions
Omar votes Marta: clue is too poetic, doesn't match my word
Priya votes Omar: clue is too vague and lacks key word "sunny" in context
Marta votes Omar: clue too vague, doesn't match my word clearly
Omar was eliminated. Omar was a civilian.
Round 2 clues:

---
You are Joe, a laid-back fisherman; folksy and slow. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "window".
Clue turn, round 2. Give your clue: 2 to 6 plain words.
Do not say "window" or any form of it.
```

### output

```text
sunny and see through
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
Theo: "violet and glassy"
Joe: "sunny and open"
Lena: "sunny and glassy"
Omar: "sunny and clear"
Priya: "sunny and transparent"
Marta: "A glassy pane with light through it"
Round 1 votes:
Theo votes Omar: his clue is too vague and doesn't match my word clearly
Joe votes Omar: his clue is too vague and doesn't match my word well
Lena votes Marta: her clue is too specific and poetic, unlike others' simple descriptions
Omar votes Marta: clue is too poetic, doesn't match my word
Priya votes Omar: clue is too vague and lacks key word "sunny" in context
Marta votes Omar: clue too vague, doesn't match my word clearly
Omar was eliminated. Omar was a civilian.
Round 2 clues:
Joe: "sunny and see through"
Lena: "sunny and thin like a blade"
Priya: "sunny and solid with glass"
Marta: "sunny and hard to break"
Theo: "sunny and strong like glass"

---
You are Theo, an over-excited teenage gamer; slangy and dramatic. Stay in character, but a clue is 2 to 6 plain words and a vote reason at most 10 words.
Your secret word: "window".
Vote turn, round 2. Who is Mr. White? Vote for the player whose clues fit your word the worst. Clues that fit your word well mean that player shares it. Judge the clues only, not how people talk.
Choose one of: Joe, Lena, Priya, Marta. Reply as: Name | reason (at most 10 words)
Never write "window" in the reason; say "my word" instead.
```

### output

```text
Marta | her clue is too vague and doesn't match my word clearly
```
