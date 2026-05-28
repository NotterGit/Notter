import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

import { createUser, getById, updateUser } from "./user"
import { useDocumentStats } from "../use-document-stats"
import type { UseRequestUserFunction } from "@/config/types/api.types"

export const useRequestUser: UseRequestUserFunction = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const { documentCount, documentPublicCount, documentVerifiedCount, isReady } = useDocumentStats(user?.id)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.username || !isReady) return

    const syncUser = async () => {
      const existingUser = await getById(user.id)

      if (existingUser) {
        await updateUser(
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          user.imageUrl || null,
          null,
          null,
          documentCount,
          documentPublicCount,
          documentVerifiedCount,
          null,
          user.emailAddresses[0]?.emailAddress ?? null
        )
        return
      }

      await createUser(
        user.id,
        user.username as string,
        user.createdAt,
        user.firstName,
        user.lastName,
        user.imageUrl || null,
        documentCount,
        documentPublicCount,
        documentVerifiedCount,
        user.emailAddresses[0]?.emailAddress ?? null
      )
    }

    syncUser()
  }, [isLoaded, isSignedIn, user, documentCount, documentPublicCount, documentVerifiedCount, isReady])

  return null
}
