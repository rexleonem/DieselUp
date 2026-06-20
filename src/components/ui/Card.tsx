import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radii, shadows, spacing } from '@/theme/tokens';

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return <View {...props} style={[styles.card, shadows.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]} />;
}
const styles = StyleSheet.create({ card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg } });
