import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Brand } from '@/components/ui/Brand';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { colors, radii, spacing } from '@/theme/tokens';
import { initials } from '@/lib/format';

export function AppHeader({ title }: { title?: string }) {
  const { profile } = useAuth(); const theme = useTheme();
  return <View style={[styles.header, { backgroundColor: theme.colors.background }]}><View style={styles.inner}>{title ? <Text variant="h2">{title}</Text> : <Brand compact />}<View style={styles.actions}><Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={[styles.action, { backgroundColor: theme.colors.surface }]}><Ionicons name="notifications-outline" size={20} color={theme.colors.text} /></Pressable><Pressable accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.avatar}><Text variant="caption" color="white">{initials(profile?.displayName ?? '')}</Text></Pressable></View></View></View>;
}
const styles = StyleSheet.create({ header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }, inner: { width: '100%', maxWidth: 1240, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actions: { flexDirection: 'row', gap: spacing.sm }, action: { width: 38, height: 38, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 38, height: 38, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary } });
