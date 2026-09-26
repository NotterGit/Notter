import type { Metadata } from "next"
import { ConvexHttpClient } from "convex/browser"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { getOrgByUsername } from "@/api/org"
import { getUserByUsername } from "@/api/user"
import { isValidConvexId } from "@/lib/convex-id"
import type { PublicDocumentMetadata, PublicDocumentMetadataOptions } from "@/config/types/public.types"

async function getWatermark(userId: string, creatorName?: string | null) {
  if (!creatorName) {
    return null
  }

  try {
    const profile = userId.startsWith("org_")
      ? await getOrgByUsername(creatorName)
      : await getUserByUsername(creatorName)

    return profile?.watermark ?? null
  } catch {
    return null
  }
}

export async function getPublicDocumentMetadata(
  documentId: string,
  options: PublicDocumentMetadataOptions = {}
): Promise<PublicDocumentMetadata | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const isShort = documentId.length >= 4 && documentId.length <= 30

  if (!convexUrl || (!isShort && !isValidConvexId(documentId))) {
    return null
  }

  try {
    const convex = new ConvexHttpClient(convexUrl)

    if (isShort || options.requireShort) {
      const document = await convex.query(api.document.getByShortId, {
        shortId: documentId,
      })

      if (!document?.isPublished || document.isAcrhived || !document.isShort) {
        return null
      }

      return {
        title: document.title?.trim() || "Без названия",
        watermark: await getWatermark(document.userId, document.creatorName),
      }
    }

    const document = await convex.query(api.document.getById, {
      documentId: documentId as Id<"documents">,
    })

    if (!document?.isPublished || document.isAcrhived) {
      return null
    }

    return {
      title: document.title?.trim() || "Без названия",
      watermark: await getWatermark(document.userId, document.creatorName),
    }
  } catch {
    return null
  }
}

export function createPublicTitleMetadata(
  metadata: PublicDocumentMetadata | null,
  fallbackTitle = "Page not found",
  suffix = ""
): Metadata {
  const docTitle = metadata?.title?.trim() || fallbackTitle
  const title = `${docTitle}${suffix}`

  return {
    title: metadata?.watermark === false ? { absolute: title } : title,
  }
}
