"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

import { images } from "@/config/routing/image.route"

export function ThemeIcons() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const href =
      resolvedTheme === "light" ? images.IMAGE.LIGHT_ICON : images.IMAGE.DARK_ICON

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
