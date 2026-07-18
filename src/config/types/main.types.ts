import type { Doc, Id } from "../../../convex/_generated/dataModel"
import type { LucideIcon } from "lucide-react"

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
  level?: number
  onExpand?: () => void
  label: string
  onClick?: () => void
  icon: LucideIcon
  lastEditor?: string
  lastEditTime?: string
  verified?: boolean
}

export interface BannerProps {
  documentId: Id<"documents">;
}

export interface DocumentListProps {
  parentDocumentId?: Id<"documents">
  level?: number
  data?: Doc<"documents">[]
}

export interface PublishProps {
  initialData: Doc<"documents">
}

export interface DashboardDocumentIdPageProps {
  params: Promise<{
    documentId: string
  }>
}
