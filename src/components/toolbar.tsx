"use client"

import { ElementRef, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { ImageIcon, Smile, X } from "lucide-react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import Twemoji from "react-twemoji"

import { Button } from "./ui/button"
import { updateDocument } from "@/actions/update-document"
import { removeIcon as removeIconAction } from "@/actions/remove-icon"
import { useAction } from "@/hooks/use-action"
import { IconPicker } from "./icon-picker"
import { useCoverImage } from "./hooks/use-cover-image"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import type { ToolbarProps } from "@/config/types/components.types"

export function Toolbar({ initialData, preview }: ToolbarProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<ElementRef<"textarea">>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialData.title)
  const { user } = useUser()
  const { organization } = useOrganization()
  const orgId = organization?.id !== undefined ? organization.id : user?.id as string

  const { execute: executeUpdate } = useAction(updateDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", initialData._id] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })

  const { execute: executeRemoveIcon } = useAction(removeIconAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", initialData._id] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })

  const coverImage = useCoverImage()

  const enableInput = () => {
    if (preview) return

    setIsEditing(true)
    setTimeout(() => {
      setValue(initialData.title)
      inputRef.current?.focus()
    }, 0)
  }

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const saveTitle = (newTitle: string) => {
    const trimmed = newTitle.trim() || "Новая заметка"
    if (trimmed === initialData.title) return
    executeUpdate({
      id: initialData._id,
      title: trimmed,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    })
  }

  const disableInput = () => {
    setIsEditing(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    saveTitle(value)
  }

  const onInput = (val: string) => {
    setValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveTitle(val)
    }, 400)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      disableInput()
    }
  }

  const onIconSelect = (icon: string) => {
    executeUpdate({
      id: initialData._id,
      icon,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    })
  }

  const onRemoveIcon = () => {
    executeRemoveIcon({
      id: initialData._id,
      userId: orgId,
    })
  }

  return (
    <Twemoji options={{ className: "twemoji-lg" }}>
      <div className="group relative pl-12">
        {!!initialData.icon && !preview && (
          <div className="group/icon flex items-center gap-x-2 pt-6">
            <IconPicker onChange={onIconSelect}>
              <p className="text-6xl transition hover:opacity-75">
                {initialData.icon}
              </p>
            </IconPicker>
            <Button
              onClick={onRemoveIcon}
              className="rounded-full text-xs text-muted-foreground opacity-0 transition group-hover/icon:opacity-100"
              variant="outline"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!!initialData.icon && preview && (
          <p className="pt-6 text-6xl">{initialData.icon}</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-1 my-2 group-hover:opacity-100 md:opacity-0">
          {!initialData.icon && !preview && (
            <IconPicker asChild onChange={onIconSelect}>
              <Button
                className="text-xs text-muted-foreground"
                variant="outline"
                size="sm"
              >
                <Smile className="mr-2 h-4 w-4" />
                Добавить иконку
              </Button>
            </IconPicker>
          )}
          {!initialData.coverImage && !preview && (
            <Button
              onClick={coverImage.onOpen}
              className="text-xs text-muted-foreground"
              variant="outline"
              size="sm"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Добавить обложку
            </Button>
          )}
        </div>
        {isEditing && !preview ? (
          <TextareaAutosize
            ref={inputRef}
            spellCheck="false"
            onBlur={disableInput}
            onKeyDown={onKeyDown}
            value={value}
            onChange={(e) => onInput(e.target.value)}
            className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
          />
        ) : (
          <div
            onClick={enableInput}
            className="break-words pb-[.7188rem] text-5xl font-bold  text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
          >
            {initialData.title}
          </div>
        )}
      </div>
    </Twemoji>
  )
}
