import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateView';

export default function ProtectedLayout() {
  const { firebaseUser, profile, loading } = useAuth();
  const segments = useSegments() as unknown as string[];
  if (loading) return <Screen><LoadingState label="Verifying access…" /></Screen>;
  if (!firebaseUser) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/complete-profile" />;
  if (profile.status === 'suspended') return <Redirect href="/(auth)/suspended" />;
  const section = segments[1] as string | undefined;
  const supplierOnly = ['inventory', 'drivers', 'customers', 'supplier-verification', 'supplier-settings'];
  if (section === 'admin' && !['admin', 'super_admin'].includes(profile.role)) return <Redirect href="/(app)/(tabs)" />;
  if (supplierOnly.includes(section ?? '') && profile.role !== 'supplier') return <Redirect href="/(app)/(tabs)" />;
  if (section === 'deliveries' && profile.role !== 'driver') return <Redirect href="/(app)/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
