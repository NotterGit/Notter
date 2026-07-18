"use client"

import { ChangeEvent, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { useOrganization, useUser } from "@clerk/nextjs"
import Twemoji from "react-twemoji"

import { api } from "../../../../convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import VerifedBadge from "@/app/(profile)/_components/verifed"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import type { TitleProps } from "@/config/types/main.types"

export function Title({ initialData }: TitleProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const update = useMutation(api.document.update)
  const { user } = useUser()
  const { organization } = useOrganization()
  const orgId = organization?.id !== undefined ? organization.id : user?.id as string
  const [title, setTitle] = useState(initialData.title || "Новая заметка")
  const [isEditing, setIsEditing] = useState(false)

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
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
    update({
      id: initialData._id,
      title: event.target.value || "Новая заметка",
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    })
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
