import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { HEADING_LEVELS } from "@/config/const/editor.const";
import { markdownToEditorHtml } from "./markdown-to-html";

const tiptapSchemaExtensions = [
  StarterKit.configure({
    heading: false,
  }),
  Heading.configure({
    levels: [...HEADING_LEVELS],
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  Image,
  TaskList,
  TaskItem.configure({ nested: true }),
];

/**
 * Converts Markdown text into a valid Tiptap JSON document structure.
 */
export function markdownToTiptapDoc(markdown: string): Record<string, unknown> {
  const trimmed = markdown?.trim();
  if (!trimmed) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  const html = markdownToEditorHtml(trimmed);
  if (!html.trim()) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: trimmed }],
        },
      ],
    };
  }

  if (typeof window !== "undefined") {
    try {
      const json = generateJSON(html, tiptapSchemaExtensions);
      if (
        json &&
        typeof json === "object" &&
        json.type === "doc" &&
        Array.isArray(json.content) &&
        json.content.length > 0
      ) {
        return json;
      }
    } catch (error) {
      console.warn("Failed to generate Tiptap JSON from markdown HTML via generateJSON:", error);
    }
  }

  return {
    type: "doc",
    content: trimmed
      .split(/\n\n+/)
      .map((block) => ({
        type: "paragraph",
        content: [{ type: "text", text: block.trim() }],
      }))
      .filter((p) => p.content[0].text.length > 0),
  };
}
