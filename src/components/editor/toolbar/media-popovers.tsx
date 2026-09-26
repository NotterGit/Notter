"use client"

import React, { useRef, useState } from "react"
import { UploadCloud, Film, Music, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

const readFileAsDataUrl = (file: File): Promise<string> => {
  if (
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    file.size > 2 * 1024 * 1024
  ) {
    return Promise.resolve(URL.createObjectURL(file))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Не удалось прочитать файл"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ImagePopover({
  isOpen,
  setIsOpen,
  onInsertImage,
  onUploadFile,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertImage: (src: string, alt?: string) => void
  onUploadFile?: (file: File) => Promise<string>
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertImage(trimmed, "Изображение")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите файл изображения")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер файла не должен превышать ${uploadLimitMb} МБ`)
      return
    }

    try {
      setIsUploading(true)
      let src: string
      if (onUploadFile) {
        src = await onUploadFile(file)
      } else {
        src = await readFileAsDataUrl(file)
      }
      onInsertImage(src, file.name)
      setIsOpen(false)
    } catch {
      // Error is handled in onUploadFile
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground">
            Вставить изображение
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={24} className="text-primary animate-spin" />
            ) : (
              <UploadCloud size={24} className="text-primary" />
            )}
            <span className="text-xs font-medium text-foreground">
              {isUploading ? "Загрузка на сервер…" : "Загрузить с устройства"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              PNG, JPG, WebP, GIF до {uploadLimitMb} МБ
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../image.png"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function VideoPopover({
  isOpen,
  setIsOpen,
  onInsertVideo,
  onUploadFile,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertVideo: (src: string, title?: string) => void
  onUploadFile?: (file: File) => Promise<string>
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertVideo(trimmed, "Видео")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error("Пожалуйста, выберите видеофайл")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер видеофайла не должен превышать ${uploadLimitMb} МБ`)
      return
    }

    try {
      setIsUploading(true)
      let src: string
      if (onUploadFile) {
        src = await onUploadFile(file)
      } else {
        src = await readFileAsDataUrl(file)
      }
      onInsertVideo(src, file.name)
      setIsOpen(false)
    } catch {
      // Handled in onUploadFile
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Film size={14} className="text-primary" />
            <span>Вставить видео</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={24} className="text-primary animate-spin" />
            ) : (
              <UploadCloud size={24} className="text-primary" />
            )}
            <span className="text-xs font-medium text-foreground">
              {isUploading ? "Загрузка на сервер…" : "Загрузить с устройства"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              MP4, WebM, MOV, OGG до {uploadLimitMb} МБ
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по прямой ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../video.mp4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center bg-muted/40 rounded-md p-1.5">
            💡 Видео будет вставлено в место курсора. Также можно{" "}
            <span className="text-foreground font-medium">перетащить файл в редактор</span>.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AudioPopover({
  isOpen,
  setIsOpen,
  onInsertAudio,
  onUploadFile,
  uploadLimitMb,
  children,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onInsertAudio: (src: string, title?: string) => void
  onUploadFile?: (file: File) => Promise<string>
  uploadLimitMb: number
  children: React.ReactNode
}) {
  const [url, setUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsertAudio(trimmed, "Аудиозапись")
    setUrl("")
    setIsOpen(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("audio/")) {
      toast.error("Пожалуйста, выберите аудиофайл")
      return
    }
    if (file.size > uploadLimitMb * 1024 * 1024) {
      toast.error(`Размер аудиофайла не должен превышать ${uploadLimitMb} МБ`)
      return
    }

    try {
      setIsUploading(true)
      let src: string
      if (onUploadFile) {
        src = await onUploadFile(file)
      } else {
        src = await readFileAsDataUrl(file)
      }
      onInsertAudio(src, file.name)
      setIsOpen(false)
    } catch {
      // Handled in onUploadFile
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-3">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Music size={14} className="text-primary" />
            <span>Вставить аудиозапись</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={24} className="text-primary animate-spin" />
            ) : (
              <UploadCloud size={24} className="text-primary" />
            )}
            <span className="text-xs font-medium text-foreground">
              {isUploading ? "Загрузка на сервер…" : "Загрузить с устройства"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              MP3, WAV, OGG, M4A, AAC до {uploadLimitMb} МБ
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Или по прямой ссылке
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://.../audio.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyUrl()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Вставить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
