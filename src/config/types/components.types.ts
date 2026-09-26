import type { DropzoneOptions } from "react-dropzone"
import type * as React from "react"
import type { Doc } from "../../../convex/_generated/dataModel"

export interface CoverImageProps {
  url?: string
  preview?: boolean
}

export interface BgCollection {
  name: string
  folder: string
  images: string[]
}

export interface EditorProps {
  documentId: string
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
  className?: string
  showFooter?: boolean
  saveStatus?: "saving" | "saved" | "idle"
  onEditorReady?: (editor: any) => void
}

export type InputProps = {
  width?: number;
  height?: number;
  className?: string;
  value?: File | string;
  onChange?: (file?: File) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
};

export interface IconPickerPorps {
  onChange: (icon: string) => void
  children: React.ReactNode
  asChild?: boolean
}

export interface ToolbarProps {
  initialData: Doc<"documents">
  preview?: boolean
}

export interface ConfirmmModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>
}

export type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

export type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean
  }
}
