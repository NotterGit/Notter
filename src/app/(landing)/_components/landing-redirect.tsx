"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { isDesktopApp } from "@/lib/desktop-app"

export function LandingRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (isDesktopApp() || localStorage.getItem("redirect") === "true") {
      router.replace("/dashboard")
    }
  }, [router])

  return null
}
