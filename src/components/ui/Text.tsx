import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme/tokens';

type Variant = keyof typeof typography;
export function Text({ variant = 'body', color, style, ...props }: TextProps & { variant?: Variant; color?: string }) {
  const theme = useTheme();
  return <RNText {...props} style={[typography[variant], { color: color ?? theme.colors.text }, style]} />;
}
export const textStyles = StyleSheet.create({ tabular: { fontVariant: ['tabular-nums'] } });
