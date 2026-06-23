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

const users = [
  { email: 'admin@dieselup.ng', displayName: 'DieselUp Admin', role: 'admin', phoneNumber: '+2348000000301' },
  { email: 'super.admin@dieselup.ng', displayName: 'DieselUp Super Admin', role: 'super_admin', phoneNumber: '+2348000000302' }
];

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

const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
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
    { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
    { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }
  ],
  currentDocument: { exists: false }
});

async function bootstrapProfile(user, uid, idToken) {
  const existing = await fetch(`${firestoreBase}/users/${uid}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (existing.ok) {
    const payload = await existing.json();
    const existingRole = payload.fields?.role?.stringValue;
    if (existingRole !== user.role) throw new Error(`${user.email} already has the ${existingRole ?? 'unknown'} role.`);
    console.log(`Profile already exists: ${user.email}`);
    return;
  }
  if (existing.status !== 404) throw new Error(`Unable to check ${user.email}: ${await existing.text()}`);

  const writes = [createWrite(`users/${uid}`, {
    email: user.email, phoneNumber: user.phoneNumber, displayName: user.displayName, photoURL: null,
    role: user.role, status: 'active'
  })];

  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes })
  });
  if (!response.ok) throw new Error(`Firestore profile creation failed for ${user.email}: ${await response.text()}`);
}

async function seedUser(user) {
  const auth = await authenticate(user.email);
  const updated = await identityRequest('update', { idToken: auth.idToken, displayName: user.displayName, returnSecureToken: true });
  await bootstrapProfile(user, updated.localId ?? auth.localId, updated.idToken);
  console.log(`Seeded ${user.role}: ${user.email}`);
}

for (const user of users) await seedUser(user);
