"use client"

import React, { useEffect, useRef, useState } from "react"
import { Node } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { NodeSelection } from "@tiptap/pm/state"
import {
  Music,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Subtitles,
  Trash2,
  GripHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createDragGhost, ensureMediaUrl } from "./media-utils"

export function AudioComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
  getPos,
  editor,
}: {
  node: {
    attrs: Record<string, any>
  }
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  getPos: () => number
  editor: any
  [key: string]: any
}) {
  const isEditable = editor?.isEditable ?? true
  const [localCaption, setLocalCaption] = useState(node.attrs.caption || "")
  const captionInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalCaption(node.attrs.caption || "")
  }, [node.attrs.caption])

  useEffect(() => {
    if (
      node.attrs.src &&
      (node.attrs.src.startsWith("data:video/") || node.attrs.src.startsWith("data:audio/"))
    ) {
      const blobUrl = ensureMediaUrl(node.attrs.src)
      if (blobUrl && blobUrl !== node.attrs.src) {
        updateAttributes({ src: blobUrl })
      }
    }
  }, [node.attrs.src, updateAttributes])

  const alignment = node.attrs.alignment || "center"

  const commitCaption = () => {
    if (localCaption !== (node.attrs.caption || "")) {
      updateAttributes({ caption: localCaption })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest("input") ||
      target.closest("button") ||
      target.closest("audio") ||
      target.closest(".audio-caption-container") ||
      target.closest(".audio-toolbar-container")
    ) {
      return
    }

    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      sel.removeAllRanges()
    }

    const pos = typeof getPos === "function" ? getPos() : undefined
    if (typeof pos === "number" && editor) {
      const tr = editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, pos)
      )
      editor.view.dispatch(tr)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      sel.removeAllRanges()
    }

    const pos = typeof getPos === "function" ? getPos() : undefined
    if (typeof pos === "number" && editor) {
      const tr = editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, pos)
      )
      editor.view.dispatch(tr)
    }

    document.body.classList.add("editor-is-dragging")
    const cleanup = () => {
      document.body.classList.remove("editor-is-dragging")
      window.removeEventListener("dragend", cleanup)
      window.removeEventListener("drop", cleanup)
    }
    window.addEventListener("dragend", cleanup, { once: true })
    window.addEventListener("drop", cleanup, { once: true })

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      const ghost = createDragGhost("🎵", node.attrs.title || "Аудиозапись")
      if (ghost) {
        e.dataTransfer.setDragImage(ghost, 20, 20)
        requestAnimationFrame(() => {
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
        })
      }
    }
  }

  return (
    <NodeViewWrapper
      className={cn(
        "audio-node-view relative my-5 flex flex-col group/audio transition-all select-none",
        selected ? "z-30" : "hover:z-30",
        alignment === "left" && "items-start",
        alignment === "center" && "items-center",
        alignment === "right" && "items-end"
      )}
    >
      <div className="relative flex flex-col w-full max-w-xl">
        {isEditable && (
          <div
            contentEditable={false}
            className={cn(
              "audio-toolbar-container absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg border bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur-md text-xs opacity-0 transition-opacity pointer-events-none group-hover/audio:opacity-100 group-hover/audio:pointer-events-auto",
              selected && "opacity-100 pointer-events-auto"
            )}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "left" })}
              title="По левому краю"
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                alignment === "left"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "center" })}
              title="По центру"
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                alignment === "center"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: "right" })}
              title="По правому краю"
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                alignment === "right"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlignRight size={13} />
            </button>

            <span className="h-3.5 w-px bg-border mx-0.5" />

            <button
              type="button"
              onClick={() => captionInputRef.current?.focus()}
              title="Добавить / редактировать подпись"
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <Subtitles size={13} />
            </button>

            <span className="h-3.5 w-px bg-border mx-0.5" />

            <button
              type="button"
              onClick={deleteNode}
              title="Удалить аудио"
              className="p-1 rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div
          draggable={isEditable ? "true" : "false"}
          onMouseDown={handleMouseDown}
          onDragStart={handleDragStart}
          className={cn(
            "relative w-full rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs transition-all flex flex-col group/audiobox select-none",
            isEditable && "cursor-grab active:cursor-grabbing",
            selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          title={isEditable ? "Потяните для перемещения аудио" : undefined}
        >
          <div
            draggable={isEditable ? "true" : "false"}
            onMouseDown={handleMouseDown}
            onDragStart={handleDragStart}
            className={cn(
              "flex items-center justify-between px-3 py-1.5 bg-muted/90 hover:bg-muted border-b border-border/40 select-none transition-colors",
              isEditable && "cursor-grab active:cursor-grabbing"
            )}
            title={isEditable ? "Потяните для перемещения аудио" : undefined}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
              <GripHorizontal size={14} className="text-muted-foreground/70" />
              <Music size={13} className="text-primary" />
              <span className="truncate max-w-[220px] font-bold text-[11px] text-foreground">
                {node.attrs.title || "Аудиозапись"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono pointer-events-none">
              Аудио
            </span>
          </div>

          <div className="p-3">
            <audio
              src={ensureMediaUrl(node.attrs.src)}
              controls
              preload="metadata"
              className="w-full h-9 rounded-lg"
            />
          </div>
        </div>

        <div
          contentEditable={false}
          className="audio-caption-container mt-2 w-full text-center"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            ref={captionInputRef}
            type="text"
            value={localCaption}
            onChange={(e) => setLocalCaption(e.target.value)}
            onBlur={commitCaption}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter") {
                commitCaption()
                captionInputRef.current?.blur()
              }
            }}
            placeholder="Добавить подпись к аудио…"
            className={cn(
              "w-full max-w-lg mx-auto text-center text-xs text-muted-foreground placeholder:text-muted-foreground/45 bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-0.5 transition-all cursor-text",
              !localCaption &&
                "opacity-0 group-hover/audio:opacity-100 focus:opacity-100"
            )}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const CustomAudio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.getAttribute("src"),
        renderHTML: (attrs) => ({
          src: attrs.src,
        }),
      },
      title: {
        default: "Аудиозапись",
        parseHTML: (el) => el.getAttribute("data-title") || "Аудиозапись",
        renderHTML: (attrs) => ({
          "data-title": attrs.title,
        }),
      },
      alignment: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-alignment") || "center",
        renderHTML: (attrs) => ({
          "data-alignment": attrs.alignment,
        }),
      },
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") || "",
        renderHTML: (attrs) => ({
          "data-caption": attrs.caption,
        }),
      },
    }
  },
  parseHTML() {
    return [{ tag: "audio" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      {
        ...HTMLAttributes,
        controls: "true",
      },
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(AudioComponent, {
      stopEvent: ({ event }) => {
        if (event.type.startsWith("drag") || event.type === "drop") {
          return false
        }
        const target = event.target as HTMLElement
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "BUTTON" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "AUDIO" ||
            target.closest("input") ||
            target.closest("button") ||
            target.closest("audio") ||
            target.closest(".audio-caption-container") ||
            target.closest(".audio-toolbar-container"))
        ) {
          return true
        }
        return false
      },
    })
  },
})
