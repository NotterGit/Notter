"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { isDesktopApp } from "@/lib/desktop-app"

export function LandingRedirect() {
  const router = useRouter()
  const { isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn) return

    if (isDesktopApp() || localStorage.getItem("redirect") === "true") {
      router.replace("/dashboard")
    }
  }, [router, isSignedIn])

  return null
}
