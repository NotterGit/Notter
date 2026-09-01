import type { Doc, Id } from "../../convex/_generated/dataModel"

export interface FlatTreeItem {
  doc: Doc<"documents">
  level: number
  hasChildren: boolean
  isExpanded: boolean
  parentId?: Id<"documents">
}

export function buildChildrenMap(
  documents?: Doc<"documents">[]
): Map<string, Doc<"documents">[]> {
  const map = new Map<string, Doc<"documents">[]>()
  if (!documents) return map

  for (const doc of documents) {
    const parentKey = doc.parentDocument ? (doc.parentDocument as string) : "root"
    const list = map.get(parentKey) || []
    list.push(doc)
    map.set(parentKey, list)
  }

  return map
}

export function isDescendant(
  ancestorId: string,
  targetId?: string,
  allDocs?: Doc<"documents">[]
): boolean {
  if (!targetId || targetId === "root") return false
  if (targetId === ancestorId) return true
  if (!allDocs) return false

  let current: string | undefined = targetId
  const visited = new Set<string>()

  while (current && current !== "root") {
    if (current === ancestorId) return true
    if (visited.has(current)) break
    visited.add(current)

    const doc = allDocs.find((d) => d._id === current)
    current = doc?.parentDocument ? (doc.parentDocument as string) : undefined
  }

  return false
}

export function flattenTree(
  parentId: string,
  level: number,
  childrenMap: Map<string, Doc<"documents">[]>,
  expanded: Record<string, boolean>,
  draggingDocId: string | null
): FlatTreeItem[] {
  const children = childrenMap.get(parentId) || []
  const result: FlatTreeItem[] = []

  for (const doc of children) {
    const docChildren = childrenMap.get(doc._id) || []
    const hasChildren = docChildren.length > 0
    const isDocExpanded = Boolean(expanded[doc._id])
    const isBeingDragged = draggingDocId === doc._id

    result.push({
      doc,
      level,
      hasChildren,
      isExpanded: isDocExpanded,
      parentId: doc.parentDocument ? (doc.parentDocument as Id<"documents">) : undefined,
    })

    if (isDocExpanded && !isBeingDragged) {
      result.push(
        ...flattenTree(doc._id, level + 1, childrenMap, expanded, draggingDocId)
      )
    }
  }

  return result
}

export function getTargetPlacement(
  draggedDocId: string,
  destIndex: number,
  visibleItems: FlatTreeItem[],
  childrenMap: Map<string, Doc<"documents">[]>
): { targetParentId?: Id<"documents">; targetOrder: number } {
  const remaining = visibleItems.filter((item) => item.doc._id !== draggedDocId)

  if (destIndex === 0) {
    const first = remaining[0]
    return {
      targetParentId: first ? first.parentId : undefined,
      targetOrder: 0,
    }
  }

  if (destIndex >= remaining.length) {
    const last = remaining[remaining.length - 1]
    const parentIdKey = last?.parentId ?? "root"
    const siblings = (childrenMap.get(parentIdKey) || []).filter((d) => d._id !== draggedDocId)
    return {
      targetParentId: last?.parentId,
      targetOrder: siblings.length,
    }
  }

  const prev = remaining[destIndex - 1]
  const next = remaining[destIndex]

  if (prev && prev.isExpanded && next && next.parentId === prev.doc._id) {
    return {
      targetParentId: prev.doc._id as Id<"documents">,
      targetOrder: 0,
    }
  }

  if (next) {
    const parentIdKey = next.parentId ?? "root"
    const siblings = (childrenMap.get(parentIdKey) || []).filter((d) => d._id !== draggedDocId)
    const nextSiblingIndex = siblings.findIndex((d) => d._id === next.doc._id)
    const targetOrder = nextSiblingIndex !== -1 ? nextSiblingIndex : siblings.length
    return {
      targetParentId: next.parentId,
      targetOrder,
    }
  }

  const parentIdKey = prev?.parentId ?? "root"
  const siblings = (childrenMap.get(parentIdKey) || []).filter((d) => d._id !== draggedDocId)
  const prevSiblingIndex = siblings.findIndex((d) => d._id === prev.doc._id)
  return {
    targetParentId: prev?.parentId,
    targetOrder: prevSiblingIndex !== -1 ? prevSiblingIndex + 1 : siblings.length,
  }
}
