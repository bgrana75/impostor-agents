import type { WordPair } from "../core/types.js";

// Related concrete nouns: close enough that clues overlap, different enough to drift.
const raw = `
beach/pool, cat/tiger, coffee/tea, guitar/violin, train/bus, apple/pear,
piano/organ, wolf/dog, butter/cheese, moon/sun, river/lake, knife/scissors,
pillow/blanket, castle/palace, sock/glove, honey/jam, bicycle/motorcycle, rain/snow,
church/temple, pencil/crayon, lion/leopard, boat/raft, candle/lamp, mountain/hill,
doctor/nurse, wine/beer, orange/lemon, bee/wasp, chair/sofa, cake/pie,
shark/dolphin, forest/jungle, bread/toast, hat/helmet, umbrella/raincoat, egg/potato,
watch/clock, hammer/axe, ring/necklace, desert/savanna, owl/eagle, rose/tulip,
milk/yogurt, kite/balloon, mirror/window, map/compass, soup/stew, frog/toad,
`;

export const WORD_PAIRS: WordPair[] = raw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [a, b] = s.split("/");
    return { a: a!, b: b! };
  });
