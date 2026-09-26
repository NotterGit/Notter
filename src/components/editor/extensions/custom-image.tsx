/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import Image from "@tiptap/extension-image"
import { NodeSelection } from "@tiptap/pm/state"
import {
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Subtitles,
  Trash2,
  GripHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DEFAULT_MEDIA_ALIGNMENT,
  DEFAULT_MEDIA_WIDTH,
} from "@/config/const/editor.const"
import type {
  ImageDragPreviewProps,
  ImageComponentProps,
} from "@/config/types/editor.types"

export function ImageDragPreview({
  src,
  alt,
  width,
  dragPreviewRef,
  initialCoords,
}: ImageDragPreviewProps) {
  return (
    <div
      ref={dragPreviewRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        transform: `translate3d(${initialCoords.x + 14}px, ${initialCoords.y + 14}px, 0)`,
        zIndex: 999999,
        pointerEvents: "none",
      }}
      className="pointer-events-none select-none flex flex-col gap-1.5 p-2 rounded-xl border border-border/80 dark:border-white/15 bg-background/95 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-md opacity-95 max-w-[240px]"
    >
      <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
        <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Фото</span>
        {width && width !== DEFAULT_MEDIA_WIDTH && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/80">
            {width}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center max-w-[220px] max-h-[140px]">
        <img
          src={src}
          alt={alt || "Фото"}
          className="max-h-[140px] max-w-[220px] w-auto h-auto object-contain rounded-lg"
        />
      </div>
    </div>
  )
}

