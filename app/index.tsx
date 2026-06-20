import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui/StateView';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { firebaseUser, profile, loading } = useAuth();
  if (loading) return <Screen><LoadingState label="Preparing DieselUp…" /></Screen>;
  if (!firebaseUser) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/complete-profile" />;
  return <Redirect href="/(app)/(tabs)" />;
}
