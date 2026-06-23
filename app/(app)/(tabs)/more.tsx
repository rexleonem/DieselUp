import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { colors, radii, spacing } from '@/theme/tokens';

type MenuItem = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const customerItems: MenuItem[] = [
  { label: 'Wallet', description: 'Balance, funding, refunds, and transactions', icon: 'wallet-outline', href: '/wallet' },
  { label: 'Saved locations', description: 'Manage delivery points and site addresses', icon: 'location-outline', href: '/addresses' }
];

const supplierItems: MenuItem[] = [
  { label: 'Inventory', description: 'Tanks, stock levels, restocking, and low-stock checks', icon: 'cube-outline', href: '/inventory' },
  { label: 'Drivers', description: 'Invite, verify, monitor, and assign drivers', icon: 'people-outline', href: '/drivers' },
  { label: 'Customers', description: 'Customer history generated from completed orders', icon: 'business-outline', href: '/customers' },
  { label: 'Reports', description: 'Revenue and operations exports', icon: 'bar-chart-outline', href: '/reports' },
  { label: 'Supplier verification', description: 'Upload CAC, license, address, and ID documents', icon: 'shield-checkmark-outline', href: '/supplier-verification' },
  { label: 'Supplier settings', description: 'Marketplace pricing, radius, depot, and availability', icon: 'settings-outline', href: '/supplier-settings' }
];

const adminItems: MenuItem[] = [
  { label: 'Supplier approvals', description: 'Review applications and supplier documents', icon: 'shield-checkmark-outline', href: '/admin/suppliers' },
  { label: 'Manual funding approvals', description: 'Approve wallet funding and direct bank-transfer order payments', icon: 'cash-outline', href: '/admin/manual-funding' },
  { label: 'Reports', description: 'Daily analytics exports and network reports', icon: 'bar-chart-outline', href: '/reports' },
  { label: 'System settings', description: 'Market reference price, tax, and platform controls', icon: 'settings-outline', href: '/admin/settings' }
];

const accountItems: MenuItem[] = [
  { label: 'Profile & settings', description: 'Personal details, role, account status, and theme', icon: 'person-circle-outline', href: '/profile' },
  { label: 'Notifications', description: 'Order, payment, delivery, refund, and support alerts', icon: 'notifications-outline', href: '/notifications' },
  { label: 'Support tickets', description: 'Open and track customer support requests', icon: 'help-buoy-outline', href: '/support' }
];

export default function MoreScreen() {
  const { profile } = useAuth();
  const theme = useTheme();
  const operationalItems = profile?.role === 'supplier'
    ? supplierItems
    : profile?.role === 'admin' || profile?.role === 'super_admin'
      ? adminItems
      : customerItems;

  return (
    <Screen header={<AppHeader title="More" showProfileAction={false} />}>
      <Pressable onPress={() => router.push('/profile' as never)}>
        <Card style={styles.profile}>
          <View style={styles.avatar}><Ionicons name="person" size={25} color="white" /></View>
          <View style={styles.flex}>
            <Text variant="h3">{profile?.displayName}</Text>
            <Text variant="caption" color={theme.colors.muted}>{profile?.role.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
        </Card>
      </Pressable>

      <MenuSection title={profile?.role === 'customer' ? 'Customer tools' : 'Operations'} items={operationalItems} />
      <MenuSection title="Account" items={accountItems} />
    </Screen>
  );
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="caption" color={theme.colors.muted} style={styles.sectionLabel}>{title.toUpperCase()}</Text>
      <Card style={styles.menuCard}>
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.href as never)}
            style={[styles.item, index < items.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.itemIcon}><Ionicons name={item.icon} size={20} color={colors.primary} /></View>
            <View style={styles.flex}>
              <Text variant="label">{item.label}</Text>
              <Text variant="caption" color={theme.colors.muted}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  section: { gap: spacing.sm, marginBottom: spacing.xl },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: spacing.xs },
  menuCard: { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 76, gap: spacing.md, padding: spacing.lg },
  itemIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' }
});
