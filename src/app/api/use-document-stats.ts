import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { UseDocumentStatsFunction } from "@/config/types/api.types"

export const useDocumentStats: UseDocumentStatsFunction = (userId) => {
  const args = userId ? { userId } : "skip"

  const documentCount = useQuery(api.document.getDocumentCount, args)
  const documentPublicCount = useQuery(api.document.getPublicDocumentCount, args)
  const documentVerifiedCount = useQuery(api.document.getVerifiedDocumentCount, args)

  return {
    documentCount,
    documentPublicCount,
    documentVerifiedCount,
    isReady:
      documentCount !== undefined &&
      documentPublicCount !== undefined &&
      documentVerifiedCount !== undefined,
  }
}
