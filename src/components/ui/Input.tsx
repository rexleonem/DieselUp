import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { radii, spacing } from '@/theme/tokens';
import { Text } from './Text';

export const Input = forwardRef<TextInput, TextInputProps & { label?: string; error?: string; icon?: keyof typeof Ionicons.glyphMap }>(function Input({ label, error, icon, style, ...props }, ref) {
  const theme = useTheme();
  return <View style={styles.group}>{label && <Text variant="label">{label}</Text>}<View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderColor: error ? '#EF4444' : theme.colors.border }]}>{icon && <Ionicons name={icon} size={19} color={theme.colors.muted} />}<TextInput ref={ref} placeholderTextColor={theme.colors.muted} {...props} style={[styles.input, { color: theme.colors.text }, style]} /></View>{error && <Text variant="caption" color="#EF4444">{error}</Text>}</View>;
});
const styles = StyleSheet.create({ group: { gap: 7 }, wrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md }, input: { flex: 1, fontSize: 15, minHeight: 50, outlineStyle: 'none' } as never });
