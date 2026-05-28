import type { Metadata } from "next"
import { ConvexHttpClient } from "convex/browser"

import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { getByUsername as getByOrgname } from "../../api/orgs/org"
import { getByUsername } from "../../api/users/user"
import { isValidConvexId } from "@/lib/convex-id"

type PublicDocumentMetadata = {
  title: string
  watermark: boolean | null
}

type PublicDocumentMetadataOptions = {
  requireShort?: boolean
}

async function getWatermark(userId: string, creatorName?: string | null) {
  if (!creatorName) {
    return null
  }

  const profile = userId.startsWith("org_")
    ? await getByOrgname(creatorName)
    : await getByUsername(creatorName)

  return profile?.watermark ?? null
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

      if (!document?.isPublished || document.isAcrhived || (options.requireShort && !document.isShort)) {
        return null
      }

      return {
        title: document.title,
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
      title: document.title,
      watermark: await getWatermark(document.userId, document.creatorName),
    }
  } catch {
    return null
  }
}

export function createPublicTitleMetadata(
  metadata: PublicDocumentMetadata | null,
  fallbackTitle: string,
  suffix = ""
): Metadata {
  const title = metadata?.title ? `${metadata.title}${suffix}` : fallbackTitle

  return {
    title: metadata?.watermark === false ? { absolute: title } : title,
  }
}
