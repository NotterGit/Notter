import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";

function serializeMarks(
  text: string,
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
): string {
  if (!marks || marks.length === 0) return text;
  let formatted = text;

  for (const mark of marks) {
    switch (mark.type) {
      case "code":
        formatted = `\`${formatted}\``;
        break;
      case "bold":
        formatted = `**${formatted}**`;
        break;
      case "italic":
        formatted = `*${formatted}*`;
        break;
      case "strike":
        formatted = `~~${formatted}~~`;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        if (href) {
          formatted = `[${formatted}](${href})`;
        }
        break;
      }
      default:
        break;
    }
  }

  return formatted;
}

function serializeNode(
  node?: JSONContent,
  depth = 0,
  listIndex = 1,
  listType: "bullet" | "ordered" | "task" = "bullet"
): string {
  if (!node) return "";
  const indent = "  ".repeat(depth);

  if (node.type === "text") {
    return serializeMarks(node.text || "", node.marks);
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  if (node.type === "horizontalRule") {
    return "---";
  }

  if (node.type === "image") {
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "Изображение";
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
    return src ? `![${alt}](${src})` : "";
  }

  if (node.type === "video") {
    const title = typeof node.attrs?.title === "string" ? node.attrs.title : "Видео";
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
    return src ? `[Видео: ${title}](${src})` : "";
  }

  if (node.type === "audio") {
    const title = typeof node.attrs?.title === "string" ? node.attrs.title : "Аудио";
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
    return src ? `[Аудио: ${title}](${src})` : "";
  }

  if (node.type === "heading") {
    const level =
      typeof node.attrs?.level === "number"
        ? Math.min(6, Math.max(1, node.attrs.level))
        : 1;
    const prefix = "#".repeat(level);
    const content = (node.content || []).map((c) => serializeNode(c, depth)).join("");
    return `${prefix} ${content}`;
  }

  if (node.type === "paragraph") {
    return (node.content || []).map((c) => serializeNode(c, depth)).join("");
  }

  if (node.type === "codeBlock") {
    const lang = typeof node.attrs?.language === "string" ? node.attrs.language : "";
    const code = (node.content || []).map((c) => c.text || "").join("");
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  }

  if (node.type === "blockquote") {
    const content = (node.content || [])
      .map((c) => serializeNode(c, depth))
      .filter((s) => s.trim().length > 0)
      .join("\n\n");
    return content
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  if (node.type === "bulletList") {
    return (node.content || [])
      .map((item) => serializeNode(item, depth, 0, "bullet"))
      .filter(Boolean)
      .join("\n");
  }

  if (node.type === "orderedList") {
    let currentIdx = 1;
    return (node.content || [])
      .map((item) => {
        const line = serializeNode(item, depth, currentIdx, "ordered");
        currentIdx++;
        return line;
      })
      .filter(Boolean)
      .join("\n");
  }

  if (node.type === "taskList") {
    return (node.content || [])
      .map((item) => serializeNode(item, depth, 0, "task"))
      .filter(Boolean)
      .join("\n");
  }

  if (node.type === "listItem") {
    const prefix = listType === "ordered" ? `${listIndex}. ` : "- ";
    const childNodes = node.content || [];
    const firstBlock = childNodes[0];
    const restBlocks = childNodes.slice(1);

    const firstText = firstBlock ? serializeNode(firstBlock, depth) : "";
    let line = `${indent}${prefix}${firstText}`;

    if (restBlocks.length > 0) {
      const restText = restBlocks
        .map((c) => serializeNode(c, depth + 1))
        .filter(Boolean)
        .join("\n");
      if (restText) {
        line += `\n${restText}`;
      }
    }
    return line;
  }

  if (node.type === "taskItem") {
    const checked = Boolean(node.attrs?.checked);
    const prefix = `- [${checked ? "x" : " "}] `;
    const childNodes = node.content || [];
    const firstBlock = childNodes[0];
    const restBlocks = childNodes.slice(1);

    const firstText = firstBlock ? serializeNode(firstBlock, depth) : "";
    let line = `${indent}${prefix}${firstText}`;

    if (restBlocks.length > 0) {
      const restText = restBlocks
        .map((c) => serializeNode(c, depth + 1))
        .filter(Boolean)
        .join("\n");
      if (restText) {
        line += `\n${restText}`;
      }
    }
    return line;
  }

  if (node.type === "doc") {
    return (node.content || [])
      .map((c) => serializeNode(c, 0))
      .filter((s) => s.trim().length > 0)
      .join("\n\n");
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map((c) => serializeNode(c, depth)).join("");
  }

  return node.text || "";
}

/**
 * Converts a Tiptap JSON document structure to clean Markdown text.
 */
function tiptapJsonToMarkdown(json: JSONContent): string {
  if (!json || typeof json !== "object") return "";
  return serializeNode(json, 0).trim();
}

/**
 * Extracts and formats the entire content of a Tiptap Editor instance as clean Markdown.
 * Falls back to plain text if JSON serialization returns empty.
 */
export function editorToMarkdown(editor: Editor | null): string {
  if (!editor || editor.isDestroyed || editor.isEmpty) {
    return "";
  }

  try {
    const json = editor.getJSON();
    const markdown = tiptapJsonToMarkdown(json);
    if (markdown.trim()) {
      return markdown.trim();
    }
  } catch (err) {
    console.warn("Failed to convert editor JSON to markdown, falling back to text:", err);
  }

  try {
    return editor.getText({ blockSeparator: "\n\n" }).trim();
  } catch {
    return "";
  }
}
