"use client" 

import { cn } from "@/lib/utils" 
import Image from "next/image" 
import { Button } from "./ui/button" 
import { ImageIcon, X } from "lucide-react" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { deleteFile } from "@/api/files"
import { normalizeImageUrl } from "@/lib/image-url"
import type { CoverImageProps } from "@/config/types/components.types"
import toast from "react-hot-toast"
import { isValidDocumentId } from "@/lib/document-id"
import { useParams } from "next/navigation"
import { useCoverImage } from "./hooks/use-cover-image"
import { Skeleton } from "./ui/skeleton"
import { removeCover } from "@/actions/remove-cover"
import { useAction } from "@/hooks/use-action"

export function Cover({ url, preview }: CoverImageProps){
  const { user } = useUser()
  const { organization } = useOrganization()
  const queryClient = useQueryClient()

  const orgId = organization?.id ?? user?.id
  const params = useParams() 
  const documentId = typeof params.documentId === "string" && isValidDocumentId(params.documentId)
    ? params.documentId
    : null
  const coverImage = useCoverImage() 
  const { execute: executeRemoveCover } = useAction(removeCover, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })
  
  const onRemove = async () => {
    if (!documentId || !orgId || !url) {
      return
    }

    await deleteFile(orgId, url)

    const promise = executeRemoveCover({
      id: documentId,
      userId: orgId
    });

    toast.promise(promise, {
      loading: "Удаление обложки...",
      success: "Обложка удалена",
      error: "Ошибка при удалении обложки"
    });
  } 

  const normalizedUrl = url ? normalizeImageUrl(url) || url : null

  return (
    <div
      className={cn(
        "group relative h-[35vh] w-full",
        !url && "h-[12vh]",
        url && "bg-muted",
      )}
    >
      {!!normalizedUrl && (
        <Image src={normalizedUrl} fill alt="cover" className="object-cover" priority />
      )}
      {url && !preview && (
        <div className="absolute bottom-5 right-5 flex items-center gap-x-2">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Изменить обложку
          </Button>
          <Button
            onClick={onRemove}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4" />
            Убрать
          </Button>
        </div>
      )}
    </div>
  ) 
} 

Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="h-70 w-full" /> 
}
