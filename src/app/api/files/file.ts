import { apiDelete, apiGet, apiPost, withApiBaseUrl } from "../client"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  DeleteFileFunction,
  DeleteFileResponse,
  GetFilesByUserFunction,
  UploadFileFunction,
  UploadFileResponse,
  UserFile,
} from "@/config/types/api.types"

export const uploadFile: UploadFileFunction = async (userid, documentid, avatar, username, file) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userid", userid)
  formData.append("documentid", documentid)
  formData.append("username", username)
  formData.append("avatar", avatar)

  const response = await apiPost<UploadFileResponse>(apiRoutes.FILES.UPLOAD, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return response ? withApiBaseUrl(response.url) : null
}

export const deleteFile: DeleteFileFunction = async (userid, fileid) => {
  const response = await apiDelete<DeleteFileResponse>(apiRoutes.FILES.DELETE, { userid, fileid })
  return response?.success ?? false
}

export const getFilesByUser: GetFilesByUserFunction = (userid) => {
  return apiGet<UserFile[]>(apiRoutes.FILES.BY_USER(userid))
}
