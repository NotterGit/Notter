"use client"

import { toast } from "react-hot-toast"

import { isDesktopApp } from "@/lib/desktop-app"
import type {
  BeforeInstallPromptEvent,
  NavigatorWithStandalone,
} from "@/config/types/components.types"

let promptInstall: BeforeInstallPromptEvent | null = null
let isInstalled = false

const promptListeners = new Set<(event: BeforeInstallPromptEvent | null) => void>()
const installedListeners = new Set<(installed: boolean) => void>()

const isIosStandalone = () =>
  Boolean((navigator as NavigatorWithStandalone).standalone)

const notifyPromptListeners = () => {
  promptListeners.forEach((listener) => listener(promptInstall))
}

const notifyInstalledListeners = () => {
  installedListeners.forEach((listener) => listener(isInstalled))
}

export const getPwaPromptInstall = () => promptInstall

export const getIsPwaInstalled = () => isInstalled

export const subscribePwaPromptInstall = (
  listener: (event: BeforeInstallPromptEvent | null) => void
) => {
  promptListeners.add(listener)
  listener(promptInstall)

  return () => {
    promptListeners.delete(listener)
  }
}

export const subscribePwaInstalled = (listener: (installed: boolean) => void) => {
  installedListeners.add(listener)
  listener(isInstalled)

  return () => {
    installedListeners.delete(listener)
  }
}

export const setPwaPromptInstall = (event: BeforeInstallPromptEvent | null) => {
  promptInstall = event
  notifyPromptListeners()
}

export const setIsPwaInstalled = (installed: boolean) => {
  isInstalled = installed
  notifyInstalledListeners()
}

export const updatePwaInstalledState = () => {
  const standaloneQuery = window.matchMedia("(display-mode: standalone)")

  setIsPwaInstalled(standaloneQuery.matches || isIosStandalone() || isDesktopApp())
}

export const installPwaFromBrowser = async () => {
  const installPrompt = getPwaPromptInstall()

  if (!installPrompt) {
    toast(
      "Не удалось открыть окно"
    )
    return false
  }

  try {
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice?.catch(() => null)

    if (choice?.outcome === "accepted") {
      toast.success("Установка запущена")
      return true
    }

    return false
  } finally {
    setPwaPromptInstall(null)
  }
}
