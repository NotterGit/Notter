"use client" 

import { cn } from "@/lib/utils" 
import Image from "next/image" 
import { Button } from "./ui/button" 
import { ImageIcon, X } from "lucide-react" 
import { useMutation, useQuery } from "convex/react" 
import { useParams } from "next/navigation" 
import { Skeleton } from "./ui/skeleton" 
import { api } from "../../convex/_generated/api" 
import { useCoverImage } from "./hooks/use-cover-image" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { deleteFile } from "../app/api/files/file"
import type { CoverImageProps } from "@/config/types/components.types";
import toast from "react-hot-toast"
import { isValidConvexId } from "@/lib/convex-id"

export function Cover({ url, preview }: CoverImageProps){
  const { user } = useUser()
  const { organization } = useOrganization()

  const orgId = organization?.id ?? user?.id
  const params = useParams() 
  const documentId = typeof params.documentId === "string" && isValidConvexId(params.documentId)
    ? params.documentId
    : null
  const coverImage = useCoverImage() 
  const removeCoverImage = useMutation(api.document.removeCoverImage) 
  
  const onRemove = async () => {
    if (!documentId || !orgId) {
      return
    }

    if (url) {
      const fileId = url.split("/").pop()?.split("?")[0];
      console.log(fileId);
      if (fileId) 
        await deleteFile(orgId, fileId);
    }

    const promise = removeCoverImage({
      id: documentId,
      userId: orgId
    });

    toast.promise(promise, {
      loading: "Удаление обложки...",
      success: "Обложка удалена",
      error: "Ошибка при удалении обложки"
    });
  } 

  return (
    <div
      className={cn(
        "group relative h-[35vh] w-full",
        !url && "h-[12vh]",
        url && "bg-muted",
      )}
    >
      {!!url && (
        <Image src={url} fill alt="cover" className="object-cover" priority />
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
