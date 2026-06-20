import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { ConfigurationRequired } from '@/components/ConfigurationRequired';
import { isConfigured } from '@/lib/env';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  if (!isConfigured) return <ConfigurationRequired />;
  return <AppProviders><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></AppProviders>;
}
