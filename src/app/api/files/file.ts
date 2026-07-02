import { apiDelete, apiPost, s3Delete, s3Post } from "../client"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  ApiEntityResponse,
  DeleteFileFunction,
  S3UploadResponse,
  UploadFileFunction,
} from "@/config/types/api.types"

export const uploadFile: UploadFileFunction = async (userid, documentid, avatar, username, file) => {
  const formData = new FormData()
  formData.append("file", file)

  const s3Response = await s3Post<S3UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  if (!s3Response) {
    return null
  }

  await apiPost<ApiEntityResponse>(apiRoutes.FILES.UPLOAD, {
    userid,
    documentid,
    username,
    avatar,
    url: s3Response.url,
    filename: s3Response.filename,
    type: file.type || "application/octet-stream",
  })

  return s3Response.url
}

export const deleteFile: DeleteFileFunction = async (userid, url) => {
  const rawKey = url.split("/").pop()?.split("?")[0]
  if (!rawKey) {
    return false
  }

  const key = decodeURIComponent(rawKey)

  const s3Response = await s3Delete<ApiEntityResponse>("/delete", { key })

  await apiDelete<ApiEntityResponse>(apiRoutes.FILES.DELETE, { userid, url })

  return s3Response !== null
}
