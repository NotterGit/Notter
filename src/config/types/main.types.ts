import type { DocumentTreeItem } from "@/lib/document-tree"
export type { DocumentTreeItem }
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
  initialData: DocumentTreeItem
}

export interface MenuProps {
  documentId: string;
}

export interface ItemProps {
  id?: string
  documentIcon?: string | null
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
  createdAt?: number | string | Date
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
  documentId: string;
}

export interface DocumentListProps {
  parentDocumentId?: string
  level?: number
  data?: DocumentTreeItem[]
  onCreateDocument?: () => void
}

export interface PublishProps {
  initialData: DocumentTreeItem
}

export interface DashboardDocumentIdPageProps {
  params: Promise<{
    documentId: string
  }>
}
