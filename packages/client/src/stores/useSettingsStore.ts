import { create } from 'zustand';

interface SettingsStore {
  showOverlay: boolean;
  showPostHandModal: boolean;
  toggleOverlay: () => void;
  togglePostHandModal: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  showOverlay: true,
  showPostHandModal: true,
  toggleOverlay: () => set(s => ({ showOverlay: !s.showOverlay })),
  togglePostHandModal: () => set(s => ({ showPostHandModal: !s.showPostHandModal })),
}));
