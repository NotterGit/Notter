/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { defaultBgImage } from "@/config/const/banner-images.const"
import type { BgCollection } from "@/config/types/components.types"
import { normalizeImageUrl } from "@/lib/image-url"
import {
  UploadCloud,
  Link2,
  Sparkles,
  Check,
  Palette,
  Image as ImageIcon,
  X,
} from "lucide-react"
import toast from "react-hot-toast"

interface CoverModalProps {
  isOpen: boolean
  onClose: () => void
  currentCoverUrl: string | null
  onSelectCover: (url: string) => void
  onRemoveCover: () => void
  onUploadFile?: (file: File) => Promise<string>
}

/**
 * Downscales and compresses large images before storing locally in localStorage
 */
function compressImageForStorage(
  file: File,
  maxWidth = 1400,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL("image/jpeg", quality)
        resolve(compressed)
      }
      img.onerror = () => reject(new Error("Ошибка загрузки изображения"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Ошибка чтения файла"))
    reader.readAsDataURL(file)
  })
}

export function CoverModal({
  isOpen,
  onClose,
  currentCoverUrl,
  onSelectCover,
  onRemoveCover,
  onUploadFile,
}: CoverModalProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "link">(
    "gallery"
  )
  const [activeFolder, setActiveFolder] = useState<string>("")
  const [collections, setCollections] = useState<BgCollection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [customUrl, setCustomUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false

    const loadCollections = async () => {
      try {
        const response = await fetch("/api/backgrounds")
        if (!response.ok) throw new Error("Failed to load backgrounds")
        const data: BgCollection[] = await response.json()
        if (!cancelled) {
          setCollections(data)
        }
      } catch {
        if (!cancelled) {
          toast.error("Не удалось загрузить коллекции обложек")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCollections(false)
        }
      }
    }

    void loadCollections()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (collections.length === 0) return

    const found = currentCoverUrl
      ? collections.find((col) => col.images.includes(currentCoverUrl))
      : undefined

    if (found) {
      setActiveFolder(found.folder)
    } else {
      setActiveFolder((prev) => prev || collections[0].folder)
    }
  }, [collections, currentCoverUrl])

  const activeCollection = useMemo(
    () =>
      collections.find((col) => col.folder === activeFolder) ??
      collections[0],
    [collections, activeFolder]
  )

  const handleSelectCover = (url: string) => {
    onSelectCover(url)
    onClose()
  }

  const handleRandomCover = () => {
    const allImages = collections.flatMap((col) => col.images)
    if (allImages.length === 0) return
    const randomUrl =
      allImages[Math.floor(Math.random() * allImages.length)] ?? defaultBgImage
    onSelectCover(randomUrl)
    toast.success("Случайная обложка выбрана")
    onClose()
  }

  const handleApplyCustomUrl = () => {
    const trimmed = customUrl.trim()
    if (!trimmed) {
      toast.error("Введите корректную ссылку на изображение")
      return
    }
    onSelectCover(trimmed)
    toast.success("Обложка по ссылке применена")
    setCustomUrl("")
    onClose()
  }

  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите файл изображения")
      return
    }

    setIsUploading(true)
    try {
      if (onUploadFile) {
        const uploadedUrl = await onUploadFile(file)
        onSelectCover(uploadedUrl)
      } else {
        const compressedDataUrl = await compressImageForStorage(file)
        onSelectCover(compressedDataUrl)
      }
      toast.success("Обложка успешно загружена")
      onClose()
    } catch {
      toast.error("Не удалось загрузить или обработать изображение")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void processUploadedFile(file)
    }
    if (e.target) {
      e.target.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void processUploadedFile(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">
                Обложка заметки
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Выберите обложку из коллекции, загрузите файл или вставьте ссылку
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5 mr-6">
              {currentCoverUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRemoveCover()
                    onClose()
                  }}
                  className="h-7 text-xs gap-1.5 cursor-pointer text-destructive hover:text-destructive shadow-xs"
                  title="Убрать обложку"
                >
                  <X size={12} />
                  <span>Убрать</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRandomCover}
                disabled={collections.length === 0}
                className="h-7 text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles size={12} className="text-white" />
                <span>Случайная</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                activeTab === "gallery"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Palette size={13} />
              <span>Коллекции</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                activeTab === "upload"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <UploadCloud size={13} />
              <span>Загрузить</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                activeTab === "link"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Link2 size={13} />
              <span>Ссылка</span>
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[440px] overflow-y-auto">
          {activeTab === "gallery" && (
            <div className="space-y-4">
              {isLoadingCollections ? (
                <>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-24 rounded-full" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video rounded-xl" />
                    ))}
                  </div>
                </>
              ) : collections.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-10">
                  Нет доступных обложек
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none">
                    {collections.map((col) => {
                      const isActive = activeCollection?.folder === col.folder
                      return (
                        <button
                          key={col.folder}
                          type="button"
                          onClick={() => setActiveFolder(col.folder)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {col.name}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeCollection?.images.map((image) => {
                      const isSelected = currentCoverUrl === image
                      return (
                        <button
                          key={image}
                          type="button"
                          onClick={() => handleSelectCover(image)}
                          className={cn(
                            "group/cover relative aspect-video overflow-hidden rounded-xl border bg-muted/40 transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none cursor-pointer",
                            isSelected &&
                              "ring-2 ring-primary border-primary shadow-sm"
                          )}
                        >
                          <img
                            src={normalizeImageUrl(image) || image}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border hover:border-primary/60 hover:bg-muted/30",
                  isUploading && "pointer-events-none opacity-60"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {isUploading
                    ? "Сжатие и подготовка обложки…"
                    : "Нажмите для выбора или перетащите файл сюда"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаются форматы PNG, JPG, WebP, SVG. Сохраняется локально в браузере.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 pointer-events-none"
                  disabled={isUploading}
                >
                  Выбрать файл на устройстве
                </Button>
              </div>
            </div>
          )}

          {activeTab === "link" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Прямая ссылка на изображение
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyCustomUrl()
                    }}
                    className="h-9 text-xs"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="h-9 px-4 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Применить
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Вставьте URL изображения (Unsplash, Pexels или любая публичная ссылка).
                </p>
              </div>

              {customUrl.trim() && (
                <div className="mt-4 overflow-hidden rounded-xl border bg-muted/30 p-2">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
                    Предпросмотр:
                  </p>
                  <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                    <img
                      src={customUrl.trim()}
                      alt="Предпросмотр"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}