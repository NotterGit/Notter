"use client"

import { useEffect, useState } from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextStyle from "@tiptap/extension-text-style"
import toast from "react-hot-toast"
import { Sparkles, Copy, RotateCcw, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getOrgById } from "@/api/org"
import { getUserById } from "@/api/user"
import { getPlanLimits } from "@/lib/plan-limits"

import { CustomImage } from "@/components/editor/extensions/custom-image"
import { CustomVideo } from "@/components/editor/extensions/custom-video"
import { CustomAudio } from "@/components/editor/extensions/custom-audio"
import { AiIndicatorExtension } from "@/components/editor/extensions/ai-indicator"
import { EditorToolbar } from "@/components/editor/toolbar/editor-toolbar"

import { CoverBanner } from "@/components/editor/cover-banner"
import { CoverModal } from "@/components/editor/cover-modal"
import { EditorHeader } from "@/components/editor/editor-header"

export interface DocumentMeta {
  title: string
  icon: string | null
  coverImage: string | null
}

const DEFAULT_META: DocumentMeta = {
  title: "Проверка кастомного редактора Tiptap",
  icon: "📝",
  coverImage: "/defaults/default-cover.svg",
}

const STORAGE_KEY = "notter-tiptap-prototype-v3"
const META_STORAGE_KEY = "notter-tiptap-prototype-meta-v2"

const starterContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Полнофункциональный редактор с удобной палитрой цветов, поддержкой перетаскивания картинок, заголовками H1–H5, обложками и эмодзи.",
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
              content: [{ type: "text", text: "Сделана поддержка H4 и H5 в тулбаре и в меню" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Полная палитра текста и выделения с кастомным HEX" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Кастомные медиа-блоки (фото, видео, аудио) с ресайзом и DnD" }],
            },
          ],
        },
      ],
    },
  ],
}

export default function EditorPrototypePage() {
  const { user } = useUser()
  const { organization } = useOrganization()

  const [meta, setMeta] = useState<DocumentMeta>(DEFAULT_META)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [saveStatus, setSaveStatus] = useState<"initial" | "saved">("initial")
  const [uploadLimitMb, setUploadLimitMb] = useState(10)

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
      AiIndicatorExtension,
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
    },
    onUpdate: ({ editor: currentEditor }) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEditor.getJSON()))
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

  const updateMeta = (partial: Partial<DocumentMeta>) => {
    setMeta((prev) => {
      const updated = { ...prev, ...partial }
      try {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  useEffect(() => {
    try {
      const storedMeta = localStorage.getItem(META_STORAGE_KEY)
      if (storedMeta) {
        setMeta(JSON.parse(storedMeta))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      const currentTitle = meta.title.trim()
      document.title = currentTitle ? `${currentTitle} | Notter Editor` : "Notter Editor V2"
    }
  }, [meta.title])

  useEffect(() => {
    if (!editor) return
    const stored =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("notter_tiptap_prototype_content")
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
    setMeta(DEFAULT_META)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(META_STORAGE_KEY)
    } catch {}
    setSaveStatus("initial")
    toast.success("Редактор и свойства заметки сброшены к начальному состоянию")
  }

  const copyJson = () => {
    if (!editor) return
    const exportData = {
      meta,
      content: editor.getJSON(),
    }
    const jsonStr = JSON.stringify(exportData, null, 2)
    navigator.clipboard.writeText(jsonStr)
    toast.success("JSON заметки скопирован в буфер обмена")
  }

  if (!editor) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
        Загрузка редактора…
      </div>
    )
  }

  const text = editor.getText()
  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <main className="mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] px-4 py-6 sm:px-8 sm:py-10 transition-all">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles size={12} />
              Tiptap 2.x
            </span>
            <span className="text-xs text-muted-foreground">Кастомный редактор</span>
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
        <CoverBanner
          coverUrl={meta.coverImage}
          preview={previewMode}
          onOpenModal={() => setIsCoverModalOpen(true)}
          onRemoveCover={() => updateMeta({ coverImage: null })}
        />

        <EditorHeader
          title={meta.title}
          onChangeTitle={(title) => updateMeta({ title })}
          icon={meta.icon}
          onChangeIcon={(icon) => updateMeta({ icon })}
          onRemoveIcon={() => updateMeta({ icon: null })}
          hasCover={Boolean(meta.coverImage)}
          onAddCover={() => setIsCoverModalOpen(true)}
          preview={previewMode}
          onEnterPress={() => {
            if (editor) {
              editor.chain().focus("start").run()
            }
          }}
        />

        {showToolbar && (
          <EditorToolbar
            editor={editor}
            uploadLimitMb={uploadLimitMb}
            className={cn("top-0", previewMode && "pointer-events-none opacity-60")}
          />
        )}

        <div
          onClick={() => {
            if (!editor.isFocused && !previewMode) {
              editor.commands.focus()
            }
          }}
          className={cn("cursor-text p-4", previewMode && "preview-mode select-text")}
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

      <CoverModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        currentCoverUrl={meta.coverImage}
        onSelectCover={(url) => updateMeta({ coverImage: url })}
        onRemoveCover={() => updateMeta({ coverImage: null })}
      />
    </main>
  )
}
