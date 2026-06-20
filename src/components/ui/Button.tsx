import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export function Button({ title, variant = 'primary', loading, icon, disabled, style, ...props }: PressableProps & { title: string; variant?: Variant; loading?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  const backgrounds: Record<Variant, string> = { primary: colors.primary, secondary: colors.secondary, outline: 'transparent', danger: colors.danger, ghost: 'transparent' };
  const foreground = variant === 'outline' || variant === 'ghost' ? theme.colors.text : colors.white;
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} {...props} style={({ pressed }) => [styles.base, { backgroundColor: backgrounds[variant], borderColor: variant === 'outline' ? theme.colors.border : backgrounds[variant], opacity: disabled ? .45 : pressed ? .78 : 1 }, style as never]}>
      {loading ? <ActivityIndicator color={foreground} /> : <View style={styles.row}>{icon && <Ionicons name={icon} size={18} color={foreground} />}<Text variant="label" color={foreground}>{title}</Text></View>}
    </Pressable>
  );
}
const styles = StyleSheet.create({ base: { minHeight: 50, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }, row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' } });
