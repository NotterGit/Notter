import { Delete, Post } from "@/api/client";
import { deleteFileFromS3, uploadFileToS3 } from "@/api/s3";
import { API } from "@/config/routing/api.route";
import type {
  ApiEntityResponse,
  DeleteFileFunction,
  UploadFileFunction,
} from "@/config/types/api.types";

export const uploadFile: UploadFileFunction = async (
  userid,
  documentid,
  avatar,
  username,
  file
) => {
  const s3Response = await uploadFileToS3(file);
  if (!s3Response) {
    return null;
  }

  await Post<ApiEntityResponse>(API.BACKEND.FILES.UPLOAD, {
    userid,
    documentid,
    username,
    avatar,
    url: s3Response.url,
    filename: s3Response.filename,
    type: file.type || "application/octet-stream",
  });

  return s3Response.url;
};

export const deleteFile: DeleteFileFunction = async (userid, url) => {
  const s3Deleted = await deleteFileFromS3(url);

  await Delete<ApiEntityResponse>(API.BACKEND.FILES.DELETE, {
    data: { userid, url },
  });

  return s3Deleted;
};
