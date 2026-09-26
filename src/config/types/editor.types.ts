import type * as React from "react"
import type { Editor } from "@tiptap/react"

// --- Status & Core Props ---

export type EditorSaveStatus = "saving" | "saved" | "idle"

export interface EditorProps {
  documentId: string
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
  className?: string
  showFooter?: boolean
  saveStatus?: EditorSaveStatus
  onEditorReady?: (editor: Editor) => void
}

// --- Document & Prototype Metadata ---

export interface DocumentMeta {
  title: string
  icon: string | null
  coverImage: string | null
}

// --- Media & Alignment ---

export type MediaAlignment = "left" | "center" | "right"

export type MediaWidth = string

export interface CustomImageAttributes {
  src?: string
  alt?: string
  width?: MediaWidth
  alignment?: MediaAlignment
  caption?: string
}

export interface CustomVideoAttributes {
  src?: string
  title?: string
  width?: MediaWidth
  alignment?: MediaAlignment
  caption?: string
}

export interface CustomAudioAttributes {
  src?: string
  title?: string
  alignment?: MediaAlignment
  caption?: string
}

export interface ImageDragPreviewProps {
  src: string
  alt?: string
  width?: string
  dragPreviewRef: React.RefObject<HTMLDivElement | null>
  initialCoords: { x: number; y: number }
}

export interface EditorMediaNodeViewProps<T = Record<string, any>> {
  node: {
    attrs: Record<string, any> & T
    [key: string]: any
  }
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  getPos: () => number
  editor: any
  [key: string]: any
}

export type ImageComponentProps = EditorMediaNodeViewProps<CustomImageAttributes>
export type VideoComponentProps = EditorMediaNodeViewProps<CustomVideoAttributes>
export type AudioComponentProps = EditorMediaNodeViewProps<CustomAudioAttributes>

// --- Selection & Indicator ---

export interface TextSelectionRange {
  from: number
  to: number
}

export interface AiIndicatorState {
  isGenerating: boolean
  from: number
  to: number
}

// --- Toolbar & Color Picker ---

export interface ColorPreset {
  name: string
  value: string
  bg?: string
}

export interface ColorPickerMenuProps {
  title: string
  currentColor?: string
  presetColors: ColorPreset[]
  onSelect: (color: string) => void
  onClear: () => void
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export interface EditorToolbarProps {
  editor: Editor | null
  uploadLimitMb?: number
  onUploadFile?: (file: File) => Promise<string>
  className?: string
}

export interface LinkPopoverProps {
  editor: Editor | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  children: React.ReactNode
}

// --- Media Popovers ---

export interface MediaPopoverBaseProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onUploadFile?: (file: File) => Promise<string>
  uploadLimitMb: number
  children: React.ReactNode
}

export interface ImagePopoverProps extends MediaPopoverBaseProps {
  onInsertImage: (src: string, alt?: string) => void
}

export interface VideoPopoverProps extends MediaPopoverBaseProps {
  onInsertVideo: (src: string, title?: string) => void
}

export interface AudioPopoverProps extends MediaPopoverBaseProps {
  onInsertAudio: (src: string, title?: string) => void
}

export interface AiGeneratePopoverProps {
  editor: Editor | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectionBackupRef: React.MutableRefObject<TextSelectionRange | null>
  children: React.ReactNode
}

// --- Header & Cover ---

export interface EditorHeaderProps {
  title: string
  onChangeTitle: (title: string) => void
  icon: string | null
  onChangeIcon: (icon: string) => void
  onRemoveIcon: () => void
  hasCover: boolean
  onAddCover: () => void
  preview: boolean
  onEnterPress: () => void
}

export interface CoverBannerProps {
  coverUrl: string | null
  preview: boolean
  onOpenModal: () => void
  onRemoveCover: () => void
}

export type CoverModalTab = "gallery" | "upload" | "link"

export interface CoverModalProps {
  isOpen: boolean
  onClose: () => void
  currentCoverUrl: string | null
  onSelectCover: (url: string) => void
  onRemoveCover: () => void
  onUploadFile?: (file: File) => Promise<string>
}
