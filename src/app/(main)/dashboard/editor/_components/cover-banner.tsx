/* eslint-disable @next/next/no-img-element */
"use client"

import { Button } from "@/components/ui/button"
import { ImageIcon, Sparkles, X } from "lucide-react"

interface CoverBannerProps {
  coverUrl: string | null
  preview: boolean
  onOpenModal: () => void
  onRemoveCover: () => void
  onRandomCover: () => void
}

export function CoverBanner({
  coverUrl,
  preview,
  onOpenModal,
  onRemoveCover,
  onRandomCover,
}: CoverBannerProps) {
  if (!coverUrl) {
    return null
  }

  return (
    <div className="group/cover relative h-48 sm:h-60 md:h-72 w-full overflow-hidden rounded-t-2xl border-b bg-muted/40 select-none transition-all">
      <img
        src={coverUrl}
        alt="Обложка заметки"
        className="h-full w-full object-cover object-center select-none"
      />

      {!preview && (
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1 sm:gap-1.5 opacity-100 md:opacity-0 md:group-hover/cover:opacity-100 transition-opacity duration-200 bg-black/65 dark:bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-white/20 shadow-lg text-white max-w-[calc(100%-1rem)] flex-wrap justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenModal}
            className="h-7 px-2 sm:px-2.5 text-xs font-medium cursor-pointer text-white/90 hover:text-white hover:bg-white/15"
          >
            <ImageIcon className="mr-1 sm:mr-1.5 h-3.5 w-3.5 text-white" />
            <span className="hidden sm:inline">Изменить обложку</span>
            <span className="sm:hidden">Изменить</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRandomCover}
            className="h-7 px-2 sm:px-2.5 text-xs font-medium cursor-pointer text-white/90 hover:text-white hover:bg-white/15"
            title="Выбрать случайную обложку"
          >
            <Sparkles className="mr-1 sm:mr-1.5 h-3.5 w-3.5 text-white" />
            <span>Случайная</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveCover}
            className="h-7 px-2 sm:px-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
            title="Убрать обложку"
          >
            <X className="h-3.5 w-3.5 text-white/70" />
            <span>Убрать</span>
          </Button>
        </div>
      )}
    </div>
  )
}
