"use client"

import { useRef } from "react"
import TextareaAutosize from "react-textarea-autosize"
import Twemoji from "react-twemoji"
import { Smile, ImageIcon, X, Sparkles } from "lucide-react"
import { IconPicker } from "@/components/icon-picker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getRandomEmoji } from "@/config/const/emojis.const"
import type { EditorHeaderProps } from "@/config/types/editor.types"

export function EditorHeader({
  title,
  onChangeTitle,
  icon,
  onChangeIcon,
  onRemoveIcon,
  hasCover,
  onAddCover,
  preview,
  onEnterPress,
}: EditorHeaderProps) {
  const titleInputRef = useRef<HTMLTextAreaElement>(null)

  const handleRandomEmoji = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChangeIcon(getRandomEmoji())
  }

  return (
    <div
      className={cn(
        "group/header relative px-4 sm:px-6 md:px-10 pb-4 pt-6 transition-all",
        hasCover && "pt-0"
      )}
    >
      {/* Emoji display */}
      {icon && (
        <div
          className={cn(
            "relative inline-block group/emoji z-10 select-none",
            hasCover ? "-mt-12 sm:-mt-14 mb-3" : "mb-3"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              hasCover &&
                "rounded-2xl border border-border/80 bg-background/95 dark:bg-zinc-900/95 p-2 shadow-lg backdrop-blur-md"
            )}
          >
            <IconPicker asChild onChange={onChangeIcon}>
              <button
                type="button"
                className="cursor-pointer transition hover:opacity-80 active:scale-95 focus:outline-none flex items-center justify-center p-0 m-0 border-0 bg-transparent leading-none"
                title="Нажмите, чтобы изменить эмодзи"
                disabled={preview}
              >
                <Twemoji
                  options={{ className: "twemoji-lg" }}
                  className="flex items-center justify-center leading-none"
                >
                  <span className="flex items-center justify-center leading-none text-5xl sm:text-6xl select-none">
                    {icon}
                  </span>
                </Twemoji>
              </button>
            </IconPicker>

            {!preview && (
              <div className="flex flex-col gap-1 items-center justify-center opacity-100 md:opacity-0 md:group-hover/emoji:opacity-100 transition-opacity duration-150">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRandomEmoji}
                  className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-colors"
                  title="Случайный эмодзи"
                >
                  <Sparkles size={12} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRemoveIcon}
                  className="h-6 w-6 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-red-400 cursor-pointer transition-colors"
                  title="Удалить эмодзи"
                >
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover action bar to add icon or cover if not present */}
      {!preview && (!icon || !hasCover) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 sm:gap-2 my-2 transition-opacity duration-150 select-none",
            "opacity-100 md:opacity-0 md:group-hover/header:opacity-100 md:focus-within:opacity-100"
          )}
        >
          {!icon && (
            <>
              <IconPicker asChild onChange={onChangeIcon}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Smile className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  <span>Добавить иконку</span>
                </Button>
              </IconPicker>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRandomEmoji}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Выбрать случайный эмодзи"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <span>Случайный эмодзи</span>
              </Button>
            </>
          )}

          {!hasCover && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddCover}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5 text-primary" />
              <span>Добавить обложку</span>
            </Button>
          )}
        </div>
      )}

      {/* Document Title (Заголовок документа) */}
      <div className="relative w-full">
        {preview ? (
          <h1 className="break-words text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {title || "Без названия"}
          </h1>
        ) : (
          <TextareaAutosize
            ref={titleInputRef}
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onEnterPress()
              }
            }}
            placeholder="Без названия"
            spellCheck="false"
            className="w-full resize-none break-words bg-transparent text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/35 outline-none border-none p-0 focus:ring-0 leading-tight"
          />
        )}
      </div>
    </div>
  )
}
