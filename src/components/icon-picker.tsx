"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes" 
import { Loader2 } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover" 
import type { IconPickerPorps } from "@/config/types/components.types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] w-[350px] max-w-[calc(100vw-1rem)] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" role="img" aria-label="Загрузка эмодзи" />
    </div>
  ),
})

export function IconPicker({
  onChange,
  children,
  asChild,
}: IconPickerPorps){
  const { resolvedTheme } = useTheme() 
  const theme = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="w-full border-none p-0 shadow-none">
        <EmojiPicker
          height={350}
          theme={theme as never}
          onEmojiClick={(data: { emoji: string }) => onChange(data.emoji)}
          emojiStyle={"twitter" as never}
        />
      </PopoverContent>
    </Popover>
  ) 
} 
