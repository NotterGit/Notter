import MarkdownIt from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";

/**
 * Strips outer code block markers (e.g. ```markdown ... ```) if an LLM
 * wraps its entire response in a code fence, and normalizes line breaks.
 */
export function cleanAiMarkdown(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\r\n?/g, "\n").trim();

  // If the entire output is wrapped in a markdown/md/plain code block, extract its content
  const codeBlockMatch = cleaned.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  return cleaned;
}

/**
 * Creates and configures a MarkdownIt instance with Tiptap-specific rules,
 * particularly for converting GFM task lists (- [ ] / - [x]) into Tiptap's
 * TaskList (<ul data-type="taskList">) and TaskItem (<li data-type="taskItem">).
 */
export function createEditorMarkdownParser(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
    typographer: false,
  });

  md.core.ruler.after("inline", "task-lists", (state: StateCore) => {
    const tokens = state.tokens;

    for (let i = 2; i < tokens.length; i++) {
      const currentToken = tokens[i];
      const prevToken = tokens[i - 1];
      const grandParentToken = tokens[i - 2];

      if (
        currentToken.type === "inline" &&
        prevToken.type === "paragraph_open" &&
        grandParentToken.type === "list_item_open"
      ) {
        const text = currentToken.content;
        const taskRegex = /^\[([ xX])\]\s+/;
        const match = text.match(taskRegex);

        if (match) {
          const checked = match[1].toLowerCase() === "x";
          const matchLength = match[0].length;

          // Configure list item for Tiptap's TaskItem extension
          grandParentToken.attrSet("data-type", "taskItem");
          grandParentToken.attrSet("data-checked", String(checked));

          // Strip the "[ ] " or "[x] " prefix from the token content
          currentToken.content = text.slice(matchLength);
          if (currentToken.children && currentToken.children.length > 0) {
            const firstChild = currentToken.children[0];
            if (firstChild && firstChild.type === "text") {
              firstChild.content = firstChild.content.slice(matchLength);
            }
          }

          // Ensure the paragraph tags are rendered around task item text
          // (Tiptap TaskItem extension requires a paragraph block child)
          prevToken.hidden = false;
          for (let k = i + 1; k < tokens.length; k++) {
            if (tokens[k].type === "paragraph_close") {
              tokens[k].hidden = false;
              break;
            }
          }

          // Find the enclosing bullet list and mark it as taskList
          let depth = 0;
          for (let j = i - 2; j >= 0; j--) {
            const tokType = tokens[j].type;
            if (tokType === "list_item_close") depth++;
            if (tokType === "list_item_open") {
              if (depth > 0) depth--;
            }
            if (tokType === "bullet_list_close") depth++;
            if (tokType === "bullet_list_open") {
              if (depth === 0) {
                tokens[j].attrSet("data-type", "taskList");
                break;
              } else {
                depth--;
              }
            }
          }
        }
      }
    }
  });

  return md;
}

const defaultParser = createEditorMarkdownParser();

/**
 * Converts AI-generated Markdown into clean HTML compatible with Tiptap's ProseMirror schema.
 */
export function markdownToEditorHtml(markdown: string): string {
  const cleaned = cleanAiMarkdown(markdown);
  if (!cleaned) return "";
  return defaultParser.render(cleaned);
}
