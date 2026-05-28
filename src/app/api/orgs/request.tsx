import { useEffect } from "react"
import { useOrganization, useUser } from "@clerk/nextjs"

import { createOrg, getById, updateOrg } from "./org"
import { useDocumentStats } from "../use-document-stats"
import type { UseRequestOrgFunction } from "@/config/types/api.types"

export const useRequestOrg: UseRequestOrgFunction = () => {
  const { organization, isLoaded } = useOrganization()
  const { isSignedIn } = useUser()
  const { documentCount, documentPublicCount, documentVerifiedCount, isReady } = useDocumentStats(organization?.id)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organization || !isReady) return

    const syncOrg = async () => {
      const memberships = await organization.getMemberships()
      const members = memberships.data.flatMap((member) => {
        const userId = member.publicUserData?.userId
        return userId ? [userId] : []
      })
      const admin = memberships.data.find((member) => member.role === "org:admin")
      const adminId = admin?.publicUserData?.userId ?? null

      const existingOrg = await getById(organization.id)
      if (!existingOrg) {
        await createOrg(
          organization.id,
          organization.slug,
          adminId,
          organization.createdAt,
          organization.name,
          members,
          organization.imageUrl || null,
          documentCount,
          documentPublicCount,
          documentVerifiedCount
        )
        return
      }

      await updateOrg(
        organization.id,
        organization.slug,
        adminId,
        organization.name,
        organization.imageUrl || null,
        null,
        null,
        documentCount,
        documentPublicCount,
        members,
        null,
        null,
        documentVerifiedCount
      )
    }

    syncOrg()
  }, [isLoaded, isSignedIn, organization, documentCount, documentPublicCount, documentVerifiedCount, isReady])

  return null
}
