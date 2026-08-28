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

  const visibleItems = useMemo(() => {
    return flattenTree("root", level, childrenMap, expanded, draggingDocId)
  }, [childrenMap, expanded, level, draggingDocId])

  const onDragStart = (start: DragStart) => {
    setDraggingDocId(start.draggableId)
  }

  const onDragEnd = (result: DropResult) => {
    setDraggingDocId(null)
    const { destination, source, draggableId, combine } = result

    if (!documents) return

    if (destination?.droppableId === "archive-drop-target") {
      const docId = draggableId as Id<"documents">
      const draggedDoc = documents.find((d) => d._id === docId)
      if (!draggedDoc) return

      if (isOrg && !isAdmin) {
        toast.error("Только администраторы могут архивировать заметки")
        return
      }

      void update({
        id: docId,
        isPublished: false,
        userId: orgId,
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
      })

      const promise = archive({
        id: docId,
        userId: orgId,
      }).then(() => {
        const currentDocId = typeof params?.documentId === "string" ? params.documentId : undefined
        if (currentDocId && (currentDocId === docId || isDescendant(docId, currentDocId, documents))) {
          router.push(pages.DASHBOARD())
        }
      })

      toast.promise(promise, {
        loading: "Перемещаем в архив...",
        success: "Заметка перемещена в архив!",
        error: "Не удалось переместить в архив",
      })
      return
    }

    if (combine) {
      const targetParentId = combine.draggableId as Id<"documents">

      if (targetParentId === draggableId) {
        toast.error("Нельзя переместить заметку внутрь самой себя")
        return
      }

      if (isDescendant(draggableId, targetParentId, documents)) {
        toast.error("Нельзя переместить заметку внутрь её дочерних заметок")
        return
      }

      const draggedDoc = documents.find((d) => d._id === draggableId)
      if (!draggedDoc) return

      const sourceParentId = draggedDoc.parentDocument
        ? (draggedDoc.parentDocument as Id<"documents">)
        : undefined

      const sourceSiblings = (childrenMap.get(sourceParentId ?? "root") || [])
        .filter((d) => d._id !== draggableId)

      const sourceUpdates = sourceSiblings.map((doc, index) => ({
        id: doc._id,
        order: index,
        parentDocument: sourceParentId,
      }))

      const targetSiblings = (childrenMap.get(targetParentId) || [])
        .filter((d) => d._id !== draggableId)

      const movedItemUpdate = {
        id: draggableId as Id<"documents">,
        order: targetSiblings.length,
        parentDocument: targetParentId,
      }

      setExpanded((prev) => ({
        ...prev,
        [targetParentId]: true,
      }))

      const promise = reorder({
        userId: orgId,
        items: [...sourceUpdates, movedItemUpdate],
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
      })

      toast.promise(promise, {
        loading: "Перемещение внутрь заметки...",
        success: "Заметка перемещена внутрь",
        error: "Не удалось переместить заметку",
      })
      return
    }

    // 3. Handled reordering or dropping between notes
    if (!destination) {
      return
    }

    if (destination.index === source.index) {
      return
    }

    const draggedDoc = documents.find((d) => d._id === draggableId)
    if (!draggedDoc) return

    const { targetParentId, targetOrder } = getTargetPlacement(
      draggableId,
      destination.index,
      visibleItems,
      childrenMap
    )

    if (targetParentId === draggableId) {
      toast.error("Нельзя переместить заметку внутрь самой себя")
      return
    }

    if (isDescendant(draggableId, targetParentId, documents)) {
      toast.error("Нельзя переместить заметку внутрь её дочерних заметок")
      return
    }

    const sourceParentId = draggedDoc.parentDocument
      ? (draggedDoc.parentDocument as Id<"documents">)
      : undefined

    const isSameParent = sourceParentId === targetParentId

    const sourceSiblings = (childrenMap.get(sourceParentId ?? "root") || [])
      .filter((d) => d._id !== draggableId)

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
        .filter((d) => d._id !== draggableId)
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
    })

    toast.promise(promise, {
      loading: "Перемещение заметки...",
      success: "Порядок заметок обновлен",
      error: "Не удалось переместить заметку",
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

  if (!isMounted) {
    return (
      <>
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
                        isDragging={snapshot.isDragging}
                        isCombineTarget={Boolean(snapshot.combineTargetFor)}
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
