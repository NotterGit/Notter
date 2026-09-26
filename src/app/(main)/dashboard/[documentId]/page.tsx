"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import toast from "react-hot-toast"

import { api } from "../../../../../convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"
import Error404 from "@/app/not-found"
import { isValidConvexId } from "@/lib/convex-id"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { getOrgById } from "@/api/org"
import { getUserById } from "@/api/user"
import { getPlanLimits } from "@/lib/plan-limits"
import { uploadFile, deleteFile } from "@/api/files"
import type { DashboardDocumentIdPageProps as DocumentIdPageProps } from "@/config/types/main.types"
import { SAVE_STATUS_IDLE_DELAY_MS, TITLE_DEBOUNCE_MS } from "@/config/const/editor.const"
import type { EditorSaveStatus } from "@/config/types/editor.types"

import { CoverBanner } from "@/components/editor/cover-banner"
import { CoverModal } from "@/components/editor/cover-modal"
import { EditorHeader } from "@/components/editor/editor-header"

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

export default function DocumentIdPage({ params }: DocumentIdPageProps) {
  const { documentId } = use(params)
  const normalizedDocumentId = isValidConvexId(documentId) ? documentId : null

  const { user } = useUser()
  const { organization } = useOrganization()
  const { isAuthenticated } = useConvexAuth()
  const isOrg = organization?.id !== undefined
  const orgId = isOrg ? organization.id : (user?.id as string)
  const avatar = user?.imageUrl || ""
  const username = user?.username || ""

  const document = useQuery(
    api.document.getById,
    isAuthenticated && normalizedDocumentId && orgId
      ? {
          documentId: normalizedDocumentId,
          userId: orgId,
        }
      : "skip"
  )

  const update = useMutation(api.document.update)
  const removeIcon = useMutation(api.document.removeIcon)
  const removeCoverImage = useMutation(api.document.removeCoverImage)

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>("idle")
  const [localTitle, setLocalTitle] = useState("")

  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<any>(null)

  // Sync title from document
  useEffect(() => {
    if (document?.title !== undefined) {
      setLocalTitle(document.title)
      globalThis.document.title = `${document.title || "Новая заметка"} | Notter`
    }
  }, [document?.title])

  // Handle note content updates
  const onChange = useCallback(
    (content: string) => {
      if (!normalizedDocumentId || !orgId) return

      setSaveStatus("saving")
      update({
        id: normalizedDocumentId,
        content,
        userId: orgId,
        lastEditor: username,
        lastEditTime: getCurrentEditTime(),
      })
        .then(() => {
          setSaveStatus("saved")
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = setTimeout(() => {
            setSaveStatus("idle")
          }, SAVE_STATUS_IDLE_DELAY_MS)
        })
        .catch(() => {
          setSaveStatus("idle")
        })
    },
    [normalizedDocumentId, orgId, update, username]
  )

  // Handle title updates with smooth debouncing
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setLocalTitle(newTitle)
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      titleTimeoutRef.current = setTimeout(() => {
        if (!normalizedDocumentId || !orgId) return
        update({
          id: normalizedDocumentId,
          title: newTitle || "Новая заметка",
          userId: orgId,
          lastEditor: username,
          lastEditTime: getCurrentEditTime(),
        })
      }, TITLE_DEBOUNCE_MS)
    },
    [normalizedDocumentId, orgId, update, username]
  )

  // Handle icon updates
  const handleIconChange = useCallback(
    (icon: string) => {
      if (!normalizedDocumentId || !orgId) return
      update({
        id: normalizedDocumentId,
        icon,
        userId: orgId,
        lastEditor: username,
        lastEditTime: getCurrentEditTime(),
      })
    },
    [normalizedDocumentId, orgId, update, username]
  )

  // Handle icon removal
  const handleRemoveIcon = useCallback(() => {
    if (!normalizedDocumentId || !orgId) return
    removeIcon({
      id: normalizedDocumentId,
      userId: orgId,
    })
  }, [normalizedDocumentId, orgId, removeIcon])

  // Handle cover selection (preset or external link)
  const handleSelectCover = useCallback(
    (url: string) => {
      if (!normalizedDocumentId || !orgId) return
      update({
        id: normalizedDocumentId,
        coverImage: url,
        userId: orgId,
        lastEditor: username,
        lastEditTime: getCurrentEditTime(),
      })
    },
    [normalizedDocumentId, orgId, update, username]
  )

  // Handle cover removal
  const handleRemoveCover = useCallback(async () => {
    if (!normalizedDocumentId || !orgId) return

    if (document?.coverImage) {
      try {
        await deleteFile(orgId, document.coverImage)
      } catch (err) {
        console.error("Failed to delete cover file:", err)
      }
    }

    const promise = removeCoverImage({
      id: normalizedDocumentId,
      userId: orgId,
    })

    toast.promise(promise, {
      loading: "Удаление обложки...",
      success: "Обложка удалена",
      error: "Ошибка при удалении обложки",
    })
  }, [normalizedDocumentId, orgId, document?.coverImage, removeCoverImage])

  // Handle cover upload to server S3
  const handleUploadCoverFile = useCallback(
    async (file: File): Promise<string> => {
      if (!normalizedDocumentId || !orgId) {
        throw new Error("Missing document or user ID")
      }

      const userdata = isOrg ? await getOrgById(orgId) : await getUserById(orgId)
      const userSize = getPlanLimits(Number(userdata?.premium ?? 0), isOrg).uploadMb
      const maxSize = userSize * 1024 * 1024

      if (file.size > maxSize) {
        toast.error(`Размер файла не может превышать ${userSize} МБ`)
        throw new Error("File too large")
      }

      const fileUrl = await uploadFile(orgId, normalizedDocumentId, avatar, username, file)
      if (!fileUrl) {
        throw new Error("Upload failed")
      }

      await update({
        id: normalizedDocumentId,
        coverImage: fileUrl,
        userId: orgId,
        lastEditor: username,
        lastEditTime: getCurrentEditTime(),
      })

      return fileUrl
    },
    [normalizedDocumentId, orgId, isOrg, avatar, username, update]
  )

  if (normalizedDocumentId === null) {
    return <Error404 />
  }

  // Loading skeleton matching the new wide card layout
  if (document === undefined) {
    return (
      <div className="relative overflow-hidden pb-40">
        <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-logo-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />

        <main className="mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] px-4 py-6 sm:px-8 sm:py-10 transition-all">
          <section className="relative overflow-visible rounded-2xl border bg-card shadow-sm">
            <Skeleton className="h-48 sm:h-60 md:h-72 w-full rounded-t-2xl bg-muted/40" />
            <div className="px-4 sm:px-6 md:px-10 pb-4 pt-6">
              <Skeleton className="h-16 w-16 -mt-12 sm:-mt-14 mb-3 rounded-2xl bg-primary/10" />
              <Skeleton className="h-10 w-[45%] rounded-xl bg-primary/8 mt-4" />
            </div>
            <div className="border-y bg-background/95 p-3">
              <Skeleton className="h-7 w-full max-w-md rounded-lg bg-primary/8" />
            </div>
            <div className="space-y-3 px-4 sm:px-6 md:px-10 pt-3 pb-6 min-h-[350px]">
              <Skeleton className="h-5 w-[85%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[70%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[45%] rounded-full bg-primary/8" />
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (document === null) {
    return <Error404 />
  }

  const isArchived = Boolean(document.isAcrhived)

  return (
    <div className="relative pb-40">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-logo-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
      </div>

      <main className="mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] px-4 py-6 sm:px-8 sm:py-10 transition-all">
        <section className="relative overflow-visible rounded-2xl border bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <CoverBanner
            coverUrl={document.coverImage ?? null}
            preview={isArchived}
            onOpenModal={() => setIsCoverModalOpen(true)}
            onRemoveCover={handleRemoveCover}
          />

          <EditorHeader
            title={localTitle}
            onChangeTitle={handleTitleChange}
            icon={document.icon ?? null}
            onChangeIcon={handleIconChange}
            onRemoveIcon={handleRemoveIcon}
            hasCover={Boolean(document.coverImage)}
            onAddCover={() => setIsCoverModalOpen(true)}
            preview={isArchived}
            onEnterPress={() => {
              if (editorRef.current) {
                editorRef.current.chain().focus("start").run()
              }
            }}
          />

          <Editor
            initialContent={document.content}
            onChange={onChange}
            editable={!isArchived}
            documentId={document._id}
            saveStatus={saveStatus}
            onEditorReady={(editor) => {
              editorRef.current = editor
            }}
          />
        </section>

        <CoverModal
          isOpen={isCoverModalOpen}
          onClose={() => setIsCoverModalOpen(false)}
          currentCoverUrl={document.coverImage ?? null}
          onSelectCover={handleSelectCover}
          onRemoveCover={handleRemoveCover}
          onUploadFile={handleUploadCoverFile}
        />
      </main>
    </div>
  )
}
