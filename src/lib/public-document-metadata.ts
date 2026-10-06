import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getOrgByUsername } from "@/api/org";
import { getUserByUsername } from "@/api/user";
import { isValidDocumentId } from "@/lib/document-id";
import type { PublicDocumentMetadata, PublicDocumentMetadataOptions } from "@/config/types/public.types";

async function getWatermark(userId: string, creatorName?: string | null) {
  if (!creatorName) {
    return null;
  }

  try {
    const profile = userId.startsWith("org_")
      ? await getOrgByUsername(creatorName)
      : await getUserByUsername(creatorName);

    return profile?.watermark ?? null;
  } catch {
    return null;
  }
}

export async function getPublicDocumentMetadata(
  documentId: string,
  options: PublicDocumentMetadataOptions = {}
): Promise<PublicDocumentMetadata | null> {
  const isShort = documentId.length >= 4 && documentId.length <= 30;

  if (!isShort && !isValidDocumentId(documentId)) {
    return null;
  }

  try {
    if (isShort || options.requireShort) {
      const document = await db.document.findUnique({
        where: { shortId: documentId },
      });

      if (!document?.isPublished || document.isArchived || !document.isShort) {
        return null;
      }

      return {
        title: document.title?.trim() || "Без названия",
        watermark: await getWatermark(document.userId, document.creatorName),
      };
    }

    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document?.isPublished || document.isArchived) {
      return null;
    }

    return {
      title: document.title?.trim() || "Без названия",
      watermark: await getWatermark(document.userId, document.creatorName),
    };
  } catch {
    return null;
  }
}

export function createPublicTitleMetadata(
  metadata: PublicDocumentMetadata | null,
  fallbackTitle = "Page not found",
  suffix = ""
): Metadata {
  const docTitle = metadata?.title?.trim() || fallbackTitle;
  const title = `${docTitle}${suffix}`;

  return {
    title: metadata?.watermark === false ? { absolute: title } : title,
  };
}
