"use client" 

import { Button } from "@/components/ui/button" 
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation" 
import { toast } from "react-hot-toast"
import { API } from "@/config/routing/api.route"
import { fetcher } from "@/lib/fetcher"
import { deleteDocument } from "@/actions/delete-document"
import { restoreDocument } from "@/actions/restore-document"
import { useAction } from "@/hooks/use-action"
import { ConfirmModal } from "@/components/modal/confirm-modal" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { pages } from "@/config/routing/pages.route"
import type { BannerProps } from "@/config/types/main.types";
import {
  DEFAULT_RETENTION_DAYS,
  formatTimeRemaining,
  getRemainingArchiveTime,
} from "@/lib/archive"

export function Banner({ documentId }: BannerProps){
  const router = useRouter() 
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const orgId = organization?.id !== undefined ? organization?.id as string : user?.id as string

  const { execute: executeRemove } = useAction(deleteDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "trash", orgId] })
      queryClient.invalidateQueries({ queryKey: ["workspace-limits", orgId] })
    },
  })

  const { execute: executeRestore } = useAction(restoreDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
      queryClient.invalidateQueries({ queryKey: ["documents", "trash", orgId] })
      queryClient.invalidateQueries({ queryKey: ["document", documentId] })
    },
  })

  const { data: document } = useQuery<any>({
    queryKey: ["document", documentId],
    queryFn: () => fetcher(API.DOCUMENTS.BY_ID(documentId, { userId: orgId })),
    enabled: Boolean(documentId && orgId),
  })
  const { data: archiveSettings } = useQuery<{ retentionDays: number }>({
    queryKey: ["archive-settings", orgId],
    queryFn: () => fetcher(API.DOCUMENTS.ARCHIVE_SETTINGS(orgId)),
    enabled: Boolean(orgId),
  })

  const retentionDays = archiveSettings?.retentionDays ?? DEFAULT_RETENTION_DAYS
  const remainingMs = document ? getRemainingArchiveTime(document, retentionDays) : 0
  const timeText = formatTimeRemaining(remainingMs)

  const onRemove = () => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут удалять заметки")
      return
    }

    const promise = executeRemove({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
        loading: "Удаляем заметку...",
        success: "Заметка удалена!",
        error: "Не удалось удалить"
    }) 

    router.push(pages.DASHBOARD()) 
  } 

  const onRestore = () => {
    if (isOrg && !isAdmin) {
      toast.error("Только администраторы могут восстанавливать заметки")
      return
    }

    const promise = executeRestore({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
        loading: "Восстановляем...",
        success: "Заметка восстановлена!",
        error: "Не удалось восстановить"
    }) 
  } 

    return (
    <div
      className="flex w-full items-center justify-between flex-col gap-3 border-b border-rose-400/40 bg-rose-500/95 px-4 py-2.5 text-center text-sm text-white shadow-sm backdrop-blur md:flex-row md:text-left"
      style={{ minHeight: 40 }}
    >
      <p className="md:mb-0">
        Эта заметка перемещена в архив{remainingMs > 0 && ` (удаление через ${timeText})`}
      </p>
      {isAdmin && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onRestore}
            variant="outline"
            className="h-auto rounded-lg border-white/80 bg-transparent p-1 px-2 font-normal text-white transition hover:bg-white hover:text-rose-500"
          >
            Восстановить
          </Button>
          <ConfirmModal onConfirm={onRemove}>
            <Button
              size="sm"
              variant="outline"
              className="h-auto rounded-lg border-white/80 bg-transparent p-1 px-2 font-normal text-white transition hover:bg-white hover:text-rose-500"
            >
              Удалить безвозвратно
            </Button>
          </ConfirmModal>
        </div>
      )}
    </div>
  )
} 