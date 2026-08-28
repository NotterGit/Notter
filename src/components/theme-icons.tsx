"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

import { images } from "@/config/routing/image.route"

export function ThemeIcons() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const isBeta =
      window.location.hostname === "dev.notter.su" ||
      window.location.host === "localhost:3001"

    const href = isBeta
      ? images.ICONS.BETA
      : images.ICONS.DARK

    document
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
      )
      .forEach((link) => {
        link.href = href
      })
  }, [resolvedTheme])

  return null
}
