"use client"

import { useEffect, useState } from "react"
import { APP_VERSION, BETA_HOSTS } from "@/config/const/app.const"

interface VersionBadgeProps {
  className?: string
}

export function VersionBadge({ className }: VersionBadgeProps) {
  const [isBeta, setIsBeta] = useState(false)

  useEffect(() => {
    setIsBeta(
      BETA_HOSTS.includes(window.location.hostname) ||
      BETA_HOSTS.includes(window.location.host)
    )
  }, [])

  if (!isBeta) return null

  return (
    <span className={className}>
      {APP_VERSION}
      <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-500 ring-1 ring-inset ring-amber-500/30">
        dev
      </span>
    </span>
  )
}
