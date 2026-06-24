import { useMemo } from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { colors } from '@/theme/tokens';

const baseTabBarHeight = 62;
const minBottomPadding = 10;
const androidFallbackInset = 16;

export default function TabLayout() {
  const { profile } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOps = profile?.role !== 'customer';
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? androidFallbackInset : minBottomPadding);
  const tabBarStyle = useMemo(() => ({
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    height: baseTabBarHeight + bottomInset,
    paddingTop: 7,
    paddingBottom: bottomInset,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  }), [bottomInset, theme.colors.border, theme.colors.surface]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle,
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: isOps ? 'Operations' : 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
