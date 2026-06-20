import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { colors, spacing } from '@/theme/tokens';
import { useTheme } from '@/hooks/useTheme';

export function LoadingState({ label = 'Loading…' }: { label?: string }) { return <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text color="#64748B">{label}</Text></View>; }
export function EmptyState({ icon = 'file-tray-outline', title, message, actionTitle, onAction }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string; actionTitle?: string; onAction?: () => void }) {
  const theme = useTheme();
  return <View style={styles.state}><View style={[styles.icon, { backgroundColor: theme.colors.surfaceAlt }]}><Ionicons name={icon} size={28} color={colors.primary} /></View><Text variant="h3">{title}</Text><Text color={theme.colors.muted} style={styles.center}>{message}</Text>{actionTitle && onAction && <Button title={actionTitle} onPress={onAction} />}</View>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <View style={styles.state}><Ionicons name="alert-circle-outline" size={32} color={colors.danger} /><Text variant="h3">Something went wrong</Text><Text color="#64748B" style={styles.center}>{message}</Text>{onRetry && <Button title="Try again" variant="outline" onPress={onRetry} />}</View>; }
const styles = StyleSheet.create({ state: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }, icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, center: { textAlign: 'center', maxWidth: 420 } });
