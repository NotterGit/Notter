import type { DropzoneOptions } from "react-dropzone"
import type * as React from "react"
import type { Doc } from "../../../convex/_generated/dataModel"

export interface CoverImageProps {
  url?: string
  preview?: boolean
}

export interface BgCollectionConfig {
  name: string
  folder: string
}

export interface BgCollection {
  name: string
  folder: string
  images: string[]
}

export type {
  EditorProps,
  EditorSaveStatus,
  DocumentMeta,
  CoverBannerProps,
  CoverModalProps,
  EditorHeaderProps,
  EditorToolbarProps,
} from "./editor.types"

export type InstallModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstallPwa: () => void | Promise<void>
  canInstallPwa: boolean
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
