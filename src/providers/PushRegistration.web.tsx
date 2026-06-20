import { useEffect } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useAuth } from './AuthProvider';
import { db, firebaseApp } from '@/lib/firebase';

export function PushRegistration() {
  const { firebaseUser } = useAuth();
  useEffect(() => {
    if (!firebaseUser || typeof window === 'undefined') return;
    (async () => {
      if (!await isSupported() || !process.env.EXPO_PUBLIC_FIREBASE_WEB_PUSH_VAPID_KEY) return;
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') return;
      const token = await getToken(getMessaging(firebaseApp), { vapidKey: process.env.EXPO_PUBLIC_FIREBASE_WEB_PUSH_VAPID_KEY });
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const id = Array.from(new Uint8Array(bytes)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      await setDoc(doc(db, 'users', firebaseUser.uid, 'devices', id), { token, provider: 'fcm', platform: 'web', active: true, updatedAt: serverTimestamp() }, { merge: true });
    })().catch(() => undefined);
  }, [firebaseUser]);
  return null;
}
