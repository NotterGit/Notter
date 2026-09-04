"use client" 

import { Button } from "@/components/ui/button" 
import { useMutation, useQuery } from "convex/react" 
import { useRouter } from "next/navigation" 
import { toast } from "react-hot-toast"
import { api } from "../../../../convex/_generated/api" 
import { ConfirmModal } from "@/components/modal/confirm-modal" 
import { Id } from "../../../../convex/_generated/dataModel" 
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
  const remove = useMutation(api.document.remove) 
  const restore = useMutation(api.document.restore) 
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const orgId = organization?.id !== undefined ? organization?.id as string : user?.id as string

  const document = useQuery(api.document.getById, {
    documentId: documentId,
    userId: orgId,
  })
  const archiveSettings = useQuery(
    api.document.getArchiveSettings,
    orgId ? { userId: orgId } : "skip"
  )

  const retentionDays = archiveSettings?.retentionDays ?? DEFAULT_RETENTION_DAYS
  const remainingMs = document ? getRemainingArchiveTime(document, retentionDays) : 0
  const timeText = formatTimeRemaining(remainingMs)

  const onRemove = () => {
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
        error: "Не удалось удалить"
    }) 

    router.push(pages.DASHBOARD()) 
  } 

  const onRestore = () => {
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
        error: "Не удалось восстановить"
    }) 
  } 

    return (
    <div
      className="mx-2 mt-2 flex w-[calc(100%-1rem)] items-center justify-between flex-col gap-3 rounded-2xl border border-rose-300/60 bg-rose-500/95 px-4 py-2 text-center text-sm text-white shadow-xl backdrop-blur md:flex-row md:text-left"
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