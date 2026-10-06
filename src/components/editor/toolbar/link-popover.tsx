"use client"

import React, { useEffect, useRef, useState } from "react"
import { Unlink } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import type { LinkPopoverProps } from "@/config/types/editor.types"

export function LinkPopover({
  editor,
  isOpen,
  setIsOpen,
  children,
}: LinkPopoverProps) {
  const [url, setUrl] = useState("")
  const selectionRef = useRef<{ from: number; to: number } | null>(null)

  useEffect(() => {
    if (isOpen && editor) {
      const currentLink = editor.getAttributes("link").href || ""
      setUrl(currentLink)
      selectionRef.current = editor.state.selection
        ? { from: editor.state.selection.from, to: editor.state.selection.to }
        : null
    }
  }, [isOpen, editor])

  const handleApply = () => {
    const trimmed = url.trim()
    if (!trimmed) {
      handleRemove()
      return
    }
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    if (selectionRef.current && editor) {
      editor
        .chain()
        .setTextSelection(selectionRef.current)
        .focus()
        .extendMarkRange("link")
        .setLink({ href })
        .run()
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    toast.success("Ссылка сохранена")
    setIsOpen(false)
  }

  const handleRemove = () => {
    if (selectionRef.current && editor) {
      editor
        .chain()
        .setTextSelection(selectionRef.current)
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run()
    } else {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    }
    toast.success("Ссылка удалена")
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 p-3 shadow-xl rounded-xl border bg-popover"
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Вставить ссылку
            </span>
            {editor?.isActive("link") && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 text-[11px] text-destructive hover:underline cursor-pointer"
              >
                <Unlink size={11} />
                <span>Удалить ссылку</span>
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply()
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
