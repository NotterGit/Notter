import type { Doc, Id } from "../../../convex/_generated/dataModel"
import type { LucideIcon } from "lucide-react"
import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"

export interface NavbarProps {
  isCollapsed: boolean
  onResetWidth: () => void
}

export interface TitleProps {
  initialData: Doc<"documents">
}

export interface MenuProps {
  documentId: Id<"documents">;
}

export interface ItemProps {
  id?: Id<"documents">
  documentIcon?: string
  active?: boolean
  expanded?: boolean
  isSearch?: boolean
  shortcut?: string
  hasArrow?: boolean
  level?: number
  onExpand?: () => void
  label: string
  onClick?: () => void
  icon: LucideIcon
  lastEditor?: string
  lastEditTime?: string
  creatorName?: string
  createdAt?: number | string
  verified?: boolean
  isPinned?: boolean
  isDragging?: boolean
  isCombineTarget?: boolean
  isArchiveTarget?: boolean
  isSelected?: boolean
  onSelect?: (event: React.MouseEvent) => void
  isSelectionMode?: boolean
  selectedCount?: number
  isOtherSelectedDragging?: boolean
  className?: string
  draggableProps?: DraggableProvidedDraggableProps
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  innerRef?: React.Ref<HTMLDivElement>
}

export interface BannerProps {
  documentId: Id<"documents">;
}

export interface DocumentListProps {
  parentDocumentId?: Id<"documents">
  level?: number
  data?: Doc<"documents">[]
  onCreateDocument?: () => void
}

export interface PublishProps {
  initialData: Doc<"documents">
}

export interface DashboardDocumentIdPageProps {
  params: Promise<{
    documentId: string
  }>
}
