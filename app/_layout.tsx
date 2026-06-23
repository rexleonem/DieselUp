import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { ConfigurationRequired } from '@/components/ConfigurationRequired';
import { isConfigured } from '@/lib/env';

import Head from 'expo-router/head';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  if (!isConfigured) return <ConfigurationRequired />;
  
  return (
    <AppProviders>
      <Head>
        <title>DieselUp | Enterprise Fuel Delivery in Nigeria</title>
        <meta name="description" content="On-demand enterprise diesel delivery across Nigeria. Fast refueling, transparent pricing, and smart fleet management." />
        <meta property="og:title" content="DieselUp | Enterprise Fuel Delivery" />
        <meta property="og:description" content="On-demand enterprise diesel delivery across Nigeria. Get your fleet fueled quickly and efficiently." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DieselUp | Fast Fuel Delivery" />
        <meta name="twitter:description" content="On-demand enterprise diesel delivery across Nigeria." />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AppProviders>
  );
}
