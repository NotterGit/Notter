"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { toast } from "react-hot-toast"
import Twemoji from "react-twemoji"
import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderRoot,
  Loader2,
  FileText ,
  Search,
  SlashSquare,
  X,
} from "lucide-react"


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMoveNote } from "@/components/hooks/use-move-note"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { buildChildrenMap, isDescendant } from "@/lib/document-tree"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { cn } from "@/lib/utils"

function matchesSearch(
  doc: Doc<"documents">,
  childrenMap: Map<string, Doc<"documents">[]>,
  query: string
): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  if (doc.title.toLowerCase().includes(q)) return true
  const children = childrenMap.get(doc._id) || []
  return children.some((child) => matchesSearch(child, childrenMap, q))
}

export function MoveNoteModal() {
  const { isOpen, documentId, onClose } = useMoveNote()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg } = useWorkspaceAdmin()

  const orgId = isOrg ? (organization?.id as string) : (user?.id as string)

  const documents = useQuery(
    api.document.getAllSidebar,
    isOpen && orgId ? { userId: orgId } : "skip"
  )

  const moveDocument = useMutation(api.document.move)

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentDoc = useMemo(() => {
    if (!documents || !documentId) return null
    return documents.find((d) => d._id === documentId) || null
  }, [documents, documentId])

  const childrenMap = useMemo(() => {
    return buildChildrenMap(documents)
  }, [documents])

  useEffect(() => {
    if (isOpen && currentDoc) {
      setSelectedTargetId(currentDoc.parentDocument ?? null)
      setSearchQuery("")
      setIsSubmitting(false)

      if (documents) {
        const initialExpanded: Record<string, boolean> = {}
        for (const doc of documents) {
          const children = childrenMap.get(doc._id) || []
          if (children.length > 0) {
            initialExpanded[doc._id] = true
          }
        }
        setExpanded(initialExpanded)
      }
    }
  }, [isOpen, currentDoc, documents, childrenMap])


  const toggleExpand = (docId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }))
  }

  const currentParentId = currentDoc?.parentDocument ?? null
  const isSameLocation = selectedTargetId === currentParentId

  const handleMove = async () => {
    if (!documentId || !currentDoc || isSameLocation || isSubmitting) return

    setIsSubmitting(true)

    const promise = moveDocument({
      id: documentId as Id<"documents">,
      parentDocument: selectedTargetId ? (selectedTargetId as Id<"documents">) : undefined,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    })

    toast.promise(promise, {
      loading: "Перемещение заметки...",
      success: "Заметка успешно перемещена!",
      error: "Не удалось переместить заметку",
    })

    try {
      await promise
      onClose()
    } catch {
    } finally {
      setIsSubmitting(false)
    }

  }

  const renderTree = (parentId: string, level: number): React.ReactNode => {
    const children = childrenMap.get(parentId) || []
    if (children.length === 0) return null

    return children.map((doc) => {
      const docChildren = childrenMap.get(doc._id) || []
      const hasChildren = docChildren.length > 0
      const isExpanded = Boolean(expanded[doc._id])
      const isSelf = doc._id === documentId
      const isChild = documentId ? isDescendant(documentId, doc._id, documents) : false
      const isDisabled = isSelf || isChild
      const isCurrentParent = currentParentId === doc._id
      const isSelected = selectedTargetId === doc._id

      if (searchQuery.trim() && !matchesSearch(doc, childrenMap, searchQuery)) {
        return null
      }

      return (
        <div key={doc._id} className="w-full">
          <div
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => {
              if (!isDisabled) {
                setSelectedTargetId(doc._id)
              }
            }}
            style={{ paddingLeft: `${level * 16 + 10}px` }}
            className={cn(
              "group flex min-h-[36px] w-full items-center rounded-xl py-1.5 pr-2 text-sm font-medium transition-colors select-none",
              isDisabled
                ? "opacity-40 cursor-not-allowed text-muted-foreground/60"
                : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground",
              isSelected &&
                !isDisabled &&
                "bg-logo-yellow/20 dark:bg-logo-yellow/25 text-foreground ring-1 ring-logo-yellow/50 font-semibold shadow-sm"
            )}
          >
            <div
              role="button"
              className="mr-1 rounded-md p-0.5 hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(doc._id)
              }}
            >
              {hasChildren ? (
                isExpanded || Boolean(searchQuery.trim()) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                )
              ) : (
                <span className="inline-block w-4 h-4" />
              )}
            </div>

            <div className="shrink-0 mr-2 text-[16px] flex items-center">
              {doc.icon ? (
                <Twemoji options={{ className: "twemoji" }}>{doc.icon}</Twemoji>
              ) : (
                <FileText  className="h-4 w-4 text-muted-foreground" />
              )}
            </div>


            <span className="truncate flex-1 text-left">
              <Twemoji options={{ className: "twemoji" }}>
                {doc.title || "Без названия"}
              </Twemoji>
            </span>

            {isSelf && (
              <span className="ml-2 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                текущая
              </span>
            )}
            {isChild && (
              <span className="ml-2 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                внутри
              </span>
            )}
            {isCurrentParent && !isDisabled && (
              <span className="ml-2 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                текущее
              </span>
            )}

            {isSelected && (
              <div className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-logo-yellow text-zinc-950 shadow-sm">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}
          </div>

          {(isExpanded || Boolean(searchQuery.trim())) && renderTree(doc._id, level + 1)}
        </div>
      )
    })
  }

  const isRootSelected = selectedTargetId === null
  const isRootCurrent = currentParentId === null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">
            Переместить заметку
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            {currentDoc ? (
              <span className="inline-flex items-center gap-1.5">
                Перемещение «{currentDoc.title || "Без названия"}»
              </span>
            ) : (
              "Выберите целевое расположение для заметки"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-xl border border-input bg-background/50 px-3 py-1.5 shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск заметки по названию..."
            className="h-6 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="rounded-md p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[380px] rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-2 space-y-1">
          {documents === undefined ? (
            <div className="flex h-44 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {(!searchQuery.trim() ||
                "корень верхний уровень root".includes(searchQuery.toLowerCase())) && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTargetId(null)}
                  className={cn(
                    "flex min-h-[38px] w-full items-center rounded-xl px-3 py-1.5 text-sm font-medium transition-colors select-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground",
                    isRootSelected &&
                      "bg-logo-yellow/20 dark:bg-logo-yellow/25 text-foreground ring-1 ring-logo-yellow/50 font-semibold shadow-sm"
                  )}
                >
                  <SlashSquare className="mr-2 h-4 w-4 text-logo-yellow shrink-0" />
                  <span className="truncate flex-1 text-left font-medium">
                    /
                  </span>

                  {isRootCurrent && (
                    <span className="ml-2 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                      текущее
                    </span>
                  )}

                  {isRootSelected && (
                    <div className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-logo-yellow text-zinc-950 shadow-sm">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              )}

              <div className="my-1 border-t border-black/5 dark:border-white/5" />

              {renderTree("root", 0)}

              {searchQuery.trim() &&
                !documents.some((d) =>
                  d.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
                ) && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Заметок не найдено
                  </div>
                )}
            </>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={isSameLocation || isSubmitting || !currentDoc}
            className="rounded-xl text-xs h-9"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {isSameLocation ? "Уже здесь" : "Переместить"}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
