import { create } from "zustand"
import type { MoveNoteStore } from "@/config/types/stores.types"

export const useMoveNote = create<MoveNoteStore>((set) => ({
  isOpen: false,
  documentId: undefined,
  onOpen: (documentId: string) => set({ isOpen: true, documentId }),
  onClose: () => set({ isOpen: false, documentId: undefined }),
}))
