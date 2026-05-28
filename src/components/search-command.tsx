"use client"

import { useEffect, useState } from "react"
import { File } from "lucide-react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import Twemoji from "react-twemoji"

import { api } from "../../convex/_generated/api"
import { pages } from "@/config/routing/pages.route"
import { useSearch } from "./hooks/use-search"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function SearchCommand() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()
  const orgId = organization?.id ?? (user?.id as string | undefined)
  const toggle = useSearch((store) => store.toggle)
  const isOpen = useSearch((store) => store.isOpen)
  const onClose = useSearch((store) => store.onClose)
  const documents = useQuery(
    api.document.getSearch,
    isOpen && orgId ? { userId: orgId } : "skip"
  )
  const [isMounted, setIsMounted] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [toggle])

  const onSelect = (id: string) => {
    router.push(pages.DASHBOARD(id))
    onClose()
  }

  if (!isMounted) {
    return null
  }

  const filteredDocuments = documents?.filter((document) => {
    if (!searchValue.trim()) return true

    const queryWords = searchValue.toLowerCase().split(/\s+/).filter(Boolean)
    const title = document.title.toLowerCase()
    return queryWords.every((word) => title.includes(word))
  })

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput
        placeholder="Поиск по заметкам"
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        {filteredDocuments && filteredDocuments.length > 0 && (
          <CommandGroup heading="Заметки">
            {filteredDocuments.map((document) => (
              <CommandItem
                key={document._id}
                value={document.title}
                title={document.title}
                onSelect={() => onSelect(document._id)}
              >
                <Twemoji options={{ className: "twemoji" }}>
                  {document.icon ? (
                    <p className="mr-2 text-[1.125rem]">{document.icon}</p>
                  ) : (
                    <File className="mr-2 h-4 w-4" />
                  )}
                </Twemoji>
                <span>{document.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
