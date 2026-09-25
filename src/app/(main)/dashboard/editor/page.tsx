"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useOrganization, useUser } from "@clerk/nextjs"
import { EditorContent, useEditor, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Node } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextStyle from "@tiptap/extension-text-style"
import { NodeSelection } from "@tiptap/pm/state"
import toast from "react-hot-toast"

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Unlink,
  Image as ImageIcon,
  ImagePlus,
  Video as VideoIcon,
  Music,
  Film,
  GripHorizontal,
  UploadCloud,
  RotateCcw,
  Check,
  ChevronDown,
  Undo2,
  Redo2,
  Quote,
  Minus,
  RemoveFormatting,
  Sparkles,
  CheckCircle2,
  FileCode,
  Type,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Subtitles,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hint } from "@/components/ui/hint"
import { cn } from "@/lib/utils"
import { getOrgById } from "@/api/org"
import { getUserById } from "@/api/user"
import { getPlanLimits } from "@/lib/plan-limits"

const STORAGE_KEY = "notter-tiptap-prototype-v3"

function createDragGhost(icon: string, title: string, width?: string) {
  const ghost = document.createElement("div")
  ghost.style.position = "fixed"
  ghost.style.left = "0px"
  ghost.style.top = "0px"
  ghost.style.zIndex = "-99999"
  ghost.style.pointerEvents = "none"
  ghost.style.padding = "6px 14px"
  ghost.style.borderRadius = "8px"
  ghost.style.background = "#0f172a"
  ghost.style.color = "#ffffff"
  ghost.style.fontSize = "12px"
  ghost.style.fontWeight = "700"
  ghost.style.display = "inline-flex"
  ghost.style.alignItems = "center"
  ghost.style.gap = "8px"
  ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"
  ghost.style.border = "1px solid rgba(255,255,255,0.2)"
  ghost.style.whiteSpace = "nowrap"
  ghost.innerHTML = `<span style="font-size: 14px;">${icon}</span><span style="font-weight: 700; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>${width ? `<span style="opacity: 0.6; font-size: 10px; font-family: monospace; font-weight: 400; margin-left: 4px;">${width}</span>` : ""}`
  document.body.appendChild(ghost)

  const cleanup = () => {
    if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
    window.removeEventListener("dragend", cleanup)
    window.removeEventListener("drop", cleanup)
  }
  window.addEventListener("dragend", cleanup, { once: true })
  window.addEventListener("drop", cleanup, { once: true })
  setTimeout(cleanup, 10000)

  return ghost
}

const blobCache = new Map<string, string>()
function ensureMediaUrl(src: string): string {
  if (!src) return ""
  if (src.startsWith("data:video/") || src.startsWith("data:audio/")) {
    const cached = blobCache.get(src)
    if (cached) return cached
    try {
      const [header, base64] = src.split(",")
      const mime = header.match(/:(.*?);/)?.[1] || ""
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mime })
      const blobUrl = URL.createObjectURL(blob)
      blobCache.set(src, blobUrl)
      return blobUrl
    } catch {
      return src
    }
  }
  return src
}

