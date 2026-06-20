import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { env, isConfigured } from './env';

export const firebaseApp = getApps().length ? getApp() : initializeApp({
  apiKey: env.apiKey || 'configuration-required', authDomain: env.authDomain || 'configuration-required.invalid', projectId: env.projectId || 'configuration-required', storageBucket: env.storageBucket || 'configuration-required.invalid',
  messagingSenderId: env.messagingSenderId || '0', appId: env.appId || 'configuration-required', measurementId: env.measurementId
});

let authInstance: Auth;
if (Platform.OS === 'web') authInstance = getAuth(firebaseApp);
else {
  try { authInstance = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch { authInstance = getAuth(firebaseApp); }
}
export const auth = authInstance;
export const db = initializeFirestore(firebaseApp, {});
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, 'us-central1');

if (isConfigured && Platform.OS === 'web' && typeof document !== 'undefined' && process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY) {
  initializeAppCheck(firebaseApp, { provider: new ReCaptchaV3Provider(process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
}

const emulatorHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
if (isConfigured && __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true' && !(globalThis as { __DIESELUP_EMULATORS__?: boolean }).__DIESELUP_EMULATORS__) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  connectStorageEmulator(storage, emulatorHost, 9199);
  (globalThis as { __DIESELUP_EMULATORS__?: boolean }).__DIESELUP_EMULATORS__ = true;
}
