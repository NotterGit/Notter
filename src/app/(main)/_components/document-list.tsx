"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useMutation, useQuery } from "convex/react"
import { Archive, FileIcon, Plus } from "lucide-react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useMediaQuery } from "usehooks-ts"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
} from "@hello-pangea/dnd"
import toast from "react-hot-toast"

import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { Item } from "./item"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TrashBox } from "./trash-box"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { cn } from "@/lib/utils"
import { pages } from "@/config/routing/pages.route"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import type { DocumentListProps } from "@/config/types/main.types"
import {
  buildChildrenMap,
  flattenTree,
  getTargetPlacement,
  isDescendant,
} from "@/lib/document-tree"

export function DocumentList({
  level = 0,
  onCreateDocument,
}: DocumentListProps) {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const reorder = useMutation(api.document.reorder)
  const archive = useMutation(api.document.archive)
  const update = useMutation(api.document.update)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [draggingDocId, setDraggingDocId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [lastSelectedDocId, setLastSelectedDocId] = useState<string | null>(null)

  const orgId = organization?.id !== undefined ? organization.id : (user?.id as string)

  const documents = useQuery(api.document.getAllSidebar, {
    userId: orgId,
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onExpand = (documentId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [documentId]: !prev[documentId],
    }))
  }

  const onRedirect = (documentId: string) => {
    router.push(pages.DASHBOARD(documentId))
  }

  const childrenMap = useMemo(() => {
    return buildChildrenMap(documents)
  }, [documents])

  const draggingDocIds = useMemo(() => {
    if (!draggingDocId) return null
    if (selectedDocIds.has(draggingDocId)) {
      return selectedDocIds
    }
    return draggingDocId
  }, [draggingDocId, selectedDocIds])

  const visibleItems = useMemo(() => {
    return flattenTree("root", level, childrenMap, expanded, draggingDocIds)
  }, [childrenMap, expanded, level, draggingDocIds])

  const onSelect = (documentId: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && lastSelectedDocId && lastSelectedDocId !== documentId) {
      const lastIndex = visibleItems.findIndex((item) => item.doc._id === lastSelectedDocId)
      const currentIndex = visibleItems.findIndex((item) => item.doc._id === documentId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangeIds = visibleItems.slice(start, end + 1).map((item) => item.doc._id)

        setSelectedDocIds((prev) => {
          const next = new Set(prev)
          for (const id of rangeIds) {
            next.add(id)
          }
          return next
        })
        setLastSelectedDocId(documentId)
        return
      }
    }

    setSelectedDocIds((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) {
        next.delete(documentId)
      } else {
        next.add(documentId)
      }
      return next
    })
    setLastSelectedDocId(documentId)
  }

  const onSelectAll = () => {
    if (!visibleItems.length) return
    const allIds = visibleItems.map((item) => item.doc._id)
    setSelectedDocIds(new Set(allIds))
  }

  const onClearSelection = () => {
    setSelectedDocIds(new Set())
    setLastSelectedDocId(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDocIds.size > 0) {
        onClearSelection()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedDocIds.size])

  const onDragStart = (start: DragStart) => {
    setDraggingDocId(start.draggableId)
  }

  const onDragEnd = (result: DropResult) => {
    setDraggingDocId(null)
    const { destination, source, draggableId, combine } = result

    if (!documents) return

    const isSelectionDrag = selectedDocIds.has(draggableId)
    const movingIds = isSelectionDrag
      ? (Array.from(selectedDocIds) as Id<"documents">[])
      : [draggableId as Id<"documents">]

    // 1. Handled dropping to archive
    if (destination?.droppableId === "archive-drop-target") {
      if (isOrg && !isAdmin) {
        toast.error("Только администраторы могут архивировать заметки")
        return
      }

      const movingDocs = documents.filter((d) => movingIds.includes(d._id))
      if (!movingDocs.length) return

      for (const doc of movingDocs) {
        void update({
          id: doc._id,
          isPublished: false,
          userId: orgId,
          lastEditor: user?.username as string,
          lastEditTime: getCurrentEditTime(),
        })
      }

      const promise = Promise.all(
        movingDocs.map((doc) =>
          archive({
            id: doc._id,
            userId: orgId,
          })
        )
      ).then(() => {
        const currentDocId =
          typeof params?.documentId === "string" ? params.documentId : undefined
        if (
          currentDocId &&
          (movingIds.includes(currentDocId as Id<"documents">) ||
            movingIds.some((id) => isDescendant(id, currentDocId, documents)))
        ) {
          router.push(pages.DASHBOARD())
        }
        onClearSelection()
      })

      const count = movingDocs.length
      toast.promise(promise, {
        loading: count > 1 ? "Перемещаем заметки в архив..." : "Перемещаем в архив...",
        success:
          count > 1
            ? `Заметки перемещены в архив (${count})!`
            : "Заметка перемещена в архив!",
        error: "Не удалось переместить в архив",
      })
      return
    }

    // 2. Handled nesting (combine onto another note)
    if (combine) {
      const targetParentId = combine.draggableId as Id<"documents">

      if (movingIds.includes(targetParentId)) {
        toast.error("Нельзя переместить заметку внутрь самой себя")
        return
      }

      if (movingIds.some((id) => isDescendant(id, targetParentId, documents))) {
        toast.error("Нельзя переместить заметку внутрь её дочерних заметок")
        return
      }

      const movingDocs = documents.filter((d) => movingIds.includes(d._id))
      if (!movingDocs.length) return

      // Source updates for all affected parents
      const sourceParentKeys = new Set<string>()
      for (const doc of movingDocs) {
        const pKey = doc.parentDocument ? (doc.parentDocument as string) : "root"
        if (pKey !== targetParentId) {
          sourceParentKeys.add(pKey)
        }
      }

      let sourceUpdates: Array<{
        id: Id<"documents">
        order: number
        parentDocument?: Id<"documents">
      }> = []

      for (const pKey of sourceParentKeys) {
        const pId = pKey === "root" ? undefined : (pKey as Id<"documents">)
        const siblings = (childrenMap.get(pKey) || []).filter(
          (d) => !movingIds.includes(d._id)
        )
        const updates = siblings.map((doc, index) => ({
          id: doc._id,
          order: index,
          parentDocument: pId,
        }))
        sourceUpdates = [...sourceUpdates, ...updates]
      }

      const targetSiblings = (childrenMap.get(targetParentId) || []).filter(
        (d) => !movingIds.includes(d._id)
      )

      const targetUpdates = movingDocs.map((doc, index) => ({
        id: doc._id,
        order: targetSiblings.length + index,
        parentDocument: targetParentId,
      }))

      setExpanded((prev) => ({
        ...prev,
        [targetParentId]: true,
      }))

      const promise = reorder({
        userId: orgId,
        items: [...sourceUpdates, ...targetUpdates],
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
      }).then(() => {
        onClearSelection()
      })

      const count = movingDocs.length
      toast.promise(promise, {
        loading: count > 1 ? "Перемещение заметок внутрь..." : "Перемещение внутрь заметки...",
        success: count > 1 ? `Заметки перемещены внутрь (${count})` : "Заметка перемещена внутрь",
        error: "Не удалось переместить заметку",
      })
      return
    }

    // 3. Handled reordering or dropping between notes
    if (!destination) {
      return
    }

    if (destination.index === source.index && !isSelectionDrag) {
      return
    }

    if (movingIds.length === 1) {
      const singleId = movingIds[0]
      const draggedDoc = documents.find((d) => d._id === singleId)
      if (!draggedDoc) return

      const { targetParentId, targetOrder } = getTargetPlacement(
        singleId,
        destination.index,
        visibleItems,
        childrenMap
      )

      if (targetParentId === singleId) {
        toast.error("Нельзя переместить заметку внутрь самой себя")
        return
      }

      if (isDescendant(singleId, targetParentId, documents)) {
        toast.error("Нельзя переместить заметку внутрь её дочерних заметок")
        return
      }

      const sourceParentId = draggedDoc.parentDocument
        ? (draggedDoc.parentDocument as Id<"documents">)
        : undefined

      const isSameParent = sourceParentId === targetParentId

      const sourceSiblings = (childrenMap.get(sourceParentId ?? "root") || [])
        .filter((d) => d._id !== singleId)

      let itemsToUpdate: Array<{
        id: Id<"documents">
        order: number
        parentDocument?: Id<"documents">
      }> = []

      if (isSameParent) {
        const newSiblings = Array.from(sourceSiblings)
        const clampedOrder = Math.max(0, Math.min(targetOrder, newSiblings.length))
        newSiblings.splice(clampedOrder, 0, draggedDoc)

        itemsToUpdate = newSiblings.map((doc, index) => ({
          id: doc._id,
          order: index,
          parentDocument: sourceParentId,
        }))
      } else {
        const sourceUpdates = sourceSiblings.map((doc, index) => ({
          id: doc._id,
          order: index,
          parentDocument: sourceParentId,
        }))

        const targetSiblings = (childrenMap.get(targetParentId ?? "root") || [])
          .filter((d) => d._id !== singleId)
        const clampedOrder = Math.max(0, Math.min(targetOrder, targetSiblings.length))
        targetSiblings.splice(clampedOrder, 0, draggedDoc)

        const targetUpdates = targetSiblings.map((doc, index) => ({
          id: doc._id,
          order: index,
          parentDocument: targetParentId,
        }))

        itemsToUpdate = [...sourceUpdates, ...targetUpdates]

        if (targetParentId) {
          setExpanded((prev) => ({
            ...prev,
            [targetParentId]: true,
          }))
        }
      }

      const promise = reorder({
        userId: orgId,
        items: itemsToUpdate,
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
      }).then(() => {
        onClearSelection()
      })

      toast.promise(promise, {
        loading: "Перемещение заметки...",
        success: "Порядок заметок обновлен",
        error: "Не удалось переместить заметку",
      })
      return
    }

    // Multi-item reordering between notes
    const movingDocs = documents.filter((d) => movingIds.includes(d._id))
    if (!movingDocs.length) return

    const movingIdSet = new Set(movingIds)
    const { targetParentId, targetOrder } = getTargetPlacement(
      movingIdSet,
      destination.index,
      visibleItems,
      childrenMap
    )

    if (targetParentId && movingIdSet.has(targetParentId)) {
      toast.error("Нельзя переместить заметки внутрь себя")
      return
    }

    if (movingIds.some((id) => isDescendant(id, targetParentId, documents))) {
      toast.error("Нельзя переместить заметки внутрь их дочерних заметок")
      return
    }

    const sourceParentKeys = new Set<string>()
    for (const doc of movingDocs) {
      const pKey = doc.parentDocument ? (doc.parentDocument as string) : "root"
      sourceParentKeys.add(pKey)
    }

    let sourceUpdates: Array<{
      id: Id<"documents">
      order: number
      parentDocument?: Id<"documents">
    }> = []

    for (const pKey of sourceParentKeys) {
      const pId = pKey === "root" ? undefined : (pKey as Id<"documents">)
      if (pId === targetParentId) continue

      const siblings = (childrenMap.get(pKey) || []).filter(
        (d) => !movingIdSet.has(d._id)
      )
      const updates = siblings.map((doc, index) => ({
        id: doc._id,
        order: index,
        parentDocument: pId,
      }))
      sourceUpdates = [...sourceUpdates, ...updates]
    }

    const targetParentKey = targetParentId ?? "root"
    const targetSiblings = (childrenMap.get(targetParentKey) || []).filter(
      (d) => !movingIdSet.has(d._id)
    )
    const newTargetSiblings = Array.from(targetSiblings)
    const clampedOrder = Math.max(0, Math.min(targetOrder, newTargetSiblings.length))
    newTargetSiblings.splice(clampedOrder, 0, ...movingDocs)

    const targetUpdates = newTargetSiblings.map((doc, index) => ({
      id: doc._id,
      order: index,
      parentDocument: targetParentId,
    }))

    if (targetParentId) {
      setExpanded((prev) => ({
        ...prev,
        [targetParentId]: true,
      }))
    }

    const promise = reorder({
      userId: orgId,
      items: [...sourceUpdates, ...targetUpdates],
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
    }).then(() => {
      onClearSelection()
    })

    toast.promise(promise, {
      loading: "Перемещение заметок...",
      success: `Порядок заметок обновлен (${movingDocs.length})`,
      error: "Не удалось переместить заметки",
    })
  }

  if (documents === undefined) {
    return (
      <>
        <Item.Skeleton level={level} />
        <Item.Skeleton level={level} />
        <Item.Skeleton level={level} />
        {onCreateDocument && (
          <Item onClick={onCreateDocument} icon={Plus} label="Добавить заметку" />
        )}
        <div className="mt-2">
          <Item label="Архив" icon={Archive} />
        </div>
      </>
    )
  }

  const isSelectionMode = selectedDocIds.size > 0

  if (!isMounted) {
    return (
      <>
        {isSelectionMode && (
          <div className="mb-2 flex items-center justify-between gap-1.5 rounded-xl border border-logo-yellow/30 bg-logo-yellow/10 px-2 py-1.5 text-xs backdrop-blur-md dark:border-logo-yellow/20 dark:bg-logo-yellow/15 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-logo-yellow px-1 text-[10px] font-bold text-zinc-950">
                {selectedDocIds.size}
              </span>
              <span className="text-[11px]">Выбрано</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSelectAll}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                Все
              </button>
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                Снять
              </button>
            </div>
          </div>
        )}
        {visibleItems.map((item) => (
          <Item
            key={item.doc._id}
            id={item.doc._id}
            onClick={() => onRedirect(item.doc._id)}
            label={item.doc.title}
            icon={FileIcon}
            documentIcon={item.doc.icon}
            active={params.documentId === item.doc._id}
            level={item.level}
            onExpand={() => onExpand(item.doc._id)}
            expanded={item.isExpanded}
            lastEditor={item.doc.lastEditor as string}
            lastEditTime={item.doc.lastEditTime as string}
            creatorName={(item.doc.userName || item.doc.creatorName) as string}
            createdAt={item.doc._creationTime}
            verified={item.doc.verifed}
            isPinned={item.doc.isPinned}
            isSelected={selectedDocIds.has(item.doc._id)}
            onSelect={(e) => onSelect(item.doc._id, e)}
            isSelectionMode={isSelectionMode}
          />
        ))}
        {onCreateDocument && (
          <Item onClick={onCreateDocument} icon={Plus} label="Добавить заметку" />
        )}
        <Popover>
          <PopoverTrigger className="mt-2 w-full">
            <Item label="Архив" icon={Archive} />
          </PopoverTrigger>
          <PopoverContent
            className="z-[99999] w-80 rounded-2xl border-white/60 bg-white/90 p-0 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90"
            side={isMobile ? "bottom" : "right"}
          >
            <TrashBox />
          </PopoverContent>
        </Popover>
      </>
    )
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {isSelectionMode && (
        <div className="mb-2 flex items-center justify-between gap-1.5 rounded-xl border border-logo-yellow/30 bg-logo-yellow/10 px-2 py-1.5 text-xs backdrop-blur-md dark:border-logo-yellow/20 dark:bg-logo-yellow/15 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-logo-yellow px-1 text-[10px] font-bold text-zinc-950">
              {selectedDocIds.size}
            </span>
            <span className="text-[11px]">Выбрано</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              Все
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              Снять
            </button>
          </div>
        </div>
      )}

      <Droppable droppableId="document-tree-root" type="document" isCombineEnabled>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[4px] rounded-xl transition-colors duration-150 py-0.5",
              snapshot.isDraggingOver && "bg-logo-yellow/10 dark:bg-logo-yellow/15 ring-2 ring-logo-yellow/30"
            )}
          >
            {visibleItems.map((item, index) => (
              <Draggable
                key={item.doc._id}
                draggableId={item.doc._id}
                index={index}
              >
                {(provided, snapshot) => {
                  const itemElement = (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        ...(snapshot.isDragging
                          ? {
                              zIndex: 999999,
                              pointerEvents: "none",
                            }
                          : {}),
                      }}
                      className={cn(
                        "relative",
                        snapshot.isDragging && "opacity-95 shadow-2xl"
                      )}
                    >
                      <Item
                        id={item.doc._id}
                        onClick={() => onRedirect(item.doc._id)}
                        label={item.doc.title}
                        icon={FileIcon}
                        documentIcon={item.doc.icon}
                        active={params.documentId === item.doc._id}
                        level={item.level}
                        onExpand={() => onExpand(item.doc._id)}
                        expanded={item.isExpanded}
                        lastEditor={item.doc.lastEditor as string}
                        lastEditTime={item.doc.lastEditTime as string}
                        creatorName={(item.doc.userName || item.doc.creatorName) as string}
                        createdAt={item.doc._creationTime}
                        verified={item.doc.verifed}
                        isPinned={item.doc.isPinned}
                        isDragging={snapshot.isDragging}
                        isCombineTarget={Boolean(snapshot.combineTargetFor)}
                        isSelected={selectedDocIds.has(item.doc._id)}
                        onSelect={(e) => onSelect(item.doc._id, e)}
                        isSelectionMode={isSelectionMode}
                        selectedCount={
                          selectedDocIds.has(draggingDocId ?? "")
                            ? selectedDocIds.size
                            : (selectedDocIds.has(item.doc._id) ? selectedDocIds.size : undefined)
                        }
                        isOtherSelectedDragging={Boolean(
                          draggingDocId &&
                          selectedDocIds.has(draggingDocId) &&
                          selectedDocIds.has(item.doc._id) &&
                          draggingDocId !== item.doc._id
                        )}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )

                  if (snapshot.isDragging && typeof window !== "undefined") {
                    return createPortal(itemElement, window.document.body)
                  }

                  return itemElement
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {onCreateDocument && (
        <Item onClick={onCreateDocument} icon={Plus} label="Добавить заметку" />
      )}

      <Droppable droppableId="archive-drop-target" type="document">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="mt-2"
          >
            <Popover>
              <PopoverTrigger asChild className="w-full">
                <div>
                  <Item
                    label={snapshot.isDraggingOver ? "Переместить в архив" : "Архив"}
                    icon={Archive}
                    isArchiveTarget={snapshot.isDraggingOver}
                    selectedCount={selectedDocIds.has(draggingDocId ?? "") ? selectedDocIds.size : undefined}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="z-[99999] w-80 rounded-2xl border-white/60 bg-white/90 p-0 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90"
                side={isMobile ? "bottom" : "right"}
              >
                <TrashBox />
              </PopoverContent>
            </Popover>
            <div className="hidden" aria-hidden="true">
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
