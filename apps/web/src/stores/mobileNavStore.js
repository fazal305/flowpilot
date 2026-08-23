import { create } from "zustand";

export const useMobileNavStore = create((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
