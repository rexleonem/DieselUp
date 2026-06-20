import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { getApp } from '@react-native-firebase/app';
import { getAnalytics, logScreenView } from '@react-native-firebase/analytics';
import appCheck from '@react-native-firebase/app-check';
import remoteConfig from '@react-native-firebase/remote-config';

let initialized = false;

export function FirebasePlatformServices() {
  const pathname = usePathname();
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    const appCheckInstance = appCheck();
    const provider = appCheckInstance.newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
      apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback' }
    });
    appCheckInstance.initializeAppCheck({ provider, isTokenAutoRefreshEnabled: true }).catch(() => undefined);
    remoteConfig().setDefaults({ emergency_orders_enabled: true, wallet_enabled: true, minimum_order_litres: 50 });
    remoteConfig().fetchAndActivate().catch(() => undefined);
  }, []);
  useEffect(() => { logScreenView(getAnalytics(getApp()), { screen_name: pathname, screen_class: pathname }).catch(() => undefined); }, [pathname]);
  return null;
}
