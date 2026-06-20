import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Address } from '@/types/domain';

type ThemeMode = 'system' | 'light' | 'dark';
interface AppState {
  themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void;
  orderDraft: { address?: Address; quantityLitres?: number; supplierId?: string; isEmergency: boolean; scheduledFor?: string };
  patchOrderDraft: (patch: Partial<AppState['orderDraft']>) => void; clearOrderDraft: () => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  themeMode: 'system', setThemeMode: (themeMode) => set({ themeMode }),
  orderDraft: { isEmergency: false }, patchOrderDraft: (patch) => set((state) => ({ orderDraft: { ...state.orderDraft, ...patch } })),
  clearOrderDraft: () => set({ orderDraft: { isEmergency: false } })
}), { name: 'dieselup-preferences', storage: createJSONStorage(() => AsyncStorage), partialize: (state) => ({ themeMode: state.themeMode }) }));
