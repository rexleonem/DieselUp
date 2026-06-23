import { randomUUID } from 'node:crypto';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const password = process.env.DIESELUP_DEMO_PASSWORD;

if (!apiKey || !projectId) {
  throw new Error('Set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID before seeding.');
}
if (!password || password.length < 12) {
  throw new Error('Set DIESELUP_DEMO_PASSWORD to at least 12 characters. It is never written to the repository.');
}

async function identityRequest(method, data) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? `Firebase Auth ${method} failed.`);
  return payload;
}

async function authenticate(email) {
  try {
    return await identityRequest('signUp', { email, password, returnSecureToken: true });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('EMAIL_EXISTS')) throw error;
    return identityRequest('signInWithPassword', { email, password, returnSecureToken: true });
  }
}

const documentName = (path) => `projects/${projectId}/databases/(default)/documents/${path}`;
const firestoreValue = (value) => {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  return { stringValue: value };
};
const fields = (value) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)]));
const createWrite = (path, value) => ({
  update: { name: documentName(path), fields: fields(value) },
  updateTransforms: [
    { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }
  ]
});

async function seedMarketRate() {
  const auth = await authenticate('demo.supplier@dieselup.ng'); // Use an existing user just to get a token. But wait, `settings/market` only allows admin write!
  // Let's check firestore rules for settings
  // `match /settings/{settingId} { allow read: if signedIn(); allow write: if isAdmin(); }`
  // We need an admin to write this. 
}

seedMarketRate();
