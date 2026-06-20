import { z } from 'zod';

const schema = z.object({
  apiKey: z.string().min(1), authDomain: z.string().min(1), projectId: z.string().min(1),
  storageBucket: z.string().min(1), messagingSenderId: z.string().min(1), appId: z.string().min(1),
  measurementId: z.string().optional(), googleMapsApiKey: z.string().optional()
});

const values = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim(),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
};

const parsed = schema.safeParse(values);
export const env = parsed.success ? parsed.data : values;
export const isConfigured = parsed.success;
export const configurationErrors = parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
