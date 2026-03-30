import { create } from 'zustand';

type View = 'dashboard' | 'tours' | 'analytics' | 'bookings' | 'communications' | 'settings';

interface AppState {
  currentView: View;
  sidebarOpen: boolean;
  setView: (view: View) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  sidebarOpen: true,
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
