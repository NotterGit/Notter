"use client"

export function createDragGhost(icon: string, title: string, width?: string) {
  if (typeof document === "undefined") return null

  const ghost = document.createElement("div")
  ghost.style.position = "fixed"
  ghost.style.left = "0px"
  ghost.style.top = "0px"
  ghost.style.zIndex = "-99999"
  ghost.style.pointerEvents = "none"
  ghost.style.padding = "6px 14px"
  ghost.style.borderRadius = "8px"
  ghost.style.background = "#0f172a"
  ghost.style.color = "#ffffff"
  ghost.style.fontSize = "12px"
  ghost.style.fontWeight = "700"
  ghost.style.display = "inline-flex"
  ghost.style.alignItems = "center"
  ghost.style.gap = "8px"
  ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"
  ghost.style.border = "1px solid rgba(255,255,255,0.2)"
  ghost.style.whiteSpace = "nowrap"
  ghost.innerHTML = `<span style="font-size: 14px;">${icon}</span><span style="font-weight: 700; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>${width ? `<span style="opacity: 0.6; font-size: 10px; font-family: monospace; font-weight: 400; margin-left: 4px;">${width}</span>` : ""}`
  document.body.appendChild(ghost)

  const cleanup = () => {
    if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
    window.removeEventListener("dragend", cleanup)
    window.removeEventListener("drop", cleanup)
  }
  window.addEventListener("dragend", cleanup, { once: true })
  window.addEventListener("drop", cleanup, { once: true })
  setTimeout(cleanup, 10000)

  return ghost
}

const blobCache = new Map<string, string>()
export function ensureMediaUrl(src: string): string {
  if (!src) return ""
  if (src.startsWith("data:video/") || src.startsWith("data:audio/")) {
    const cached = blobCache.get(src)
    if (cached) return cached
    try {
      const [header, base64] = src.split(",")
      const mime = header.match(/:(.*?);/)?.[1] || ""
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mime })
      const blobUrl = URL.createObjectURL(blob)
      blobCache.set(src, blobUrl)
      return blobUrl
    } catch {
      return src
    }
  }
  return src
}
