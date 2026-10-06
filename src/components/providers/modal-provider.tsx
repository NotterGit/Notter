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

const MoveNoteModal = dynamic(
  () => import("../modal/move-note-modal").then((mod) => mod.MoveNoteModal),
  { ssr: false }
)

const AuditModal = dynamic(
  () => import("../modal/audit-modal").then((mod) => mod.AuditModal),
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
      <MoveNoteModal />
      <AuditModal />
    </>
  )
}

