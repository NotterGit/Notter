"use client" 

import { useMutation, useQuery } from "convex/react" 
import { Loader2, Search, Trash, Undo } from "lucide-react" 
import { useParams, useRouter } from "next/navigation" 
import { useState } from "react" 
import { toast } from "react-hot-toast"
import { api } from "../../../../convex/_generated/api" 
import { Id } from "../../../../convex/_generated/dataModel" 
import { Input } from "@/components/ui/input" 
import { ConfirmModal } from "@/components/modal/confirm-modal" 
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Protect, useOrganization, useUser } from "@clerk/nextjs"
import { pages } from "@/config/routing/pages.route"

export function TrashBox(){
  const router = useRouter() 
  const params = useParams() 
  const { user } = useUser()
  const { organization } = useOrganization()
  const orgId = organization?.id !== undefined ? organization?.id as string : user?.id as string
  const documents = useQuery(api.document.getTrash, {
    userId: orgId
  })
  const restore = useMutation(api.document.restore) 
  const remove = useMutation(api.document.remove) 

  const [search, setSearch] = useState("") 

  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase()) 
  }) 

  const onClick = (documentId: string) => {
    router.push(pages.DASHBOARD(documentId)) 
  } 

  const onRestore = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    documentId: Id<"documents">,
  ) => {
    event.stopPropagation() 
    const promise = restore({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
      loading: "Восстановляем...",
      success: "Заметка восстановлена!",
      error: "Не удалось восстановить",
    }) 
  } 

  const onRemove = (documentId: Id<"documents">) => {
    const promise = remove({
      id: documentId,
      userId: orgId
    }) 

    toast.promise(promise, {
      loading: "Удаляем заметку...",
      success: "Заметка удалена!",
      error: "Не удалось удалить",
    }) 

    if (params.documentId === documentId) {
      router.push(pages.DASHBOARD()) 
    }
  }

  const removeAll = () => {

    router.push(pages.DASHBOARD())

    let promise: any
    documents?.map((document) => {
      promise = remove({
        id: document._id,
        userId: orgId
      }) 
    })

    toast.promise(promise, {
      loading: "Очищаем...",
      success: "Архив очищен!",
      error: "Не удалось очистить",
    }) 
  }

  if (documents === undefined) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        aria-busy="true"
        aria-label="Загрузка..."
      >
        <Loader2 className="w-8 h-8 animate-spin"/>
      </div>
    ) 
  }

  return (
    <section className="flex h-full flex-col text-sm">
      <div className="flex items-center gap-x-2 border-b border-black/5 p-3 dark:border-white/10">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 rounded-lg border-border/60 bg-background/70 px-3 focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Поиск заметок по названию"
          aria-label="Поиск заметок по названию"
        />
      </div>
      <div
        className="mt-2 px-1 pb-1 flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 120px)" }}
      >
        {filteredDocuments?.length === 0 && (
          <p className="pb-2 text-center text-xs text-muted-foreground">
            Ничего не найдено
          </p>
        )}
        {filteredDocuments?.map((document) => (
          <button
            key={document._id}
            onClick={() => onClick(document._id)}
            className="flex w-full items-center justify-between rounded-lg px-1 text-sm text-primary transition hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Заметки"
          >
            <span className="truncate pl-2 my-3">{document.title}</span>
            <div className="flex items-center">
              <Protect
                    condition={(check) => {
                        return check({
                            role: "org:admin"
                        }) || document?.userId === user?.id
                    }}
                    fallback={<></>}
              >
              <button
                onClick={(e) => onRestore(e, document._id)}
                className="rounded-md p-2 hover:bg-background/80"
                aria-label="Восстановить заметку"
              >
                <Undo className="h-4 w-4 text-muted-foreground " />
              </button>
                <ConfirmModal onConfirm={() => onRemove(document._id)}>
                  <button
                    className="rounded-md p-2 hover:bg-background/80"
                    aria-label="Удалить безвозвратно"
                  >
                    <Trash className="h-4 w-4 text-muted-foreground"/>
                  </button>
                </ConfirmModal>
              </Protect>
            </div>
          </button>
        ))}
        
        <Protect
            condition={(check) => {
                return check({
                    role: "org:admin"
                }) || organization?.id === undefined
            }}
            fallback={<></>}
        >
          {filteredDocuments?.length !== 0 && (
            <>
              <Separator className="my-2"/>
              <ConfirmModal onConfirm={() => removeAll()}>
                <div className="flex justify-center items-center">
                  <Button className="h-8 w-40 rounded-lg">
                    Очистить <Trash/>
                  </Button>
                </div>
              </ConfirmModal>
            </>
          )}
        </Protect>
      </div>
    </section>
  ) 
} 