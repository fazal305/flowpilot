import { create } from "zustand";

export const useAiDialogStore = create((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
