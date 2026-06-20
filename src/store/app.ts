import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import type { Address } from '@/types/domain';

type ThemeMode = 'system' | 'light' | 'dark';
interface AppState {
  themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void;
  orderDraft: { address?: Address; quantityLitres?: number; supplierId?: string; isEmergency: boolean; scheduledFor?: string };
  patchOrderDraft: (patch: Partial<AppState['orderDraft']>) => void; clearOrderDraft: () => void;
}

const storageKey = 'dieselup-preferences';
const defaultOrderDraft: AppState['orderDraft'] = { isEmergency: false };

export const useAppStore = create<AppState>()((set) => ({
  themeMode: 'system', setThemeMode: (themeMode) => set({ themeMode }),
  orderDraft: defaultOrderDraft,
  patchOrderDraft: (patch) => set((state) => ({ orderDraft: { ...state.orderDraft, ...patch } })),
  clearOrderDraft: () => set({ orderDraft: defaultOrderDraft })
}));

const canUseStorage = Platform.OS !== 'web' || typeof window !== 'undefined';

if (canUseStorage) {
  void AsyncStorage.getItem(storageKey).then((raw) => {
    if (!raw) return;
    const stored = JSON.parse(raw) as { state?: { themeMode?: ThemeMode }; themeMode?: ThemeMode };
    const themeMode = stored.state?.themeMode ?? stored.themeMode;
    if (themeMode === 'system' || themeMode === 'light' || themeMode === 'dark') {
      useAppStore.setState({ themeMode });
    }
  }).catch(() => undefined);

  useAppStore.subscribe((state, previous) => {
    if (state.themeMode === previous.themeMode) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify({ state: { themeMode: state.themeMode }, version: 0 }));
  });
}
