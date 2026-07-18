"use client"

import { useEffect } from "react"
import { useRequestOrg } from "../../app/api/orgs/request"
import { useRequestUser } from "../../app/api/users/request"
import { useAuth } from "@clerk/nextjs"
import { setClerkTokenGetter } from "@/app/api/client"

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth()

  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        if (!isLoaded || !getToken) return null
        const token = await getToken()
        return token ?? null
      } catch {
        return null
      }
    })
  }, [getToken, isLoaded])

  useRequestUser()
  useRequestOrg()

  return <>{children}</>
}