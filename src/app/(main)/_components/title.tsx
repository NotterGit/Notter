"use client"

import { ChangeEvent, useRef, useState } from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import Twemoji from "react-twemoji"

import { updateDocument } from "@/actions/update-document"
import { useAction } from "@/hooks/use-action"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import VerifedBadge from "@/app/(profile)/_components/verifed"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import type { TitleProps } from "@/config/types/main.types"

export function Title({ initialData }: TitleProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useUser()
  const { organization } = useOrganization()
  const orgId = organization?.id !== undefined ? organization.id : user?.id as string

  const { execute: executeUpdate } = useAction(updateDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", initialData._id] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })
  const [title, setTitle] = useState(initialData.title || "Новая заметка")
  const [isEditing, setIsEditing] = useState(false)
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

  const enableInput = () => {
    setTitle(initialData.title)
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length)
    }, 0)
  }

  const disabledInput = () => {
    setIsEditing(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    saveTitle(title)
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value
    setTitle(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveTitle(val)
    }, 400)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      disabledInput()
    }
  }

  return (
    <Twemoji options={{ className: "twemoji" }}>
      <div className="flex items-center gap-x-1">
        {!!initialData.icon && <p>{initialData.icon}</p>}
        {isEditing ? (
          <Input
            ref={inputRef}
            onClick={enableInput}
            onBlur={disabledInput}
            onChange={onChange}
            onKeyDown={onKeyDown}
            value={title}
            className="h-8 rounded-lg border-border/60 bg-background/70 px-2.5 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          />
        ) : (
          <div className="flex flex-row items-center gap-1">
            <Button
              onClick={enableInput}
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2.5 font-normal hover:bg-black/5 dark:hover:bg-white/10"
            >
              <span className="truncate text-sm">{initialData?.title}</span>
            </Button>
            {initialData.verifed && (
              <VerifedBadge text="Заметка верифицирована командой Qualsu" size={4} clicked={true} down={true} />
            )}
          </div>
        )}
      </div>
    </Twemoji>
  )
}

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />
}
