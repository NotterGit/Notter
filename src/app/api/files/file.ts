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
  const key = extractS3Key(url)
  if (!key) {
    return false
  }

  const s3Response = await s3Delete<ApiEntityResponse>("/delete", { key })

  await apiDelete<ApiEntityResponse>(apiRoutes.FILES.DELETE, { userid, url })

  return s3Response !== null
}

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url)
    const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))
    const segments = path.split("/").filter(Boolean)
    const ownerIndex = segments.findIndex((segment) => /^(user_|org_)/.test(segment))
    if (ownerIndex >= 0) {
      return segments.slice(ownerIndex).join("/")
    }
    const last = segments[segments.length - 1]
    return last || null
  } catch {
    return null
  }
}
