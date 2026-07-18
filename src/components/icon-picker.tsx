"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes" 

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover" 
import type { IconPickerPorps } from "@/config/types/components.types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="h-[350px] w-[350px]" />,
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
