import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { fetchAndActivate, getRemoteConfig } from 'firebase/remote-config';
import { firebaseApp } from '@/lib/firebase';

export function FirebasePlatformServices() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remote = getRemoteConfig(firebaseApp);
    remote.defaultConfig = { emergency_orders_enabled: true, wallet_enabled: true, minimum_order_litres: 50 };
    remote.settings.minimumFetchIntervalMillis = __DEV__ ? 0 : 3_600_000;
    fetchAndActivate(remote).catch(() => undefined);
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') isSupported().then((supported) => { if (supported) logEvent(getAnalytics(firebaseApp), 'screen_view', { firebase_screen: pathname, firebase_screen_class: pathname }); }); }, [pathname]);
  return null;
}
