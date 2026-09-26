"use client"

import React, { useRef, useState } from "react"
import { type Editor } from "@tiptap/react"
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
  ImagePlus,
  Video as VideoIcon,
  Music,
  ChevronDown,
  Undo2,
  Redo2,
  Quote,
  Minus,
  RemoveFormatting,
  Sparkles,
  Type,
  FileCode,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hint } from "@/components/ui/hint"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import {
  DEFAULT_UPLOAD_LIMIT_MB,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from "@/config/const/editor.const"
import type { EditorToolbarProps } from "@/config/types/editor.types"
import { ColorPickerMenu } from "./color-picker"
import { LinkPopover } from "./link-popover"
import { ImagePopover, VideoPopover, AudioPopover } from "./media-popovers"
import { AiGeneratePopover } from "./ai-generate-popover"
import { aiIndicatorPluginKey } from "../extensions/ai-indicator"

export function EditorToolbar({
  editor,
  uploadLimitMb = DEFAULT_UPLOAD_LIMIT_MB,
  onUploadFile,
  className,
}: EditorToolbarProps) {
  const [isTextColorOpen, setIsTextColorOpen] = useState(false)
  const [isHighlightOpen, setIsHighlightOpen] = useState(false)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isAudioOpen, setIsAudioOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)

  const selectionBackupRef = useRef<{ from: number; to: number } | null>(null)

  if (!editor) return null

  const currentTextColor = editor.getAttributes("textStyle").color as string | undefined
  const currentHighlightColor = editor.getAttributes("highlight").color as string | undefined

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

  return (
    <div
      className={cn(
        "sticky top-12 z-20 flex flex-wrap items-center gap-0.5 border-y bg-background/95 backdrop-blur-sm p-1.5 sm:gap-1 transition-all",
        className
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
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("heading", { level: 1 }) && "font-semibold bg-accent"
            )}
          >
            <Heading1 size={14} className="mr-2" /> Заголовок 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("heading", { level: 2 }) && "font-semibold bg-accent"
            )}
          >
            <Heading2 size={14} className="mr-2" /> Заголовок 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("heading", { level: 3 }) && "font-semibold bg-accent"
            )}
          >
            <Heading3 size={14} className="mr-2" /> Заголовок 3
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("heading", { level: 4 }) && "font-semibold bg-accent"
            )}
          >
            <Heading4 size={14} className="mr-2" /> Заголовок 4
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("heading", { level: 5 }) && "font-semibold bg-accent"
            )}
          >
            <Heading5 size={14} className="mr-2" /> Заголовок 5
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "cursor-pointer text-xs",
              editor.isActive("blockquote") && "font-semibold bg-accent"
            )}
          >
            <Quote size={14} className="mr-2" /> Цитата
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={buttonClass(editor.isActive("heading", { level: 1 }))}
        >
          <Heading1 size={16} />
        </button>
      </Hint>
      <Hint description="Заголовок 2 (H2)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={buttonClass(editor.isActive("heading", { level: 2 }))}
        >
          <Heading2 size={16} />
        </button>
      </Hint>
      <Hint description="Заголовок 3 (H3)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={buttonClass(editor.isActive("heading", { level: 3 }))}
        >
          <Heading3 size={16} />
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
              className={cn(buttonClass(editor.isActive("textStyle")), "gap-0.5 px-1.5")}
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
              className={cn(buttonClass(editor.isActive("highlight")), "gap-0.5 px-1.5")}
            >
              <div className="flex items-center justify-center">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold border transition-colors"
                  style={{
                    backgroundColor: currentHighlightColor || "rgba(254, 240, 138, 0.4)",
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
            onUploadFile={onUploadFile}
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
            onUploadFile={onUploadFile}
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
            onUploadFile={onUploadFile}
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

      <Hint description="Сгенерировать с помощью ИИ">
        <div>
          <AiGeneratePopover
            editor={editor}
            isOpen={isAiOpen}
            setIsOpen={(open) => {
              if (open && editor) {
                const pluginState = aiIndicatorPluginKey.getState(editor.state)
                if (!pluginState?.isGenerating) {
                  selectionBackupRef.current = editor.state.selection
                    ? {
                        from: editor.state.selection.from,
                        to: editor.state.selection.to,
                      }
                    : null
                }
              }
              setIsAiOpen(open)
            }}
            selectionBackupRef={selectionBackupRef}
          >
            <button
              type="button"
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-all cursor-pointer select-none gap-1.5 border shadow-xs",
                isAiOpen
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-violet-500/60 shadow-violet-500/25 shadow-md font-semibold"
                  : "bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-indigo-500/15 hover:from-violet-500/25 hover:via-purple-500/20 hover:to-indigo-500/25 text-violet-600 dark:text-violet-300 border-violet-500/35 hover:border-violet-500/55 hover:shadow-xs"
              )}
            >
              <Sparkles
                size={14}
                className={cn(
                  "transition-transform",
                  isAiOpen ? "text-white scale-105" : "text-violet-500 dark:text-violet-400"
                )}
              />
              <span className="text-xs font-semibold hidden sm:inline">ИИ</span>
            </button>
          </AiGeneratePopover>
        </div>
      </Hint>
    </div>
  )
}
