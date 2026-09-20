"use client" 

import { useMutation, useQuery } from "convex/react" 
import { Clock, Loader2, Search, Trash, Undo } from "lucide-react" 
import { useParams, useRouter } from "next/navigation" 
import { useEffect, useState } from "react" 
import { toast } from "react-hot-toast"
import { api } from "../../../../convex/_generated/api" 
import { Id } from "../../../../convex/_generated/dataModel" 
import { Input } from "@/components/ui/input" 
import { ConfirmModal } from "@/components/modal/confirm-modal" 
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { pages } from "@/config/routing/pages.route"
import {
  DEFAULT_RETENTION_DAYS,
  formatTimeRemaining,
  getNextCleanupTime,
  getRemainingArchiveTime,
  pluralize,
} from "@/lib/archive"

export function TrashBox(){
  const router = useRouter() 
  const params = useParams() 
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const orgId = organization?.id !== undefined ? organization?.id as string : user?.id as string
  const documents = useQuery(api.document.getTrash, {
    userId: orgId
  })
  const archiveSettings = useQuery(
    api.document.getArchiveSettings,
    orgId ? { userId: orgId } : "skip"
  )
  const restore = useMutation(api.document.restore) 
  const remove = useMutation(api.document.remove) 
  const cleanExpiredTrash = useMutation(api.document.cleanExpiredTrash)

  const [search, setSearch] = useState("") 
  const [now, setNow] = useState<number>(Date.now())

  const retentionDays = archiveSettings?.retentionDays ?? DEFAULT_RETENTION_DAYS

  // Clean expired documents on mount
  useEffect(() => {
    if (orgId) {
      cleanExpiredTrash({ userId: orgId }).catch(() => {})
    }
  }, [orgId, cleanExpiredTrash])

  // Update timer every 10 seconds for a live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const nextCleanupMs = getNextCleanupTime(documents ?? [], retentionDays, now)

  // Auto-clean if a document expired while viewer is open
  useEffect(() => {
    if (nextCleanupMs !== null && nextCleanupMs <= 0 && orgId) {
      cleanExpiredTrash({ userId: orgId }).catch(() => {})
    }
  }, [nextCleanupMs, orgId, cleanExpiredTrash])

  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase()) 
  }) 

  const onClick = (documentId: string) => {
    router.push(pages.DASHBOARD(documentId)) 
  } 

  const onRestore = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    documentId: Id<"documents">,
  ) => {
    event.stopPropagation() 
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут восстанавливать заметки")
      return
    }

    const promise = restore({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
      loading: "Восстановляем...",
      success: "Заметка восстановлена!",
      error: "Не удалось восстановить",
    }) 
  } 

  const onRemove = (documentId: Id<"documents">) => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут удалять заметки")
      return
    }

    const promise = remove({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
      loading: "Удаляем заметку...",
      success: "Заметка удалена!",
      error: "Не удалось удалить",
    }) 

    if (params.documentId === documentId) {
      router.push(pages.DASHBOARD()) 
    }
  }

  const removeAll = async () => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут очищать архив")
      return
    }

    if (!documents || documents.length === 0) return

    router.push(pages.DASHBOARD())

    const promise = Promise.all(
      documents.map((document) =>
        remove({
          id: document._id,
          userId: orgId,
        })
      )
    )

    toast.promise(promise, {
      loading: "Очищаем...",
      success: "Архив очищен!",
      error: "Не удалось очистить",
    }) 
  }

  if (documents === undefined) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        aria-busy="true"
        aria-label="Загрузка..."
      >
        <Loader2 className="w-8 h-8 animate-spin"/>
      </div>
    ) 
  }

  return (
    <section className="flex h-full flex-col text-sm">
      <div className="flex items-center gap-x-2 border-b border-black/5 p-3 dark:border-white/10">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 rounded-lg border-border/60 bg-background/70 px-3 focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Поиск заметок по названию"
          aria-label="Поиск заметок по названию"
        />
      </div>

      <div className="mx-2 my-2 flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="h-3.5 w-3.5 text-logo-yellow shrink-0" />
          {documents && documents.length > 0 && nextCleanupMs !== null ? (
            <span className="truncate">
              До ближайщей очистки: <strong className="font-semibold text-foreground">{formatTimeRemaining(nextCleanupMs)}</strong>
            </span>
          ) : (
            <span>
              Срок хранения: <strong className="font-semibold text-foreground">{retentionDays} {pluralize(retentionDays, "день", "дня", "дней")}</strong>
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground/70 ml-2">
          {documents && documents.length > 0 ? `(${retentionDays} дн.)` : "Архив пуст"}
        </span>
      </div>

      <div
        className="mt-1 px-1 pb-1 flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        {filteredDocuments?.length === 0 && (
          <p className="pb-2 text-center text-xs text-muted-foreground">
            Ничего не найдено
          </p>
        )}
        {filteredDocuments?.map((document) => {
          const docRemainingMs = getRemainingArchiveTime(document, retentionDays, now)
          const compactTime = formatTimeRemaining(docRemainingMs, true)
          const fullTime = formatTimeRemaining(docRemainingMs, false)

          return (
            <button
              key={document._id}
              onClick={() => onClick(document._id)}
              className="flex w-full items-center justify-between rounded-lg px-1 text-sm text-primary transition hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Заметки"
            >
              <div className="flex items-center gap-2 truncate pl-2 my-3 min-w-0">
                <span className="truncate">{document.title}</span>
                <span
                  title={`До удаления заметки: ${fullTime}`}
                  className="shrink-0 rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {compactTime}
                </span>
              </div>
              <div className="flex items-center shrink-0">
                {isAdmin && (
                  <>
                    <button
                      onClick={(e) => onRestore(e, document._id)}
                      className="rounded-md p-2 hover:bg-background/80"
                      aria-label="Восстановить заметку"
                    >
                      <Undo className="h-4 w-4 text-muted-foreground " />
                    </button>
                    <ConfirmModal onConfirm={() => onRemove(document._id)}>
                      <button
                        className="rounded-md p-2 hover:bg-background/80"
                        aria-label="Удалить безвозвратно"
                      >
                        <Trash className="h-4 w-4 text-muted-foreground"/>
                      </button>
                    </ConfirmModal>
                  </>
                )}
              </div>
            </button>
          )
        })}
        
        {isAdmin && filteredDocuments?.length !== 0 && (
          <>
            <Separator className="my-2"/>
            <ConfirmModal onConfirm={() => removeAll()}>
              <div className="flex justify-center items-center">
                <Button className="h-8 w-40 rounded-lg">
                  Очистить <Trash/>
                </Button>
              </div>
            </ConfirmModal>
          </>
        )}
      </div>
    </section>
  ) 
} 