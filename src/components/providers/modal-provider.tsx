"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const SettingsModal = dynamic(
  () => import("../modal/settings-modal").then((mod) => mod.SettingsModal),
  { ssr: false }
)

const CoverImageModal = dynamic(
  () => import("../modal/cover-image-modal").then((mod) => mod.CoverImageModal),
  { ssr: false }
)

export function ModalProvider(){
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <>
      <SettingsModal />
      <CoverImageModal />
    </>
  )
}