function ImageDragPreview({
  src,
  alt,
  width,
  dragPreviewRef,
  initialCoords,
}: {
  src: string
  alt?: string
  width?: string
  dragPreviewRef: React.RefObject<HTMLDivElement | null>
  initialCoords: { x: number; y: number }
}) {
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
        {width && width !== "100%" && (
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

function ImageComponent({
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
      onSelectStart={(e: React.SyntheticEvent) => e.preventDefault()}
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
          src={node.attrs.src}
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

const CustomImage = Image.extend({
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
        default: "100%",
        parseHTML: (el) =>
          el.getAttribute("data-width") || el.style.width || "100%",
        renderHTML: (attrs) => ({
          "data-width": attrs.width,
          style: `width: ${attrs.width}`,
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

function VideoComponent({
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
  const [isResizing, setIsResizing] = useState(false)
  const isEditable = editor?.isEditable ?? true
  const [localCaption, setLocalCaption] = useState(node.attrs.caption || "")
  const containerRef = useRef<HTMLDivElement>(null)
  const captionInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalCaption(node.attrs.caption || "")
  }, [node.attrs.caption])

  useEffect(() => {
    if (node.attrs.src && (node.attrs.src.startsWith("data:video/") || node.attrs.src.startsWith("data:audio/"))) {
      const blobUrl = ensureMediaUrl(node.attrs.src)
      if (blobUrl && blobUrl !== node.attrs.src) {
        updateAttributes({ src: blobUrl })
      }
    }
  }, [node.attrs.src, updateAttributes])

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
      target.closest("video") ||
      target.closest(".cursor-ew-resize") ||
      target.closest(".video-caption-container") ||
      target.closest(".video-toolbar-container")
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
      const ghost = createDragGhost(
        "🎬",
        node.attrs.title || "Видео",
        currentWidth
      )
      e.dataTransfer.setDragImage(ghost, 20, 20)
      requestAnimationFrame(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
      })
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
      const newWidthPx = Math.max(220, Math.min(parentWidth, initialWidthPx + deltaX))
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
        "video-node-view relative my-6 flex flex-col group/video transition-all select-none",
        (selected || isResizing) ? "z-30" : "hover:z-30",
        alignment === "left" && "items-start",
        alignment === "center" && "items-center",
        alignment === "right" && "items-end"
      )}
      onSelectStart={(e: React.SyntheticEvent) => e.preventDefault()}
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
              "video-toolbar-container absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg border bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur-md text-xs opacity-0 transition-opacity pointer-events-none group-hover/video:opacity-100 group-hover/video:pointer-events-auto",
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
              title="Удалить видео"
              className="p-1 rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div
          className={cn(
            "relative w-full rounded-xl border border-border/60 overflow-hidden bg-black shadow-xs transition-all group/videobox select-none",
            selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <div
            draggable={isEditable ? "true" : "false"}
            onMouseDown={handleMouseDown}
            onDragStart={handleDragStart}
            className={cn(
              "flex items-center justify-between px-3 py-1.5 bg-muted/90 hover:bg-muted border-b border-border/40 select-none transition-colors",
              isEditable && "cursor-grab active:cursor-grabbing"
            )}
            title={isEditable ? "Потяните для перемещения видео" : undefined}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
              <GripHorizontal size={14} className="text-muted-foreground/70" />
              <Film size={13} className="text-primary" />
              <span className="truncate max-w-[220px] font-bold text-[11px] text-foreground">
                {node.attrs.title || "Видео"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono pointer-events-none">
              {currentWidth}
            </span>
          </div>

          <video
            src={ensureMediaUrl(node.attrs.src)}
            controls
            playsInline
            preload="metadata"
            className="block w-full h-auto max-h-[520px] object-contain bg-black select-none"
          />

          {isEditable && (
            <div
              contentEditable={false}
              onMouseDown={handleResizeStart("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex h-12 w-3.5 cursor-ew-resize items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover/video:opacity-100 hover:scale-110 transition-all select-none"
              title="Потяните для изменения ширины"
            >
              <span className="h-4 w-0.5 rounded-full bg-white/80" />
            </div>
          )}

          {isEditable && (
            <div
              contentEditable={false}
              onMouseDown={handleResizeStart("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex h-12 w-3.5 cursor-ew-resize items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover/video:opacity-100 hover:scale-110 transition-all select-none"
              title="Потяните для изменения ширины"
            >
              <span className="h-4 w-0.5 rounded-full bg-white/80" />
            </div>
          )}

          {isResizing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-2xs pointer-events-none z-20">
              <span className="rounded-md bg-black/85 px-3 py-1 text-xs font-semibold text-white shadow">
                {currentWidth}
              </span>
            </div>
          )}
        </div>

        <div
          contentEditable={false}
          className="video-caption-container mt-2 w-full text-center"
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
            placeholder="Добавить подпись к видео…"
            className={cn(
              "w-full max-w-lg mx-auto text-center text-xs text-muted-foreground placeholder:text-muted-foreground/45 bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-0.5 transition-all cursor-text",
              !localCaption &&
                "opacity-0 group-hover/video:opacity-100 focus:opacity-100"
            )}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const CustomVideo = Node.create({
  name: "video",
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
        default: "Видео",
        parseHTML: (el) => el.getAttribute("data-title") || "Видео",
        renderHTML: (attrs) => ({
          "data-title": attrs.title,
        }),
      },
      width: {
        default: "100%",
        parseHTML: (el) =>
          el.getAttribute("data-width") || el.style.width || "100%",
        renderHTML: (attrs) => ({
          "data-width": attrs.width,
          style: `width: ${attrs.width}`,
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
    return [{ tag: "video" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      {
        ...HTMLAttributes,
        controls: "true",
      },
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent, {
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
            target.tagName === "VIDEO" ||
            target.closest("input") ||
            target.closest("button") ||
            target.closest("video") ||
            target.closest(".video-caption-container") ||
            target.closest(".video-toolbar-container") ||
            target.closest(".cursor-ew-resize"))
        ) {
          return true
        }
        return false
      },
    })
  },
})

function AudioComponent({
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
    if (node.attrs.src && node.attrs.src.startsWith("data:audio/")) {
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
      e.dataTransfer.setDragImage(ghost, 20, 20)
      requestAnimationFrame(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
      })
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
      onSelectStart={(e: React.SyntheticEvent) => e.preventDefault()}
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

const CustomAudio = Node.create({
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

const starterContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Проверка кастомного редактора Tiptap" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Полнофункциональный редактор с удобной палитрой цветов, поддержкой перетаскивания картинок и заголовками H1–H5.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 4 },
      content: [{ type: "text", text: "Подзаголовок уровня H4 (теперь работает)" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Для H4 и H5 настроена четкая типографическая иерархия, правильные размеры шрифта и отступы.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 5 },
      content: [{ type: "text", text: "Секция уровня H5 (компактный заголовок)" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Ввод цвета в поле из выпадающего меню без alert/prompt",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Перетаскивание картинок напрямую (зажав само изображение мышью)",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Изменение размера изображения (25%, 50%, 75%, 100% или ползунком)",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Добавление и редактирование подписи под картинкой",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Загрузка и воспроизведение видео и аудио (с устройства или по ссылке)",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Изменение размера видео (пресеты 25%, 50%, 75%, 100% и боковые ползунки)",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Подписи к видео и аудиофайлам с надёжной изоляцией фокуса",
                },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Перетаскивание и перемещение всех медиа-блоков без дублирования",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "«Удобный редактор — это когда всё под рукой, ничего не отвлекает, а форматирование работает предсказуемо.»",
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 4 },
      content: [{ type: "text", text: "Медиа-блоки (перетаскивание drag & drop)" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Попробуйте перетащить изображение, видео или аудиозапись за верхнюю шапку в любое место документа:",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
        alt: "Изображение для проверки",
        width: "75%",
        alignment: "center",
        caption: "Перетаскивайте изображение за верхнюю шапку с ручкой",
      },
    },
    {
      type: "video",
      attrs: {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        title: "Демонстрационное видео",
        width: "75%",
        alignment: "center",
        caption: "Перетаскивайте видео за верхнюю шапку с ручкой",
      },
    },
    {
      type: "audio",
      attrs: {
        src: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
        title: "Шум дождя",
        alignment: "center",
        caption: "Перетаскивайте аудио за шапку карточки",
      },
    },
    { type: "paragraph" },
  ],
}

const TEXT_COLORS = [
  { name: "По умолчанию", value: "inherit", bg: "#64748b" },
  { name: "Черный", value: "#000000", bg: "#000000" },
  { name: "Темно-серый", value: "#334155", bg: "#334155" },
  { name: "Серый", value: "#64748b", bg: "#64748b" },
  { name: "Красный", value: "#ef4444", bg: "#ef4444" },
  { name: "Оранжевый", value: "#f97316", bg: "#f97316" },
  { name: "Янтарный", value: "#d97706", bg: "#d97706" },
  { name: "Зеленый", value: "#16a34a", bg: "#16a34a" },
  { name: "Бирюзовый", value: "#0891b2", bg: "#0891b2" },
  { name: "Синий", value: "#2563eb", bg: "#2563eb" },
  { name: "Индиго", value: "#4f46e5", bg: "#4f46e5" },
  { name: "Фиолетовый", value: "#9333ea", bg: "#9333ea" },
  { name: "Розовый", value: "#db2777", bg: "#db2777" },
]

const HIGHLIGHT_COLORS = [
  { name: "Без выделения", value: "transparent", bg: "transparent" },
  { name: "Желтый", value: "#fef08a", bg: "#fef08a" },
  { name: "Зеленый", value: "#bbf7d0", bg: "#bbf7d0" },
  { name: "Голубой", value: "#bfdbfe", bg: "#bfdbfe" },
  { name: "Фиолетовый", value: "#e9d5ff", bg: "#e9d5ff" },
  { name: "Розовый", value: "#fbcfe8", bg: "#fbcfe8" },
  { name: "Оранжевый", value: "#fed7aa", bg: "#fed7aa" },
  { name: "Красный", value: "#fecaca", bg: "#fecaca" },
  { name: "Бирюзовый", value: "#99f6e4", bg: "#99f6e4" },
  { name: "Серый", value: "#e2e8f0", bg: "#e2e8f0" },
  { name: "Лаймовый", value: "#d9f99d", bg: "#d9f99d" },
  { name: "Персиковый", value: "#ffedd5", bg: "#ffedd5" },
]

const readFileAsDataUrl = (file: File): Promise<string> => {
  if (
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    file.size > 2 * 1024 * 1024
  ) {
    return Promise.resolve(URL.createObjectURL(file))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Не удалось прочитать файл"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
const readImageAsDataUrl = readFileAsDataUrl

function ColorPickerMenu({
  title,
  currentColor,
  presetColors,
  onSelect,
  onClear,
  children,
  isOpen,
  setIsOpen,
}: {
  title: string
  currentColor?: string
  presetColors: { name: string; value: string; bg?: string }[]
  onSelect: (color: string) => void
  onClear: () => void
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const [hexValue, setHexValue] = useState(currentColor || "")

  useEffect(() => {
    if (isOpen) {
      setHexValue(currentColor || "")
    }
  }, [isOpen, currentColor])

  const isValidHex = (val: string) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val)

  const handleApply = (colorToApply: string) => {
    onSelect(colorToApply)
    setIsOpen(false)
  }

  const handleCustomSubmit = () => {
    let val = hexValue.trim()
    if (!val) return
    if (!val.startsWith("#") && /^[0-9a-f]{3,6}$/i.test(val)) {
      val = `#${val}`
    }
    if (isValidHex(val) || /^rgb/i.test(val)) {
      handleApply(val)
    } else {
      toast.error("Неверный формат цвета. Введите HEX (например, #2563EB)")
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-3 shadow-xl rounded-xl border bg-popover"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <button
            type="button"
            onClick={() => {
              onClear()
              setIsOpen(false)
            }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Сбросить</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {presetColors.map((preset) => {
            const isNone =
              preset.value === "inherit" || preset.value === "transparent"
            const isSelected =
              currentColor?.toLowerCase() === preset.value.toLowerCase()

            return (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                onClick={() => handleApply(preset.value)}
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-all hover:scale-110 cursor-pointer shadow-2xs",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border-border/60 hover:border-foreground/40",
                  isNone && "bg-background"
                )}
                style={{
                  backgroundColor: !isNone
                    ? preset.bg || preset.value
                    : undefined,
                }}
              >
                {isNone ? (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ∅
                  </span>
                ) : isSelected ? (
                  <Check
                    size={12}
                    className={
                      preset.value === "#000000" ||
                      preset.value === "#334155" ||
                      preset.value === "#4f46e5" ||
                      preset.value === "#9333ea"
                        ? "text-white"
                        : "text-foreground"
                    }
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="space-y-1.5 pt-1 border-t">
          <label className="text-[11px] font-medium text-muted-foreground block">
            Свой цвет (HEX)
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border shadow-2xs">
              <input
                type="color"
                value={isValidHex(hexValue) ? hexValue : "#2563eb"}
                onChange={(e) => setHexValue(e.target.value)}
                className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0 p-0"
                title="Палитра"
              />
            </div>
            <Input
              type="text"
              placeholder="#2563EB"
              value={hexValue}
              onChange={(e) => setHexValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomSubmit()
              }}
              className="h-8 font-mono text-xs uppercase"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCustomSubmit}
              className="h-8 px-2.5 text-xs font-medium cursor-pointer"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function LinkPopover({
  editor,
  isOpen,
  setIsOpen,
  children,
}: {
  editor: any
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const selectionRef = useRef<{ from: number; to: number } | null>(null)

  useEffect(() => {
    if (isOpen && editor) {
      const currentLink = editor.getAttributes("link").href || ""
      setUrl(currentLink)
      selectionRef.current = editor.state.selection
        ? { from: editor.state.selection.from, to: editor.state.selection.to }
        : null
    }
  }, [isOpen, editor])

  const handleApply = () => {
    const trimmed = url.trim()
    if (!trimmed) {
      handleRemove()
      return
    }
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    if (selectionRef.current && editor) {
      editor
        .chain()
        .setTextSelection(selectionRef.current)
        .focus()
        .extendMarkRange("link")
        .setLink({ href })
        .run()
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    toast.success("Ссылка сохранена")
    setIsOpen(false)
  }

  const handleRemove = () => {
    if (selectionRef.current && editor) {
      editor
        .chain()
        .setTextSelection(selectionRef.current)
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run()
    } else {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    }
    toast.success("Ссылка удалена")
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Вставить ссылку
            </span>
            {editor?.isActive("link") && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 text-[11px] text-destructive hover:underline cursor-pointer"
              >
                <Unlink size={11} />
                <span>Удалить ссылку</span>
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ImagePopover({
  isOpen,
  setIsOpen,
  onInsertImage,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertImage: (src: string, alt?: string) => void
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertImage(trimmed, "Изображение")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите файл изображения")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер файла не должен превышать ${uploadLimitMb} МБ`)
      return
    }
    readImageAsDataUrl(file)
      .then((src) => {
        onInsertImage(src, file.name)
        setIsOpen(false)
      })
      .catch(() => {
        toast.error("Не удалось прочитать файл")
      })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground">
            Вставить изображение
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <UploadCloud size={24} className="text-primary" />
            <span className="text-xs font-medium text-foreground">
              Загрузить с устройства
            </span>
            <span className="text-[11px] text-muted-foreground">
              PNG, JPG, WebP, GIF до {uploadLimitMb} МБ
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../image.png"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}

function VideoPopover({
  isOpen,
  setIsOpen,
  onInsertVideo,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertVideo: (src: string, title?: string) => void
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertVideo(trimmed, "Видео")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error("Пожалуйста, выберите видеофайл")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер видеофайла не должен превышать ${uploadLimitMb} МБ`)
      return
    }
    readFileAsDataUrl(file)
      .then((src) => {
        onInsertVideo(src, file.name)
        setIsOpen(false)
      })
      .catch(() => {
        toast.error("Не удалось прочитать видеофайл")
      })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Film size={14} className="text-primary" />
            <span>Вставить видео</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <UploadCloud size={24} className="text-primary" />
            <span className="text-xs font-medium text-foreground">
              Загрузить с устройства
            </span>
            <span className="text-[11px] text-muted-foreground">
              MP4, WebM, MOV, OGG до {uploadLimitMb} МБ
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по прямой ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../video.mp4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center bg-muted/40 rounded-md p-1.5">
            💡 Видео будет вставлено в место курсора. Также можно{" "}
            <span className="text-foreground font-medium">перетащить файл в редактор</span>.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AudioPopover({
  isOpen,
  setIsOpen,
  onInsertAudio,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertAudio: (src: string, title?: string) => void
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertAudio(trimmed, "Аудиозапись")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("audio/")) {
      toast.error("Пожалуйста, выберите аудиофайл")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер аудиофайла не должен превышать ${uploadLimitMb} МБ`)
      return
    }
    readFileAsDataUrl(file)
      .then((src) => {
        onInsertAudio(src, file.name)
        setIsOpen(false)
      })
      .catch(() => {
        toast.error("Не удалось прочитать аудиофайл")
      })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Music size={14} className="text-primary" />
            <span>Вставить аудиозапись</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <UploadCloud size={24} className="text-primary" />
            <span className="text-xs font-medium text-foreground">
              Загрузить с устройства
            </span>
            <span className="text-[11px] text-muted-foreground">
              MP3, WAV, OGG, M4A, AAC до {uploadLimitMb} МБ
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по прямой ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../audio.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function EditorPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const [previewMode, setPreviewMode] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [uploadLimitMb, setUploadLimitMb] = useState(1)
  const uploadLimitMbRef = useRef(uploadLimitMb)
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "initial">(
    "initial"
  )
  const [isTextColorOpen, setIsTextColorOpen] = useState(false)
  const [isHighlightOpen, setIsHighlightOpen] = useState(false)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isAudioOpen, setIsAudioOpen] = useState(false)

  useEffect(() => {
    uploadLimitMbRef.current = uploadLimitMb
  }, [uploadLimitMb])

  useEffect(() => {
    const accountId = organization?.id ?? user?.id
    if (!accountId) return

    void (async () => {
      const account = organization
        ? await getOrgById(accountId)
        : await getUserById(accountId)
      setUploadLimitMb(
        getPlanLimits(Number(account?.premium ?? 0), Boolean(organization)).uploadMb
      )
    })()
  }, [organization, user?.id])

  const selectionBackupRef = useRef<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !previewMode,
    extensions: [
      StarterKit.configure({
        heading: false,
        dropcursor: {
          color: "#2563eb",
          width: 2,
        },
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      CustomImage,
      CustomVideo,
      CustomAudio,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: starterContent,
    editorProps: {
      attributes: {
        class: "tiptap-prototype-content focus:outline-none",
        autocapitalize: "sentences",
        autocomplete: "off",
        autocorrect: "on",
        spellcheck: "true",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files.length > 0
        ) {
          const files = Array.from(event.dataTransfer.files)
          const mediaFiles = files.filter(
            (file) =>
              file.type.startsWith("image/") ||
              file.type.startsWith("video/") ||
              file.type.startsWith("audio/")
          )

          if (mediaFiles.length > 0) {
            event.preventDefault()
            event.stopPropagation()

            const coords = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })
            const insertPos = coords ? coords.pos : view.state.selection.from

            mediaFiles.forEach((file) => {
              if (file.type.startsWith("image/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Файл «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file)
                  .then((src) => {
                    view.dispatch(
                      view.state.tr.insert(
                        insertPos,
                        view.state.schema.nodes.image.create({
                          src,
                          alt: file.name,
                          width: "100%",
                          alignment: "center",
                          caption: "",
                        })
                      )
                    )
                    toast.success(`Изображение «${file.name}» добавлено`)
                  })
                  .catch(() => {
                    toast.error(`Ошибка при чтении файла «${file.name}»`)
                  })
              } else if (file.type.startsWith("video/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Видео «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file)
                  .then((src) => {
                    view.dispatch(
                      view.state.tr.insert(
                        insertPos,
                        view.state.schema.nodes.video.create({
                          src,
                          title: file.name,
                          width: "100%",
                          alignment: "center",
                          caption: "",
                        })
                      )
                    )
                    toast.success(`Видео «${file.name}» добавлено`)
                  })
                  .catch(() => {
                    toast.error(`Ошибка при чтении видео «${file.name}»`)
                  })
              } else if (file.type.startsWith("audio/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Аудио «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file)
                  .then((src) => {
                    view.dispatch(
                      view.state.tr.insert(
                        insertPos,
                        view.state.schema.nodes.audio.create({
                          src,
                          title: file.name,
                          alignment: "center",
                          caption: "",
                        })
                      )
                    )
                    toast.success(`Аудио «${file.name}» добавлено`)
                  })
                  .catch(() => {
                    toast.error(`Ошибка при чтении аудио «${file.name}»`)
                  })
              }
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event, slice) => {
        if (
          event.clipboardData &&
          event.clipboardData.files &&
          event.clipboardData.files.length > 0
        ) {
          const files = Array.from(event.clipboardData.files)
          const mediaFiles = files.filter(
            (file) =>
              file.type.startsWith("image/") ||
              file.type.startsWith("video/") ||
              file.type.startsWith("audio/")
          )

          if (mediaFiles.length > 0) {
            event.preventDefault()
            const insertPos = view.state.selection.from

            mediaFiles.forEach((file) => {
              if (file.type.startsWith("image/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Файл «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file).then((src) => {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.image.create({
                        src,
                        alt: file.name,
                        width: "100%",
                        alignment: "center",
                        caption: "",
                      })
                    )
                  )
                  toast.success("Изображение вставлено из буфера")
                })
              } else if (file.type.startsWith("video/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Видео «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file).then((src) => {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.video.create({
                        src,
                        title: file.name,
                        width: "100%",
                        alignment: "center",
                        caption: "",
                      })
                    )
                  )
                  toast.success("Видео вставлено из буфера")
                })
              } else if (file.type.startsWith("audio/")) {
                if (file.size > uploadLimitMbRef.current * 1024 * 1024) {
                  toast.error(`Аудио «${file.name}» превышает лимит ${uploadLimitMbRef.current} МБ`)
                  return
                }
                readFileAsDataUrl(file).then((src) => {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.audio.create({
                        src,
                        title: file.name,
                        alignment: "center",
                        caption: "",
                      })
                    )
                  )
                  toast.success("Аудио вставлено из буфера")
                })
              }
            })
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(currentEditor.getJSON())
        )
        setSaveStatus("saved")
      } catch (err) {
        console.error("Failed to save to localStorage:", err)
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!previewMode)
  }, [editor, previewMode])

  useEffect(() => {
    if (!editor) return
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("notter_tiptap_prototype_content")
    if (stored) {
      try {
        editor.commands.setContent(JSON.parse(stored))
        setSaveStatus("saved")
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [editor])

  const reset = () => {
    if (!editor) return
    editor.commands.setContent(starterContent)
    localStorage.removeItem(STORAGE_KEY)
    setSaveStatus("initial")
    toast.success("Редактор сброшен к начальному состоянию")
  }

  const copyJson = () => {
    if (!editor) return
    const jsonStr = JSON.stringify(editor.getJSON(), null, 2)
    navigator.clipboard.writeText(jsonStr)
    toast.success("JSON скопирован в буфер обмена")
  }

  if (!editor) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
        Загрузка редактора…
      </div>
    )
  }

  const currentTextColor = editor.getAttributes("textStyle").color as
    | string
    | undefined
  const currentHighlightColor = editor.getAttributes("highlight").color as
    | string
    | undefined

  const buttonClass = (active = false) =>
    cn(
      "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors cursor-pointer select-none",
      active
        ? "bg-primary/15 text-primary font-semibold hover:bg-primary/20"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  const getActiveBlockLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Заголовок 1"
    if (editor.isActive("heading", { level: 2 })) return "Заголовок 2"
    if (editor.isActive("heading", { level: 3 })) return "Заголовок 3"
    if (editor.isActive("heading", { level: 4 })) return "Заголовок 4"
    if (editor.isActive("heading", { level: 5 })) return "Заголовок 5"
    if (editor.isActive("blockquote")) return "Цитата"
    if (editor.isActive("codeBlock")) return "Блок кода"
    return "Обычный текст"
  }

  const text = editor.getText()
  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles size={12} />
              Tiptap 2.x
            </span>
            <span className="text-xs text-muted-foreground">
              Кастомный редактор
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Notter Editor V2
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Изменения сохраняются локально в вашем браузере.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyJson}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <Copy size={13} />
            <span>Копировать JSON</span>
          </Button>
          <label className="inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(event) => setPreviewMode(event.target.checked)}
              className="accent-primary"
            />
            Preview mode
          </label>
          <label className="inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!showToolbar}
              onChange={(event) => setShowToolbar(!event.target.checked)}
              className="accent-primary"
            />
            Отключить панель
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reset}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Сбросить</span>
          </Button>
        </div>
      </div>

      <section className="relative overflow-visible rounded-2xl border bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
        {showToolbar && (
        <div
          className={cn(
            "sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b bg-background/95 backdrop-blur-sm p-1.5 sm:gap-1",
            previewMode && "pointer-events-none opacity-60"
          )}
          role="toolbar"
          aria-label="Панель инструментов редактора"
        >
          <Hint description="Отменить (Ctrl+Z)">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={buttonClass()}
            >
              <Undo2 size={16} />
            </button>
          </Hint>
          <Hint description="Повторить (Ctrl+Shift+Z)">
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={buttonClass()}
            >
              <Redo2 size={16} />
            </button>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Type size={14} className="text-muted-foreground" />
                <span className="max-w-[90px] truncate sm:max-w-none">
                  {getActiveBlockLabel()}
                </span>
                <ChevronDown size={12} className="opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 p-1">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={cn(
                  "cursor-pointer text-xs",
                  !editor.isActive("heading") &&
                    !editor.isActive("blockquote") &&
                    !editor.isActive("codeBlock") &&
                    "font-semibold bg-accent"
                )}
              >
                Обычный текст
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("heading", { level: 1 }) &&
                    "font-semibold bg-accent"
                )}
              >
                <Heading1 size={14} className="mr-2" /> Заголовок 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("heading", { level: 2 }) &&
                    "font-semibold bg-accent"
                )}
              >
                <Heading2 size={14} className="mr-2" /> Заголовок 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("heading", { level: 3 }) &&
                    "font-semibold bg-accent"
                )}
              >
                <Heading3 size={14} className="mr-2" /> Заголовок 3
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("heading", { level: 4 }) &&
                    "font-semibold bg-accent"
                )}
              >
                <Heading4 size={14} className="mr-2" /> Заголовок 4
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 5 }).run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("heading", { level: 5 }) &&
                    "font-semibold bg-accent"
                )}
              >
                <Heading5 size={14} className="mr-2" /> Заголовок 5
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("blockquote") && "font-semibold bg-accent"
                )}
              >
                <Quote size={14} className="mr-2" /> Цитата
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleCodeBlock().run()
                }
                className={cn(
                  "cursor-pointer text-xs",
                  editor.isActive("codeBlock") && "font-semibold bg-accent"
                )}
              >
                <FileCode size={14} className="mr-2" /> Блок кода
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Hint description="Заголовок 1 (H1)">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={buttonClass(editor.isActive("heading", { level: 1 }))}
            >
              <Heading1 size={16} />
            </button>
          </Hint>
          <Hint description="Заголовок 2 (H2)">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={buttonClass(editor.isActive("heading", { level: 2 }))}
            >
              <Heading2 size={16} />
            </button>
          </Hint>
          <Hint description="Заголовок 3 (H3)">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={buttonClass(editor.isActive("heading", { level: 3 }))}
            >
              <Heading3 size={16} />
            </button>
          </Hint>
          <Hint description="Заголовок 4 (H4)">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              className={buttonClass(editor.isActive("heading", { level: 4 }))}
            >
              <Heading4 size={16} />
            </button>
          </Hint>
          <Hint description="Заголовок 5 (H5)">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 5 }).run()
              }
              className={buttonClass(editor.isActive("heading", { level: 5 }))}
            >
              <Heading5 size={16} />
            </button>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <Hint description="Полужирный (Ctrl+B)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={buttonClass(editor.isActive("bold"))}
            >
              <Bold size={16} />
            </button>
          </Hint>
          <Hint description="Курсив (Ctrl+I)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={buttonClass(editor.isActive("italic"))}
            >
              <Italic size={16} />
            </button>
          </Hint>
          <Hint description="Подчёркнутый (Ctrl+U)">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={buttonClass(editor.isActive("underline"))}
            >
              <UnderlineIcon size={16} />
            </button>
          </Hint>
          <Hint description="Зачёркнутый">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={buttonClass(editor.isActive("strike"))}
            >
              <Strikethrough size={16} />
            </button>
          </Hint>
          <Hint description="Встроенный код">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={buttonClass(editor.isActive("code"))}
            >
              <Code size={16} />
            </button>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <Hint description="Цвет текста">
            <div>
              <ColorPickerMenu
                title="Цвет текста"
                currentColor={currentTextColor}
                presetColors={TEXT_COLORS}
                isOpen={isTextColorOpen}
                setIsOpen={(open) => {
                  if (open && editor) {
                    selectionBackupRef.current = editor.state.selection
                      ? {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        }
                      : null
                  }
                  setIsTextColorOpen(open)
                }}
                onSelect={(color) => {
                  if (selectionBackupRef.current && editor) {
                    editor
                      .chain()
                      .setTextSelection(selectionBackupRef.current)
                      .focus()
                      .setColor(color)
                      .run()
                  } else {
                    editor.chain().focus().setColor(color).run()
                  }
                }}
                onClear={() => {
                  if (selectionBackupRef.current && editor) {
                    editor
                      .chain()
                      .setTextSelection(selectionBackupRef.current)
                      .focus()
                      .unsetColor()
                      .run()
                  } else {
                    editor.chain().focus().unsetColor().run()
                  }
                }}
              >
                <button
                  type="button"
                  className={cn(
                    buttonClass(editor.isActive("textStyle")),
                    "gap-0.5 px-1.5"
                  )}
                >
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="text-[13px] font-bold">A</span>
                    <span
                      className="h-1 w-3 rounded-full mt-0.5 transition-colors"
                      style={{
                        backgroundColor: currentTextColor || "currentColor",
                      }}
                    />
                  </div>
                  <ChevronDown size={11} className="opacity-60" />
                </button>
              </ColorPickerMenu>
            </div>
          </Hint>

          <Hint description="Цвет фона (выделение)">
            <div>
              <ColorPickerMenu
                title="Цвет фона текста"
                currentColor={currentHighlightColor}
                presetColors={HIGHLIGHT_COLORS}
                isOpen={isHighlightOpen}
                setIsOpen={(open) => {
                  if (open && editor) {
                    selectionBackupRef.current = editor.state.selection
                      ? {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        }
                      : null
                  }
                  setIsHighlightOpen(open)
                }}
                onSelect={(color) => {
                  if (selectionBackupRef.current && editor) {
                    editor
                      .chain()
                      .setTextSelection(selectionBackupRef.current)
                      .focus()
                      .setHighlight({ color })
                      .run()
                  } else {
                    editor.chain().focus().setHighlight({ color }).run()
                  }
                }}
                onClear={() => {
                  if (selectionBackupRef.current && editor) {
                    editor
                      .chain()
                      .setTextSelection(selectionBackupRef.current)
                      .focus()
                      .unsetHighlight()
                      .run()
                  } else {
                    editor.chain().focus().unsetHighlight().run()
                  }
                }}
              >
                <button
                  type="button"
                  className={cn(
                    buttonClass(editor.isActive("highlight")),
                    "gap-0.5 px-1.5"
                  )}
                >
                  <div className="flex items-center justify-center">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold border transition-colors"
                      style={{
                        backgroundColor:
                          currentHighlightColor || "rgba(254, 240, 138, 0.4)",
                        color: "currentColor",
                      }}
                    >
                      A
                    </span>
                  </div>
                  <ChevronDown size={11} className="opacity-60" />
                </button>
              </ColorPickerMenu>
            </div>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <Hint description="Маркированный список">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={buttonClass(editor.isActive("bulletList"))}
            >
              <List size={16} />
            </button>
          </Hint>
          <Hint description="Нумерованный список">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={buttonClass(editor.isActive("orderedList"))}
            >
              <ListOrdered size={16} />
            </button>
          </Hint>
          <Hint description="Чек-лист задач">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={buttonClass(editor.isActive("taskList"))}
            >
              <CheckSquare size={16} />
            </button>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <Hint description="Ссылка">
            <div>
              <LinkPopover
                editor={editor}
                isOpen={isLinkOpen}
                setIsOpen={setIsLinkOpen}
              >
                <button
                  type="button"
                  className={buttonClass(editor.isActive("link"))}
                >
                  <Link2 size={16} />
                </button>
              </LinkPopover>
            </div>
          </Hint>

          <Hint description="Вставить изображение в место курсора">
            <div>
              <ImagePopover
                isOpen={isImageOpen}
                uploadLimitMb={uploadLimitMb}
                setIsOpen={(open) => {
                  if (open && editor) {
                    selectionBackupRef.current = editor.state.selection
                      ? {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        }
                      : null
                  }
                  setIsImageOpen(open)
                }}
                onInsertImage={(src, alt) => {
                  const targetPos = selectionBackupRef.current
                    ? selectionBackupRef.current.from
                    : editor.state.selection.from

                  editor
                    .chain()
                    .focus()
                    .insertContentAt(targetPos, {
                      type: "image",
                      attrs: {
                        src,
                        alt: alt || "Изображение",
                        width: "100%",
                        alignment: "center",
                        caption: "",
                      },
                    })
                    .run()
                  toast.success("Изображение добавлено")
                }}
              >
                <button type="button" className={buttonClass(false)}>
                  <ImagePlus size={16} />
                </button>
              </ImagePopover>
            </div>
          </Hint>

          <Hint description="Вставить видео в место курсора">
            <div>
              <VideoPopover
                isOpen={isVideoOpen}
                uploadLimitMb={uploadLimitMb}
                setIsOpen={(open) => {
                  if (open && editor) {
                    selectionBackupRef.current = editor.state.selection
                      ? {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        }
                      : null
                  }
                  setIsVideoOpen(open)
                }}
                onInsertVideo={(src, title) => {
                  const targetPos = selectionBackupRef.current
                    ? selectionBackupRef.current.from
                    : editor.state.selection.from

                  editor
                    .chain()
                    .focus()
                    .insertContentAt(targetPos, {
                      type: "video",
                      attrs: {
                        src,
                        title: title || "Видео",
                        width: "100%",
                        alignment: "center",
                        caption: "",
                      },
                    })
                    .run()
                  toast.success("Видео добавлено")
                }}
              >
                <button type="button" className={buttonClass(false)}>
                  <VideoIcon size={16} />
                </button>
              </VideoPopover>
            </div>
          </Hint>

          <Hint description="Вставить аудио в место курсора">
            <div>
              <AudioPopover
                isOpen={isAudioOpen}
                uploadLimitMb={uploadLimitMb}
                setIsOpen={(open) => {
                  if (open && editor) {
                    selectionBackupRef.current = editor.state.selection
                      ? {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        }
                      : null
                  }
                  setIsAudioOpen(open)
                }}
                onInsertAudio={(src, title) => {
                  const targetPos = selectionBackupRef.current
                    ? selectionBackupRef.current.from
                    : editor.state.selection.from

                  editor
                    .chain()
                    .focus()
                    .insertContentAt(targetPos, {
                      type: "audio",
                      attrs: {
                        src,
                        title: title || "Аудиозапись",
                        alignment: "center",
                        caption: "",
                      },
                    })
                    .run()
                  toast.success("Аудиозапись добавлена")
                }}
              >
                <button type="button" className={buttonClass(false)}>
                  <Music size={16} />
                </button>
              </AudioPopover>
            </div>
          </Hint>

          <Hint description="Цитата">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={buttonClass(editor.isActive("blockquote"))}
            >
              <Quote size={16} />
            </button>
          </Hint>
          <Hint description="Разделительная линия">
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className={buttonClass(false)}
            >
              <Minus size={16} />
            </button>
          </Hint>

          <span className="mx-1 h-5 w-px bg-border/70" />

          <Hint description="Очистить форматирование">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().clearNodes().unsetAllMarks().run()
              }
              className={buttonClass(false)}
            >
              <RemoveFormatting size={16} />
            </button>
          </Hint>
        </div>
        )}

        <div
          onClick={() => {
            if (!editor.isFocused && !previewMode) {
              editor.commands.focus()
            }
          }}
          className={cn("cursor-text", previewMode && "preview-mode select-text")}
        >
          <EditorContent editor={editor} />
        </div>

        <div className="flex min-h-10 items-center justify-between rounded-b-2xl border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} {wordCount === 1 ? "слово" : "слов"}
            </span>
            <span>·</span>
            <span>{charCount} символов</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              JSON: {JSON.stringify(editor.getJSON()).length} байт
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            {saveStatus === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Сохранено локально</span>
              </span>
            ) : (
              <span>Пример</span>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
