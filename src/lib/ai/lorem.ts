export const LOREM_WORDS: readonly string[] = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation",
  "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat",
  "duis", "aute", "irure", "in", "reprehenderit", "in", "voluptate", "velit", "esse",
  "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde", "omnis",
  "iste", "natus", "error", "sit", "voluptatem", "accusantium", "doloremque", "laudantium",
  "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore",
  "veritatis", "et", "quasi", "architecto", "beatae", "vitae", "dicta", "sunt", "explicabo"
];

/**
 * Generates Lorem Ipsum markdown or plain text with the specified word count.
 * Useful for development and UI/typewriter testing.
 */
export function generateLoremIpsum(wordCount: number, withMarkdown: boolean = true): string {
  const count = Math.max(5, Math.min(5000, Math.round(wordCount)));
  let wordsGenerated = 0;
  const blocks: string[] = [];

  if (withMarkdown && count >= 25) {
    blocks.push("## Lorem Ipsum Dolor Sit Amet\n\n");
  }

  let pIndex = 0;

  while (wordsGenerated < count) {
    const remaining = count - wordsGenerated;

    if (withMarkdown && pIndex > 0 && pIndex % 3 === 0 && remaining >= 30) {
      blocks.push(`### Раздел ${(pIndex / 3) + 1}\n\n`);
    }

    if (withMarkdown && pIndex === 2 && remaining >= 18) {
      const items = Math.min(4, Math.floor(remaining / 5));
      for (let i = 0; i < items && wordsGenerated < count; i++) {
        const itemLen = Math.min(6, count - wordsGenerated);
        const itemWords: string[] = [];
        for (let j = 0; j < itemLen; j++) {
          itemWords.push(LOREM_WORDS[(wordsGenerated + j) % LOREM_WORDS.length]);
        }
        wordsGenerated += itemLen;
        let str = itemWords.join(" ");
        str = str.charAt(0).toUpperCase() + str.slice(1);
        blocks.push(`- ${str}\n`);
      }
      blocks.push("\n");
      pIndex++;
      continue;
    }

    const sentencesInP = Math.min(4, Math.max(1, Math.ceil(remaining / 14)));
    const pSentences: string[] = [];

    for (let s = 0; s < sentencesInP && wordsGenerated < count; s++) {
      const sentenceLen = Math.min(count - wordsGenerated, Math.floor(Math.random() * 6) + 8);
      const sentenceWords: string[] = [];
      for (let w = 0; w < sentenceLen; w++) {
        let word = LOREM_WORDS[(wordsGenerated + w) % LOREM_WORDS.length];
        if (w === 0) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        if (withMarkdown && w === 2 && sentenceLen > 5 && Math.random() > 0.7) {
          word = `**${word}**`;
        }
        sentenceWords.push(word);
      }
      wordsGenerated += sentenceLen;
      pSentences.push(sentenceWords.join(" ") + ".");
    }

    blocks.push(pSentences.join(" ") + "\n\n");
    pIndex++;
  }

  return blocks.join("").trim();
}