export function ImageComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
  getPos,
  editor,
}: ImageComponentProps) {
  const [isResizing, setIsResizing] = useState(false)
  const isEditable = editor?.isEditable ?? true
  const [isDragging, setIsDragging] = useState(false)
  const [initialCoords, setInitialCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragPreviewRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [localCaption, setLocalCaption] = useState(node.attrs.caption || "")
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const captionInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  useEffect(() => {
    setLocalCaption(node.attrs.caption || "")
  }, [node.attrs.caption])

  const currentWidth = node.attrs.width || "100%"
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
      target.closest(".cursor-ew-resize") ||
      target.closest(".image-caption-container") ||
      target.closest(".image-toolbar-container")
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

  const handleImageDragStart = (e: React.DragEvent) => {
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

    const startX = e.clientX
    const startY = e.clientY
    setInitialCoords({ x: startX, y: startY })
    setIsDragging(true)

    const updatePreviewPosition = (clientX: number, clientY: number) => {
      if (clientX === 0 && clientY === 0) return
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.transform = `translate3d(${clientX + 14}px, ${clientY + 14}px, 0)`
      }
    }

    const handleWindowDragOver = (ev: DragEvent) => {
      updatePreviewPosition(ev.clientX, ev.clientY)
    }

    const handleWindowDrag = (ev: DragEvent) => {
      updatePreviewPosition(ev.clientX, ev.clientY)
    }

    window.addEventListener("dragover", handleWindowDragOver, { capture: true, passive: true })
    window.addEventListener("drag", handleWindowDrag, { capture: true, passive: true })

    const cleanup = () => {
      setIsDragging(false)
      document.body.classList.remove("editor-is-dragging")
      window.removeEventListener("dragover", handleWindowDragOver, true)
      window.removeEventListener("drag", handleWindowDrag, true)
      window.removeEventListener("dragend", cleanup, true)
      window.removeEventListener("drop", cleanup, true)
      cleanupRef.current = null
    }

    cleanupRef.current = cleanup
    window.addEventListener("dragend", cleanup, { capture: true, once: true })
    window.addEventListener("drop", cleanup, { capture: true, once: true })

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      try {
        const emptyCanvas = document.createElement("canvas")
        emptyCanvas.width = 1
        emptyCanvas.height = 1
        emptyCanvas.style.position = "fixed"
        emptyCanvas.style.left = "-9999px"
        emptyCanvas.style.top = "-9999px"
        document.body.appendChild(emptyCanvas)
        e.dataTransfer.setDragImage(emptyCanvas, 0, 0)
        setTimeout(() => {
          if (emptyCanvas.parentNode) {
            emptyCanvas.parentNode.removeChild(emptyCanvas)
          }
        }, 0)
      } catch {
      }
    }
  }

  const handleResizeStart = (direction: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const container = containerRef.current
    const parent = container?.parentElement
    const parentWidth = parent ? parent.offsetWidth : 700
    const initialWidthPx = container ? container.offsetWidth : 400

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX =
        direction === "right"
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX
      const newWidthPx = Math.max(120, Math.min(parentWidth, initialWidthPx + deltaX))
      const newPercent = Math.round((newWidthPx / parentWidth) * 100)
      updateAttributes({ width: `${newPercent}%` })
    }

    const onMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  return (
    <NodeViewWrapper
      className={cn(
        "image-node-view relative my-6 flex flex-col group/image transition-all select-none",
        (selected || isResizing) ? "z-30" : "hover:z-30",
        alignment === "left" && "items-start",
        alignment === "center" && "items-center",
        alignment === "right" && "items-end"
      )}
    >
      <div
        ref={containerRef}
        className="relative flex flex-col items-center"
        style={{ width: currentWidth, maxWidth: "100%" }}
      >
        {isEditable && (
          <div
            contentEditable={false}
            className={cn(
              "image-toolbar-container absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg border bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur-md text-xs opacity-0 transition-opacity pointer-events-none group-hover/image:opacity-100 group-hover/image:pointer-events-auto",
              selected && "opacity-100 pointer-events-auto"
            )}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0.5">
              {(["25%", "50%", "75%", "100%"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateAttributes({ width: w })}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer",
                    currentWidth === w
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>

            <span className="h-3.5 w-px bg-border mx-0.5" />

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
              title="Удалить картинку"
              className="p-1 rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div
          className={cn(
            "relative w-full rounded-xl border border-border/60 overflow-hidden bg-background shadow-xs transition-all group/imgbox select-none",
            selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <img
            ref={imgRef}
            src={node.attrs.src}
            alt={node.attrs.alt || "Изображение"}
            draggable={isEditable ? "true" : "false"}
            onMouseDown={handleMouseDown}
            onDragStart={handleImageDragStart}
            className={cn(
              "block w-full h-auto object-cover transition-all select-none",
              isEditable && "cursor-grab active:cursor-grabbing"
            )}
          />

          {isEditable && (
            <div
              contentEditable={false}
              draggable="true"
              onMouseDown={handleMouseDown}
              onDragStart={handleImageDragStart}
              className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/80 px-2 py-1 text-[10px] text-white/95 opacity-0 group-hover/imgbox:opacity-100 transition-opacity select-none backdrop-blur-sm cursor-grab active:cursor-grabbing"
              title="Перетащите для перемещения"
            >
              <GripHorizontal size={11} className="shrink-0" />
              <span className="font-mono">{currentWidth}</span>
            </div>
          )}

          {isEditable && (
            <div
              contentEditable={false}
              onMouseDown={handleResizeStart("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex h-12 w-3.5 cursor-ew-resize items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover/image:opacity-100 hover:scale-110 transition-all select-none"
              title="Потяните для изменения ширины"
            >
              <span className="h-4 w-0.5 rounded-full bg-white/80" />
            </div>
          )}

          {isEditable && (
            <div
              contentEditable={false}
              onMouseDown={handleResizeStart("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex h-12 w-3.5 cursor-ew-resize items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover/image:opacity-100 hover:scale-110 transition-all select-none"
              title="Потяните для изменения ширины"
            >
              <span className="h-4 w-0.5 rounded-full bg-white/80" />
            </div>
          )}

          {isResizing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/25 backdrop-blur-2xs pointer-events-none">
              <span className="rounded-md bg-black/85 px-3 py-1 text-xs font-semibold text-white shadow">
                {currentWidth}
              </span>
            </div>
          )}
        </div>

        <div
          contentEditable={false}
          className="image-caption-container mt-2 w-full text-center"
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
            placeholder="Добавить подпись к изображению…"
            className={cn(
              "w-full max-w-lg mx-auto text-center text-xs text-muted-foreground placeholder:text-muted-foreground/45 bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-0.5 transition-all cursor-text",
              !localCaption &&
                "opacity-0 group-hover/image:opacity-100 focus:opacity-100"
            )}
          />
        </div>
      </div>

      {isDragging && typeof window !== "undefined" && createPortal(
        <ImageDragPreview
          src={node.attrs.src || ""}
          alt={node.attrs.alt}
          width={currentWidth}
          dragPreviewRef={dragPreviewRef}
          initialCoords={initialCoords}
        />,
        window.document.body
      )}
    </NodeViewWrapper>
  )
}

export const CustomImage = Image.extend({
  name: "image",
  group: "block",
  inline: false,
  atom: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "img[src]" }]
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: DEFAULT_MEDIA_WIDTH,
        parseHTML: (el) =>
          el.getAttribute("data-width") || el.style.width || DEFAULT_MEDIA_WIDTH,
        renderHTML: (attrs) => ({
          "data-width": attrs.width,
          style: `width: ${attrs.width}`,
        }),
      },
      alignment: {
        default: DEFAULT_MEDIA_ALIGNMENT,
        parseHTML: (el) => el.getAttribute("data-alignment") || DEFAULT_MEDIA_ALIGNMENT,
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
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent, {
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
            target.closest("input") ||
            target.closest("button") ||
            target.closest(".image-caption-container") ||
            target.closest(".image-toolbar-container") ||
            target.closest(".cursor-ew-resize"))
        ) {
          return true
        }
        return false
      },
    })
  },
})
