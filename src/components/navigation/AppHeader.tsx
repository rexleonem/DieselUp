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
  return <View style={[styles.header, { backgroundColor: theme.colors.background }]}><View style={styles.inner}>{title ? <Text variant="h2" style={styles.pageTitle}>{title}</Text> : <Brand compact />}<View style={styles.actions}><Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={[styles.action, { backgroundColor: theme.colors.surface }]}><Ionicons name="notifications-outline" size={20} color={theme.colors.text} /></Pressable><Pressable accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.avatar}><Text variant="caption" color="white" style={styles.avatarText}>{initials(profile?.displayName ?? '')}</Text></Pressable></View></View></View>;
}
const styles = StyleSheet.create({ header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }, inner: { width: '100%', maxWidth: 1240, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pageTitle: { fontWeight: '800', letterSpacing: -0.5 }, actions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, action: { width: 42, height: 42, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, avatar: { width: 42, height: 42, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, avatarText: { fontWeight: '700' } });
