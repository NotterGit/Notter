export interface TiptapMark {
  type: string
  attrs?: Record<string, any>
}

export interface TiptapNode {
  type: string
  attrs?: Record<string, any>
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
}

export interface TiptapDoc {
  type: "doc"
  content: TiptapNode[]
}

export function convertInlineContent(content: any): TiptapNode[] {
  if (!content) return []
  if (typeof content === "string") {
    return [{ type: "text", text: content }]
  }
  if (!Array.isArray(content)) return []

  const result: TiptapNode[] = []

  for (const item of content) {
    if (!item) continue

    if (typeof item === "string") {
      result.push({ type: "text", text: item })
      continue
    }

    if (item.type === "text") {
      const text = item.text || ""
      if (!text) continue

      const marks: TiptapMark[] = []
      const styles = item.styles || {}

      if (styles.bold) marks.push({ type: "bold" })
      if (styles.italic) marks.push({ type: "italic" })
      if (styles.underline) marks.push({ type: "underline" })
      if (styles.strike) marks.push({ type: "strike" })
      if (styles.code) marks.push({ type: "code" })
      if (styles.textColor && styles.textColor !== "default") {
        marks.push({ type: "textStyle", attrs: { color: styles.textColor } })
      }
      if (styles.backgroundColor && styles.backgroundColor !== "default") {
        marks.push({ type: "highlight", attrs: { color: styles.backgroundColor } })
      }

      result.push({
        type: "text",
        text,
        ...(marks.length > 0 ? { marks } : {}),
      })
    } else if (item.type === "link") {
      const href = item.href || "#"
      const innerContent = convertInlineContent(item.content)
      for (const node of innerContent) {
        if (node.type === "text") {
          const marks = node.marks ? [...node.marks] : []
          marks.push({ type: "link", attrs: { href, target: "_blank" } })
          result.push({ ...node, marks })
        } else {
          result.push(node)
        }
      }
    }
  }

  return result
}

function convertSingleBlock(block: any): TiptapNode | TiptapNode[] {
  if (!block || typeof block !== "object") {
    return { type: "paragraph" }
  }

  const type = block.type || "paragraph"
  const props = block.props || {}
  const inline = convertInlineContent(block.content)

  switch (type) {
    case "heading": {
      const level = Math.min(Math.max(Number(props.level) || 1, 1), 6)
      return {
        type: "heading",
        attrs: { level },
        ...(inline.length > 0 ? { content: inline } : {}),
      }
    }

    case "paragraph": {
      return {
        type: "paragraph",
        ...(inline.length > 0 ? { content: inline } : {}),
      }
    }

    case "quote":
    case "blockquote": {
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            ...(inline.length > 0 ? { content: inline } : {}),
          },
        ],
      }
    }

    case "codeBlock": {
      const text =
        typeof block.content === "string"
          ? block.content
          : Array.isArray(block.content)
            ? block.content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
            : ""
      return {
        type: "codeBlock",
        attrs: { language: props.language || null },
        ...(text ? { content: [{ type: "text", text }] } : {}),
      }
    }

    case "image": {
      return {
        type: "image",
        attrs: {
          src: props.url || "",
          alt: props.caption || props.name || "",
          caption: props.caption || "",
          width: props.previewWidth ? `${props.previewWidth}px` : "100%",
          alignment: props.textAlignment || "center",
        },
      }
    }

    case "video": {
      return {
        type: "video",
        attrs: {
          src: props.url || "",
          caption: props.caption || "",
          width: props.previewWidth ? `${props.previewWidth}px` : "100%",
          alignment: props.textAlignment || "center",
        },
      }
    }

    case "audio": {
      return {
        type: "audio",
        attrs: {
          src: props.url || "",
          title: props.name || props.caption || "",
          caption: props.caption || "",
        },
      }
    }

    case "divider": {
      return { type: "horizontalRule" }
    }

    case "file": {
      const fileName = props.name || props.caption || props.url || "Файл"
      const url = props.url || "#"
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: fileName,
            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
          },
        ],
      }
    }

    default: {
      return {
        type: "paragraph",
        ...(inline.length > 0 ? { content: inline } : {}),
      }
    }
  }
}

export function convertBlockNoteBlocksToTiptap(blocks: any[]): TiptapNode[] {
  const result: TiptapNode[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]
    if (!block || typeof block !== "object") {
      i++
      continue
    }

    const type = block.type

    // Group bullet list items
    if (type === "bulletListItem") {
      const listItems: TiptapNode[] = []
      while (i < blocks.length && blocks[i]?.type === "bulletListItem") {
        const itemBlock = blocks[i]
        const inline = convertInlineContent(itemBlock.content)
        const itemContent: TiptapNode[] = [
          {
            type: "paragraph",
            ...(inline.length > 0 ? { content: inline } : {}),
          },
        ]
        if (Array.isArray(itemBlock.children) && itemBlock.children.length > 0) {
          const childNodes = convertBlockNoteBlocksToTiptap(itemBlock.children)
          itemContent.push(...childNodes)
        }
        listItems.push({
          type: "listItem",
          content: itemContent,
        })
        i++
      }
      result.push({
        type: "bulletList",
        content: listItems,
      })
      continue
    }

    // Group numbered list items
    if (type === "numberedListItem") {
      const listItems: TiptapNode[] = []
      while (i < blocks.length && blocks[i]?.type === "numberedListItem") {
        const itemBlock = blocks[i]
        const inline = convertInlineContent(itemBlock.content)
        const itemContent: TiptapNode[] = [
          {
            type: "paragraph",
            ...(inline.length > 0 ? { content: inline } : {}),
          },
        ]
        if (Array.isArray(itemBlock.children) && itemBlock.children.length > 0) {
          const childNodes = convertBlockNoteBlocksToTiptap(itemBlock.children)
          itemContent.push(...childNodes)
        }
        listItems.push({
          type: "listItem",
          content: itemContent,
        })
        i++
      }
      result.push({
        type: "orderedList",
        attrs: { start: 1 },
        content: listItems,
      })
      continue
    }

    // Group check list items (taskList)
    if (type === "checkListItem") {
      const taskItems: TiptapNode[] = []
      while (i < blocks.length && blocks[i]?.type === "checkListItem") {
        const itemBlock = blocks[i]
        const inline = convertInlineContent(itemBlock.content)
        const itemContent: TiptapNode[] = [
          {
            type: "paragraph",
            ...(inline.length > 0 ? { content: inline } : {}),
          },
        ]
        if (Array.isArray(itemBlock.children) && itemBlock.children.length > 0) {
          const childNodes = convertBlockNoteBlocksToTiptap(itemBlock.children)
          itemContent.push(...childNodes)
        }
        taskItems.push({
          type: "taskItem",
          attrs: { checked: Boolean(itemBlock.props?.checked) },
          content: itemContent,
        })
        i++
      }
      result.push({
        type: "taskList",
        content: taskItems,
      })
      continue
    }

    // Standard block
    const converted = convertSingleBlock(block)
    if (Array.isArray(converted)) {
      result.push(...converted)
    } else {
      result.push(converted)
    }

    // Handle nested children of non-list blocks if any
    if (Array.isArray(block.children) && block.children.length > 0) {
      const childNodes = convertBlockNoteBlocksToTiptap(block.children)
      result.push(...childNodes)
    }

    i++
  }

  return result
}

export function convertBlockNoteToTiptap(rawContent: any): TiptapDoc {
  const emptyDoc: TiptapDoc = {
    type: "doc",
    content: [{ type: "paragraph" }],
  }

  if (!rawContent) return emptyDoc

  let parsed = rawContent
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim()
    if (!trimmed) return emptyDoc

    try {
      parsed = JSON.parse(trimmed)
    } catch {
      // Plain text fallback
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: trimmed }],
          },
        ],
      }
    }
  }

  // If already Tiptap doc
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.type === "doc") {
    return parsed as TiptapDoc
  }

  // If BlockNote blocks array
  if (Array.isArray(parsed)) {
    const nodes = convertBlockNoteBlocksToTiptap(parsed)
    return {
      type: "doc",
      content: nodes.length > 0 ? nodes : [{ type: "paragraph" }],
    }
  }

  return emptyDoc
}
