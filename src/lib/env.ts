import { z } from 'zod';

const schema = z.object({
  apiKey: z.string().min(1), authDomain: z.string().min(1), projectId: z.string().min(1),
  storageBucket: z.string().min(1), messagingSenderId: z.string().min(1), appId: z.string().min(1),
  measurementId: z.string().optional(), googleMapsApiKey: z.string().optional(),
  googleWebClientId: z.string().optional(), googleAndroidClientId: z.string().optional(), googleIosClientId: z.string().optional()
});

const clean = (value: string | undefined) => {
  const next = value?.trim();
  return next ? next : undefined;
};

const values = {
  apiKey: clean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  measurementId: clean(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
  googleMapsApiKey: clean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY),
  googleWebClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  googleAndroidClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  googleIosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
};

const parsed = schema.safeParse(values);
export const env = parsed.success ? parsed.data : values;
export const isConfigured = parsed.success;
export const configurationErrors = parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
