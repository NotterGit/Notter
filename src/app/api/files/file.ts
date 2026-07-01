import { s3Delete, s3Post } from "../client"
import type {
  DeleteFileFunction,
  MessageResponse,
  S3UploadResponse,
  UploadFileFunction,
} from "@/config/types/api.types"

export const uploadFile: UploadFileFunction = async (_userid, _documentid, _avatar, _username, file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await s3Post<S3UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return response ? response.url : null
}

export const deleteFile: DeleteFileFunction = async (url) => {
  const rawKey = url.split("/").pop()?.split("?")[0]
  if (!rawKey) {
    return false
  }

  const key = decodeURIComponent(rawKey)
  const response = await s3Delete<MessageResponse>("/delete", { key })
  return response !== null
}
