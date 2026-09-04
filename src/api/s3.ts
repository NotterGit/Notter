import { S3Client } from "@/api/client";
import type { S3DeleteResponse, S3UploadResponse } from "@/config/types/api.types";
import toast from "react-hot-toast";

export function extractS3Key(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const keyParam = parsed.searchParams.get("key");
    if (keyParam) return decodeURIComponent(keyParam);

    const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const segments = path.split("/").filter(Boolean);
    const ownerIndex = segments.findIndex((segment) =>
      /^(user_|org_)/.test(segment)
    );
    if (ownerIndex >= 0) {
      return segments.slice(ownerIndex).join("/");
    }
    const last = segments[segments.length - 1];
    return last || null;
  } catch {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return url.replace(/^\/+/, "");
    }
    return null;
  }
}

export async function uploadFileToS3(
  file: File
): Promise<S3UploadResponse | null> {
  if (!file) {
    toast.error("Файл не выбран");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await S3Client.post<S3UploadResponse>("upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (error) {
    console.error("[S3_UPLOAD_ERROR]", error);
    toast.error("Ошибка при загрузке файла на сервер");
    return null;
  }
}

export async function deleteFileFromS3(urlOrKey: string): Promise<boolean> {
  const key = extractS3Key(urlOrKey);
  if (!key) return false;

  try {
    const res = await S3Client.delete<S3DeleteResponse>("delete", {
      params: { key },
    });

    return res.data?.deleted ?? false;
  } catch (error) {
    console.error("[S3_DELETE_ERROR]", error);
    return false;
  }
}
