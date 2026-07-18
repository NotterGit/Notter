"use client"

import { useEffect } from "react"
import { toast } from "react-hot-toast"

import {
  setIsPwaInstalled,
  setPwaPromptInstall,
  updatePwaInstalledState,
} from "@/lib/pwa-install"
import type { BeforeInstallPromptEvent } from "@/config/types/components.types"

export const PwaProvider = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null)
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const beforeInstallPromptHandler = (event: Event) => {
      event.preventDefault()
      setPwaPromptInstall(event as BeforeInstallPromptEvent)
    }

    const appInstalledHandler = () => {
      setPwaPromptInstall(null)
      setIsPwaInstalled(true)
      toast.success("Notter установлен")
    }

    updatePwaInstalledState()
    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler)
    window.addEventListener("appinstalled", appInstalledHandler)
    standaloneQuery.addEventListener("change", updatePwaInstalledState)

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler)
      window.removeEventListener("appinstalled", appInstalledHandler)
      standaloneQuery.removeEventListener("change", updatePwaInstalledState)
    }
  }, [])

  return null
}
