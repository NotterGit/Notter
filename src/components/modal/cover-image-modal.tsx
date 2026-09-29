"use client" 

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" 
import { useState } from "react" 
import { useParams } from "next/navigation" 
import { useCoverImage } from "../hooks/use-cover-image" 
import { DragAndDrop } from "../drag-and-drop" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { uploadFile } from "@/api/files"
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
import toast from "react-hot-toast"
import { isValidDocumentId } from "@/lib/document-id"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { getPlanLimits } from "@/lib/plan-limits"
import { updateDocument } from "@/actions/update-document"
import { useAction } from "@/hooks/use-action"

export function CoverImageModal(){
  const params = useParams() 
  const queryClient = useQueryClient()
  const documentId = typeof params.documentId === "string" && isValidDocumentId(params.documentId)
    ? params.documentId
    : null

  const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false) 

  const { execute: executeUpdate } = useAction(updateDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })
  const coverImage = useCoverImage()

  const { user } = useUser()
  const { organization } = useOrganization()
  const isOrg = organization?.id !== undefined
  const orgId = isOrg ? organization?.id : user?.id
  const avatar = user?.imageUrl || ""
  const username = user?.username || ""

  const onClose = () => {
    setFile(undefined) 
    setIsSubmitting(false) 
    coverImage.onClose() 
  } 

  const onChange = async (file?: File) => {
    if (!file || !documentId || !orgId) return;

    const userdata = isOrg ? 
      await getOrgById(orgId) : 
      await getUserById(orgId);

    const userSize = getPlanLimits(Number(userdata?.premium ?? 0), isOrg).uploadMb;
    const maxSize = userSize * 1024 * 1024

    if (file.size > maxSize) {
      toast.error(`Размер файла не может привышать ${userSize} МБ`);
      coverImage.onClose();
      return;
    }

    setIsSubmitting(true);
    setFile(file);

    const fileUrl = await uploadFile(orgId, documentId, avatar, username, file);
    if (!fileUrl) {
      toast.error("Не удалось загрузить обложку");
      setIsSubmitting(false);
      return;
    }

    await executeUpdate({
      id: documentId,
      coverImage: fileUrl,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime()
    });

    onClose();
  };


  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogTitle>
        <p className="sr-only">Изменить обложку</p>
      </DialogTitle>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-center text-lg font-semibold">Загрузить Обложку</h2>
        </DialogHeader>
        <DragAndDrop
          className="w-full outline-none"
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  ) 
} 
