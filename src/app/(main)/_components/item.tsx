"use client"

import Twemoji from "react-twemoji"
import { Archive, ArrowRight, Calendar, Check, ChevronDown, ChevronRight, History, LucideIcon, MoreHorizontal, Pin, PinOff, Plus, Trash } from "lucide-react"
import { Id } from "../../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { pages } from "@/config/routing/pages.route"
import { formatLastEditTime, getCurrentEditTime } from "@/lib/last-edit-time"
import type { ItemProps } from "@/config/types/main.types";
import { createDocumentWithFallback, getCreateDocumentErrorMessage, getCreateDocumentLimitOptions } from "@/api/document-limit"

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
    creatorName,
    createdAt,
    shortcut,
    hasArrow,
    isPinned,
    isDragging,
    isCombineTarget,
    isArchiveTarget,
    isSelected,
    onSelect,
    isSelectionMode,
    selectedCount,
    isOtherSelectedDragging,
    className,
    draggableProps,
    dragHandleProps,
    innerRef,
}: ItemProps){
    const router = useRouter()
    const create = useMutation(api.document.create)
    const archive = useMutation(api.document.archive)
    const update = useMutation(api.document.update)
    const { user } = useUser()
    const { organization } = useOrganization()
    const { isOrg, isAdmin } = useWorkspaceAdmin()
    const orgId = isOrg ? organization?.id as string : user?.id as string

    const onTogglePin = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation()
        if (!id) return

        const promise = update({
            id,
            isPinned: !isPinned,
            userId: orgId,
            lastEditor: user?.username as string,
            lastEditTime: getCurrentEditTime(),
        })

        toast.promise(promise, {
            loading: isPinned ? "Открепляем заметку..." : "Закрепляем заметку...",
            success: isPinned ? "Заметка откреплена!" : "Заметка закреплена!",
            error: isPinned ? "Не удалось открепить заметку" : "Не удалось закрепить заметку",
        })
    }

    const onArchive = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation()
        if(!id) return
        if (isOrg && !isAdmin) {
            toast.error("Только администраторы могут архивировать заметки")
            return
        }
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

    return (
        <div 
            ref={innerRef}
            {...(draggableProps ?? {})}
            {...(dragHandleProps ?? {})}
            onClick={onClick} 
            role="button" 
            style={{paddingLeft: level ? `${(level * 12) + 12}px` : "12px"}} 
            className={cn(`group mb-0.5 flex min-h-[34px] w-full items-center rounded-xl py-1.5 pr-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 select-none`,
            active && "bg-gradient-to-r from-logo-yellow/20 to-logo-cyan/20 text-foreground shadow-sm",
            isSelected && "bg-logo-yellow/15 text-foreground ring-1 ring-logo-yellow/40",
            isOtherSelectedDragging && "opacity-40 ring-1 ring-dashed ring-logo-yellow/40",
            isDragging && "bg-white/95 dark:bg-zinc-900/95 shadow-xl ring-2 ring-logo-yellow/40 text-foreground",
            isCombineTarget && "bg-logo-yellow/20 dark:bg-logo-yellow/25 ring-2 ring-logo-yellow shadow-lg text-foreground border-logo-yellow/50",
            isArchiveTarget && "bg-red-500/15 dark:bg-red-500/25 ring-2 ring-red-500 text-red-600 dark:text-red-400 font-semibold shadow-lg",
            className
            )}
        >
            {!!id && onSelect && (
                <div
                    className={cn(
                        "flex items-center overflow-hidden shrink-0 transition-all duration-200 ease-in-out cursor-pointer",
                        isSelected
                            ? "w-5 opacity-100"
                            : "w-0 opacity-0 group-hover:w-5 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect(e)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isSelected ? "Снять выбор" : "Выбрать заметку"}
                >
                    <div 
                        role="checkbox" 
                        aria-checked={isSelected}
                        className={cn(
                            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                            isSelected
                                ? "border-logo-yellow bg-logo-yellow text-zinc-950 shadow-sm ring-1 ring-logo-yellow/50"
                                : "border-black/40 dark:border-white/40 hover:border-logo-yellow hover:scale-110 bg-background/50"
                        )}
                    >
                        {isSelected && (
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                        )}
                    </div>
                </div>
            )}
            
            {!!id && (
                <div 
                    role="button" 
                    className="mr-1 rounded-md p-0.5 hover:bg-background/70"
                    onClick={handleExpand}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/70"/>
                </div>
            )}
            {documentIcon ? (
                <div className="shrink-0 mr-2 text-[18px]">
                    <Twemoji options={{ className: "twemoji" }}>
                        {documentIcon}
                    </Twemoji>
                </div>
            ) : (
                <Icon className={cn("mr-2 h-[17px] w-[17px] shrink-0 text-muted-foreground", isArchiveTarget && "text-red-600 dark:text-red-400")}/>
            )}
            
            <span className="truncate">
                <Twemoji options={{ className: "twemoji" }}>
                    {label}
                </Twemoji>
            </span>

            {isPinned && (
                <Pin className="ml-1.5 h-3.5 w-3.5 shrink-0 rotate-45 text-amber-500 fill-amber-500/20 dark:text-amber-400 dark:fill-amber-400/20" />
            )}

            {isCombineTarget && (
                <span className="ml-1.5 shrink-0 rounded-md bg-logo-yellow/30 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    {selectedCount && selectedCount > 1 ? `Вложить (${selectedCount})` : "Вложить"}
                </span>
            )}
            {isArchiveTarget && (
                <span className="ml-1.5 shrink-0 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {selectedCount && selectedCount > 1 ? `В архив (${selectedCount})` : "В архив"}
                </span>
            )}
            {isDragging && selectedCount && selectedCount > 1 && (
                <div className="absolute -top-1.5 -right-1.5 z-50 flex h-5 min-w-5 items-center justify-center rounded-full bg-logo-yellow px-1.5 text-[10px] font-bold text-zinc-950 shadow-md ring-2 ring-white dark:ring-zinc-950">
                    {selectedCount}
                </div>
            )}
            


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
                            <div 
                                role="button" 
                                className="ml-auto rounded-md p-1 transition-colors duration-150 hover:bg-background/70"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground"/>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 rounded-2xl border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95" align="start" side="right" forceMount>
                            <DropdownMenuItem onClick={onTogglePin} className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10">
                                {isPinned ? (
                                    <>
                                        <PinOff className="h-4 w-4 text-muted-foreground"/>
                                        Открепить
                                    </>
                                ) : (
                                    <>
                                        <Pin className="h-4 w-4 text-muted-foreground"/>
                                        Закрепить
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1"/>
                            {isAdmin && (
                                <>
                                    <DropdownMenuItem onClick={onArchive} className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-medium gap-2.5 transition hover:bg-black/5 dark:hover:bg-white/10">
                                        <Archive className="h-4 w-4 text-muted-foreground"/>
                                        Архивировать
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1"/>
                                </>
                            )}
                            <div className="rounded-xl border border-black/5 bg-black/[0.03] p-2.5 dark:border-white/5 dark:bg-white/[0.04] space-y-2.5">
                                {(createdAt || creatorName) && (
                                    <>
                                        <div className="flex items-start gap-2.5">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground">Создана</span>
                                                    {createdAt && (
                                                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                                                            {formatLastEditTime(createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="truncate text-xs font-semibold text-foreground" title={creatorName || "Пользователь"}>
                                                    {creatorName || "Пользователь"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-black/[0.04] dark:bg-white/[0.06]" />
                                    </>
                                )}
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <History className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-[11px] font-medium text-muted-foreground">Изменена</span>
                                            {lastEditTime && (
                                                <span className="text-[10px] text-muted-foreground/70 font-mono">
                                                    {formatLastEditTime(lastEditTime)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="truncate text-xs font-semibold text-foreground" title={lastEditor || "—"}>
                                            {lastEditor || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div 
                        role="button" 
                        onClick={onCreate} 
                        className="ml-auto rounded-md p-1 transition-colors duration-150 hover:bg-background/70"
                        onMouseDown={(e) => e.stopPropagation()}
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
