"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useMutation, useQuery } from "convex/react"
import { FileIcon } from "lucide-react"
import { useOrganization, useUser } from "@clerk/nextjs"
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
}: DocumentListProps) {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { organization } = useOrganization()
  const reorder = useMutation(api.document.reorder)

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

    // 1. Handled dropping directly onto another note (Combine mode: nest inside target note)
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

    // 2. Handled reordering or dropping between notes
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
    </DragDropContext>
  )
}
