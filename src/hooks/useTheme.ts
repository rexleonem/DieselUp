import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app';
import { colors } from '@/theme/tokens';

export function useTheme() {
  const system = useColorScheme();
  const mode = useAppStore((state) => state.themeMode);
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { isDark, colors: isDark ? colors.dark : colors.light, brand: colors };
}
