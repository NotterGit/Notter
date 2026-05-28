"use client" 

import "@blocknote/core/style.css" 
import "@blocknote/mantine/style.css"
import { BlockNoteEditor, PartialBlock } from "@blocknote/core" 
import { useCreateBlockNote } from "@blocknote/react" 
import { BlockNoteView } from "@blocknote/mantine"
import { useTheme } from "next-themes" 
import { useOrganization, useUser } from "@clerk/nextjs"
import { getById as getUserById } from "../app/api/users/user"
import { getById as getOrgById } from "../app/api/orgs/org"
import toast from "react-hot-toast"
import { uploadFile as uploadFileOnServer } from "../app/api/files/file"
import type { EditorProps } from "@/config/types/components.types";
import type { ClipboardEvent } from "react";

const normalizePastedText = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");

export default function Editor({ onChange, initialContent, editable, documentId }: EditorProps){
  const { resolvedTheme } = useTheme()
  const { user } = useUser()
  const { organization } = useOrganization()
  const isOrg = organization?.id !== undefined
  const orgId = isOrg ? organization?.id as string : user?.id as string
  const avatar = user?.imageUrl || ""
  const username = user?.username || ""

  const handleUpload = async (file: File) => {
    const userdata = isOrg
      ? await getOrgById(orgId)
      : await getUserById(orgId)

    const userSize =
      userdata?.premium == 1 ? 3
      : userdata?.premium == 2 ? 10
      : 1

    const maxSize = userSize * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Размер файла не может превышать ${userSize} МБ`)
      throw new Error("File too large")
    }

    const url = await uploadFileOnServer(orgId, documentId as string, avatar, username, file);
    if (!url) {
      toast.error("Не удалось загрузить файл")
      throw new Error("Upload failed")
    }
    return url;
  };
  
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
    ? (JSON.parse(initialContent) as PartialBlock[])
    : undefined,
    uploadFile: handleUpload,
  }) 

  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2))
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (!editable || !event.clipboardData || event.clipboardData.files.length > 0) {
      return
    }

    const pastedText = event.clipboardData.getData("text/plain")
    if (!pastedText) {
      return
    }

    const view = editor.prosemirrorView
    if (!view) {
      return
    }

    event.preventDefault()
    view.focus()
    view.pasteText(normalizePastedText(pastedText), event.nativeEvent)
  }

  return (
    <div onPasteCapture={handlePaste}>
      <BlockNoteView
        editable={editable}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        data-theming-css-variables-demo
        className="z-10"
      />
    </div>
  ) 
} 
