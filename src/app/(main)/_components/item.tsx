"use client"

import { Archive, ArrowRight, ChevronDown, ChevronRight, LucideIcon, MoreHorizontal, Plus, Trash } from "lucide-react"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Protect, useOrganization, useUser } from "@clerk/nextjs"
import { pages } from "@/config/routing/pages.route"
import { formatLastEditTime, getCurrentEditTime } from "@/lib/last-edit-time"
import type { ItemProps } from "@/config/types/main.types";
import { createDocumentWithFallback, getCreateDocumentErrorMessage, getCreateDocumentLimitOptions } from "../../api/document-limit"

export function Item({
    label, 
    onClick, 
    icon: Icon,
    id,
    active,
    documentIcon,
    isSearch,
    level = 0,
    onExpand,
    expanded,
    lastEditor,
    lastEditTime,
    shortcut,
    hasArrow
}: ItemProps){
    const router = useRouter()
    const create = useMutation(api.document.create)
    const archive = useMutation(api.document.archive)
    const update = useMutation(api.document.update)
    const { user } = useUser()
    const { organization } = useOrganization()
    const isOrg = organization?.id !== undefined
    const orgId = isOrg ? organization?.id as string : user?.id as string

    const onArchive = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation()
        if(!id) return
        update({
            id: id,
            isPublished: false,
            userId: orgId,
            lastEditor: user?.username as string,
            lastEditTime: getCurrentEditTime()
        })
        const promise = archive({
            id, 
            userId: orgId
        })
        .then(() => router.push(pages.DASHBOARD()))

        toast.promise(promise, {
            loading: "Перемещаем в архив...",
            success: "Заметка перемещена в архив!",
            error: "Не удалось переместить в архив"
        })
    }

    const handleExpand = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation()
        onExpand?.()
    }

    const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        if (!id) return;
    
        const promise = getCreateDocumentLimitOptions(orgId, isOrg)
            .then((limitOptions) => createDocumentWithFallback(create, {
                title: "Новая заметка",
                parentDocument: id,
                userId: orgId,
                lastEditor: user?.username as string,
                creatorName: isOrg ? organization?.slug ?? "" : user?.username ?? "",
                lastEditTime: getCurrentEditTime(),
                ...limitOptions,
            })).then((documentId) => {
            if (!expanded) {
                onExpand?.()
            }
            router.push(pages.DASHBOARD(documentId))
            return documentId
        })

        toast.promise(promise, {
            loading: "Создание заметки...",
            success: "Заметка успешно создана!",
            error: getCreateDocumentErrorMessage
        })
    }    

    const ChevronIcon = expanded ? ChevronDown : ChevronRight
    
    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        if (id) {
            event.dataTransfer.setData("text/plain", id as Id<"documents">)
            event.dataTransfer.effectAllowed = "move"
        }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const draggedId = event.dataTransfer.getData("text/plain")
        
        if (draggedId && id && draggedId != id) {
            const promise = update({ 
                id: draggedId as Id<"documents">, 
                parentDocument: id as Id<"documents">,
                userId: orgId,
                lastEditor: user?.username as string,
                lastEditTime: getCurrentEditTime()
            })
            
            toast.promise(promise, {
                loading: "Перемещаем...",
                success: "Заметка успешно перемещена!",
                error: "Не удалось переместить заметку"
            })
        }
    }

    return (
        <div 
            onClick={onClick} 
            role="button" 
            style={{paddingLeft: level ? `${(level * 12) + 12}px` : "12px"}} 
            className={cn(`group mb-0.5 flex min-h-[34px] w-full items-center rounded-xl py-1.5 pr-2 text-sm font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10`,
            active && "bg-gradient-to-r from-logo-yellow/20 to-logo-cyan/20 text-foreground shadow-sm"
            )}
            draggable={id === undefined ? false : true}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            
            {!!id && (
                <div 
                    role="button" 
                    className="mr-1 rounded-md p-0.5 hover:bg-background/70"
                    onClick={handleExpand}
                >
                    <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/70"/>
                </div>
            )}
            {documentIcon ? (
                <div className="shrink-0 mr-2 text-[18px]">
                    {documentIcon}
                </div>
            ) : (
                <Icon className="mr-2 h-[17px] w-[17px] shrink-0 text-muted-foreground"/>
            )}
            
            <span className="truncate">
                {label}
            </span>
            


            {isSearch && (
                <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/60 bg-background/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">Ctrl</span>S
                </kbd>
            )}
            {shortcut && (
                <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/60 bg-background/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">Ctrl</span>{shortcut.toUpperCase()}
                </kbd>
            )}
            {hasArrow && (
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 -translate-x-1 group-hover:translate-x-0 group-hover:text-foreground" />
            )}

            {!!id && (
                <div className="ml-auto flex items-center gap-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div role="button" className="ml-auto rounded-md p-1 transition hover:bg-background/70">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground"/>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60 rounded-xl border-white/60 bg-white/95 shadow-xl dark:border-white/10 dark:bg-zinc-950/95" align="start" side="right" forceMount>
                            <Protect
                                condition={(check) => {
                                    return check({
                                        role: "org:admin"
                                    }) || organization?.id === undefined
                                }}
                                fallback={<></>}
                            >
                                <DropdownMenuItem onClick={onArchive}>
                                    <Archive className="h-4 w-4"/>
                                    Архивировать
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                            </Protect>
                                <div className="text-xs text-muted-foreground p-2">
                                    Последнее изменение от: {lastEditor}
                                </div>
                                <div className="text-xs text-muted-foreground px-2 pb-2">
                                    Последние изменение в: {formatLastEditTime(lastEditTime)}
                                </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div 
                        role="button" 
                        onClick={onCreate} 
                        className="ml-auto rounded-md p-1 transition hover:bg-background/70"
                    >
                        <Plus className="h-4 w-4 text-muted-foreground"/>
                    </div>
                </div>
            )}
            
        </div>
    )
}

Item.Skeleton = function ItemSkeleton({level}: {level?: number}){
    return (
        <div
            style={{
                paddingLeft: level ? `${(level * 12) + 12}px` : "12px"
            }}
            className="my-1"
        >
            <div className="flex min-h-[34px] items-center gap-x-2 rounded-xl px-2 py-1.5">
                <Skeleton className="h-4 w-4 rounded-md bg-primary/8" />
                <div className="flex flex-1 items-center gap-x-2">
                    <Skeleton className="h-4 w-[58%] rounded-full bg-primary/8" />
                    <Skeleton className="ml-auto h-5 w-9 rounded-md bg-primary/8" />
                </div>
            </div>
        </div>
    )
}
