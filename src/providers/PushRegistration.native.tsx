import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

export function PushRegistration() {
  const { firebaseUser } = useAuth();
  useEffect(() => {
    if (!firebaseUser || !Device.isDevice) return;
    (async () => {
      const existing = await Notifications.getPermissionsAsync();
      const permission = existing.status === 'granted' ? existing : await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      const messaging = getMessaging(getApp());
      await requestPermission(messaging);
      const token = await getToken(messaging);
      const provider = 'fcm';
      const id = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token)).slice(0, 32);
      await setDoc(doc(db, 'users', firebaseUser.uid, 'devices', id), { token, provider, platform: Platform.OS, active: true, appVersion: Constants.expoConfig?.version, updatedAt: serverTimestamp() }, { merge: true });
    })().catch(() => undefined);
  }, [firebaseUser]);
  return null;
}
