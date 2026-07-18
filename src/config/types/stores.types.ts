export type CoverImageStore = {
  url?: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onReplace: (url: string) => void
}

export type SearchStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  toggle: () => void
}

export type SettingsStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}