"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
import { useOrganization, useUser } from "@clerk/nextjs"
import toast from "react-hot-toast"
import { CheckCircle2 } from "lucide-react"

import { getUserById } from "@/api/user"
import { getOrgById } from "@/api/org"
import { uploadFile as uploadFileOnServer } from "@/api/files"
import { normalizeContentUrls } from "@/lib/image-url"
import { getPlanLimits } from "@/lib/plan-limits"
import { cn } from "@/lib/utils"
import type { EditorProps } from "@/config/types/components.types"
import { convertBlockNoteToTiptap } from "../../convex/migrateBlocknote"

import { CustomImage } from "./editor/extensions/custom-image"
import { CustomVideo } from "./editor/extensions/custom-video"
import { CustomAudio } from "./editor/extensions/custom-audio"
import { AiIndicatorExtension } from "./editor/extensions/ai-indicator"
import { EditorToolbar } from "./editor/toolbar/editor-toolbar"

export default function Editor({
  onChange,
  initialContent,
  editable = true,
  documentId,
  className,
  showFooter,
  saveStatus = "idle",
  onEditorReady,
}: EditorProps) {
  const { user } = useUser()
  const { organization } = useOrganization()
  const isOrg = organization?.id !== undefined
  const orgId = isOrg ? (organization?.id as string) : (user?.id as string)
  const avatar = user?.imageUrl || ""
  const username = user?.username || ""

  const [uploadLimitMb, setUploadLimitMb] = useState(10)
  const uploadLimitMbRef = useRef(uploadLimitMb)
  uploadLimitMbRef.current = uploadLimitMb

  const isMountedRef = useRef(false)
  const currentDocIdRef = useRef(documentId)

  // Fetch upload size limit according to plan
  useEffect(() => {
    if (!orgId) return

    void (async () => {
      try {
        const account = isOrg
          ? await getOrgById(orgId)
          : await getUserById(orgId)
        const limit = getPlanLimits(Number(account?.premium ?? 0), isOrg).uploadMb
        setUploadLimitMb(limit)
      } catch {
        setUploadLimitMb(10)
      }
    })()
  }, [orgId, isOrg])

  // Real upload function to S3
  const handleUpload = useCallback(
    async (file: File): Promise<string> => {
      if (!orgId || !documentId) {
        throw new Error("Не указан идентификатор документа или пользователя")
      }

      let userSize = uploadLimitMbRef.current
      try {
        const userdata = isOrg
          ? await getOrgById(orgId)
          : await getUserById(orgId)
        userSize = getPlanLimits(Number(userdata?.premium ?? 0), isOrg).uploadMb
      } catch {
        // Fallback to ref limit
      }

      const maxSize = userSize * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`Размер файла не может превышать ${userSize} МБ`)
        throw new Error("File too large")
      }

      const toastId = toast.loading(`Загрузка ${file.name}…`)
      try {
        const url = await uploadFileOnServer(orgId, documentId, avatar, username, file)
        if (!url) {
          toast.error("Не удалось загрузить файл", { id: toastId })
          throw new Error("Upload failed")
        }
        toast.success("Файл успешно загружен", { id: toastId })
        return url
      } catch (err) {
        toast.error("Ошибка при загрузке файла", { id: toastId })
        throw err
      }
    },
    [orgId, documentId, isOrg, avatar, username]
  )

  // Prepare initial content safely (converts BlockNote JSON or returns Tiptap doc)
  const getInitialDoc = useCallback((raw?: string) => {
    if (!raw) {
      return {
        type: "doc",
        content: [{ type: "paragraph" }],
      }
    }
    const converted = convertBlockNoteToTiptap(raw)
    return normalizeContentUrls(converted)
  }, [])

  const [starterDoc] = useState(() => getInitialDoc(initialContent))

  const editor = useEditor({
    immediatelyRender: false,
    editable,
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
    content: starterDoc,
    editorProps: {
      attributes: {
        class: "tiptap-prototype-content focus:outline-none min-h-[300px]",
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

            mediaFiles.forEach(async (file) => {
              try {
                let url: string
                if (orgId && documentId) {
                  url = await handleUpload(file)
                } else {
                  url = URL.createObjectURL(file)
                }

                if (file.type.startsWith("image/")) {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.image.create({
                        src: url,
                        alt: file.name,
                        caption: "",
                        width: "100%",
                        alignment: "center",
                      })
                    )
                  )
                } else if (file.type.startsWith("video/")) {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.video.create({
                        src: url,
                        title: file.name,
                        caption: "",
                        width: "100%",
                        alignment: "center",
                      })
                    )
                  )
                } else if (file.type.startsWith("audio/")) {
                  view.dispatch(
                    view.state.tr.insert(
                      insertPos,
                      view.state.schema.nodes.audio.create({
                        src: url,
                        title: file.name,
                        caption: "",
                        alignment: "center",
                      })
                    )
                  )
                }
              } catch (err) {
                console.error("Drop upload failed:", err)
              }
            })
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const jsonStr = JSON.stringify(currentEditor.getJSON())
      onChange(jsonStr)
    },
  })

  // Synchronize editable state
  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  // Synchronize when documentId changes (switching documents)
  useEffect(() => {
    if (!editor) return
    if (currentDocIdRef.current !== documentId) {
      currentDocIdRef.current = documentId
      const newDoc = getInitialDoc(initialContent)
      editor.commands.setContent(newDoc, false)
    }
  }, [editor, documentId, initialContent, getInitialDoc])

  // Initial mount marker
  useEffect(() => {
    isMountedRef.current = true
  }, [])

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  if (!editor) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Загрузка редактора…
      </div>
    )
  }

  const text = editor.getText()
  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const shouldShowFooter = showFooter !== undefined ? showFooter : editable

  return (
    <div className={cn("relative w-full", className, !editable && "preview-mode select-text")}>
      {editable && (
        <EditorToolbar
          editor={editor}
          uploadLimitMb={uploadLimitMb}
          onUploadFile={handleUpload}
          className="sticky top-12 z-20 border-y bg-background/95 backdrop-blur-sm px-4 sm:px-6 md:px-10"
        />
      )}

      <div
        onClick={() => {
          if (!editor.isFocused && editable) {
            editor.commands.focus()
          }
        }}
        className={cn(
          "cursor-text px-4 sm:px-6 md:px-10 py-6 min-h-[350px]",
          !editable && "preview-mode select-text cursor-default"
        )}
      >
        <EditorContent editor={editor} />
      </div>

      {shouldShowFooter && (
        <div className="flex min-h-10 items-center justify-between rounded-b-2xl border-t bg-muted/20 px-4 sm:px-6 md:px-10 py-2.5 text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} {wordCount === 1 ? "слово" : "слов"}
            </span>
            <span>·</span>
            <span>{charCount} символов</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Сохранено</span>
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-muted-foreground animate-pulse">
                <span>Сохранение…</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
