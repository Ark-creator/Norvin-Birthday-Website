// src/store.js
import { create } from 'zustand'

// Notice "export const", NOT "export default"
export const useStore = create((set) => ({
  activeItem: null,
  setActiveItem: (item) => set({ activeItem: item }),
  closeModal: () => set({ activeItem: null }),
}))