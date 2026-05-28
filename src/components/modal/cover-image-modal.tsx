"use client" 

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" 
import { useState } from "react" 
import { useMutation } from "convex/react" 
import { useParams } from "next/navigation" 
import { useCoverImage } from "../hooks/use-cover-image" 
import { api } from "../../../convex/_generated/api" 
import { DragAndDrop } from "../drag-and-drop" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { uploadFile } from "../../app/api/files/file"
import { getById as getUserById } from "../../app/api/users/user";
import { getById as getOrgById } from "../../app/api/orgs/org";
import toast from "react-hot-toast"
import { isValidConvexId } from "@/lib/convex-id"
import { getCurrentEditTime } from "@/lib/last-edit-time"

export function CoverImageModal(){
  const params = useParams() 
  const documentId = typeof params.documentId === "string" && isValidConvexId(params.documentId)
    ? params.documentId
    : null

  const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false) 

  const update = useMutation(api.document.update) 
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

    const userSize = 
      userdata?.premium == 1 ? 3 
      : userdata?.premium == 2 ? 10 
      : 1;
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

    await update({
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
