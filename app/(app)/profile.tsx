import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useAppStore } from '@/store/app';
import { useTheme } from '@/hooks/useTheme';
import { db } from '@/lib/firebase';
import { colors, radii, spacing } from '@/theme/tokens';

type ProfileLink = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const baseLinks: ProfileLink[] = [
  { label: 'Wallet', description: 'Funding, balance, payments, and refunds', icon: 'wallet-outline', href: '/wallet' },
  { label: 'Notifications', description: 'Order and account alerts', icon: 'notifications-outline', href: '/notifications' },
  { label: 'Support tickets', description: 'Create or follow up on support requests', icon: 'help-buoy-outline', href: '/support' }
];

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const theme = useTheme();
  const mode = useAppStore((state) => state.themeMode);
  const setMode = useAppStore((state) => state.setThemeMode);
  const updateName = (displayName: string) => { if (profile && displayName && displayName !== profile.displayName) updateDoc(doc(db, 'users', profile.id), { displayName, updatedAt: serverTimestamp() }); };
  const roleLinks: ProfileLink[] = profile?.role === 'supplier'
    ? [
        { label: 'Supplier settings', description: 'Marketplace profile, depot, pricing, and availability', icon: 'settings-outline', href: '/supplier-settings' },
        { label: 'Supplier verification', description: 'Business documents and approval status', icon: 'shield-checkmark-outline', href: '/supplier-verification' },
        { label: 'Inventory', description: 'Tank levels and restocking history', icon: 'cube-outline', href: '/inventory' },
        { label: 'Drivers', description: 'Driver onboarding and assignment', icon: 'people-outline', href: '/drivers' }
      ]
    : profile?.role === 'admin' || profile?.role === 'super_admin'
      ? [
          { label: 'Supplier approvals', description: 'Review supplier applications', icon: 'shield-checkmark-outline', href: '/admin/suppliers' },
          { label: 'Manual funding approvals', description: 'Review bank transfer proof for wallet and order payments', icon: 'cash-outline', href: '/admin/manual-funding' },
          { label: 'Reports', description: 'Analytics exports and operational reports', icon: 'bar-chart-outline', href: '/reports' },
          { label: 'System settings', description: 'Market price and platform controls', icon: 'settings-outline', href: '/admin/settings' }
        ]
      : [{ label: 'Saved locations', description: 'Homes, offices, sites, and delivery points', icon: 'location-outline', href: '/addresses' }];
  const links = [...roleLinks, ...baseLinks];

  return (
    <Screen header={<AppHeader title="Profile & settings" showBack backHref="/(app)/(tabs)/more" showProfileAction={false} />} contentStyle={styles.content}>
      <Card style={styles.hero}>
        <View style={styles.avatar}><Ionicons name="person" color="white" size={28} /></View>
        <View style={styles.flex}>
          <Text variant="h2">{profile?.displayName}</Text>
          <Text variant="caption" color={theme.colors.muted}>{profile?.email ?? profile?.phoneNumber ?? 'DieselUp account'}</Text>
        </View>
        <View style={styles.statusPill}><Text variant="caption" color={colors.primary}>{profile?.role.replace('_', ' ').toUpperCase()}</Text></View>
      </Card>

      <Card style={styles.card}>
        <Text variant="h3">Personal details</Text>
        <Input label="Display name" defaultValue={profile?.displayName} onEndEditing={(event) => updateName(event.nativeEvent.text.trim())} />
        <Input label="Email" value={profile?.email ?? ''} editable={false} />
        <Input label="Phone" value={profile?.phoneNumber ?? ''} editable={false} />
      </Card>

      <Card style={styles.card}>
        <Text variant="h3">Appearance</Text>
        <View style={styles.modes}>{(['system', 'light', 'dark'] as const).map((item) => <Pressable accessibilityRole="button" key={item} onPress={() => setMode(item)} style={[styles.mode, mode === item && styles.active]}><Text variant="label" color={mode === item ? colors.primary : undefined}>{item}</Text></Pressable>)}</View>
      </Card>

      <Card style={styles.menuCard}>
        <Text variant="h3" style={styles.menuTitle}>Account menu</Text>
        {links.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.href as never)}
            style={[styles.linkRow, index < links.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.linkIcon}><Ionicons name={item.icon} color={colors.primary} size={19} /></View>
            <View style={styles.flex}>
              <Text variant="label">{item.label}</Text>
              <Text variant="caption" color={theme.colors.muted}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text variant="h3">Account</Text>
        <Text color={theme.colors.muted}>Status: {profile?.status}</Text>
        <Button title="Sign out" variant="outline" onPress={signOut} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 820, gap: spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  statusPill: { borderRadius: radii.full, backgroundColor: '#FFF3E5', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  card: { gap: spacing.lg },
  modes: { flexDirection: 'row', gap: spacing.sm },
  mode: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  active: { borderColor: colors.primary, backgroundColor: '#FFF3E5' },
  menuCard: { gap: 0, paddingHorizontal: 0, paddingBottom: 0, overflow: 'hidden' },
  menuTitle: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 76, padding: spacing.lg },
  linkIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' }
});
