import { create } from "zustand";
import type { AuditModalStore } from "@/config/types/stores.types";

export const useAuditModal = create<AuditModalStore>((set) => ({
  isOpen: false,
  documentId: undefined,
  documentTitle: undefined,
  onOpen: (documentId?: string, documentTitle?: string) =>
    set({ isOpen: true, documentId, documentTitle }),
  onClose: () =>
    set({ isOpen: false, documentId: undefined, documentTitle: undefined }),
}));
