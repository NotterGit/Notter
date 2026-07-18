import { create } from "zustand";
import type { SettingsStore } from "@/config/types/stores.types";

export const useSettings = create<SettingsStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}))