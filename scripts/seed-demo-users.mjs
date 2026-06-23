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
  { email: 'demo.customer@dieselup.ng', displayName: 'DieselUp Demo Customer', role: 'customer', phoneNumber: '+2348000000101' },
  { email: 'demo.supplier@dieselup.ng', displayName: 'Oando PLC', role: 'supplier', phoneNumber: '+2348000000102' },
  { email: 'demo.driver@dieselup.ng', displayName: 'DieselUp Demo Driver', role: 'driver', phoneNumber: '+2348000000103' },
  { email: 'total.energies@dieselup.ng', displayName: 'TotalEnergies Nigeria', role: 'supplier', phoneNumber: '+2348000000104' },
  { email: 'conoil.supplier@dieselup.ng', displayName: 'Conoil Plc', role: 'supplier', phoneNumber: '+2348000000105' },
  { email: 'ardova.plc@dieselup.ng', displayName: 'Ardova Plc', role: 'supplier', phoneNumber: '+2348000000106' },
  { email: 'nnpc.retail@dieselup.ng', displayName: 'NNPC Retail', role: 'supplier', phoneNumber: '+2348000000107' },
  { email: 'forte.oil@dieselup.ng', displayName: 'Forte Oil', role: 'supplier', phoneNumber: '+2348000000108' },
  { email: 'rainoil.ltd@dieselup.ng', displayName: 'Rainoil Limited', role: 'supplier', phoneNumber: '+2348000000109' }
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

  const supplierId = user.role === 'supplier' ? randomUUID().replaceAll('-', '').slice(0, 20) : null;
  const writes = [createWrite(`users/${uid}`, {
    email: user.email, phoneNumber: user.phoneNumber, displayName: user.displayName, photoURL: null,
    role: user.role, status: user.role === 'customer' ? 'active' : 'pending', ...(supplierId ? { supplierId } : {})
  })];
  if (user.role === 'customer') writes.push(createWrite(`customers/${uid}`, { userId: uid }));
  if (user.role === 'supplier') writes.push(createWrite(`suppliers/${supplierId}`, {
    ownerId: uid, businessName: user.displayName, approvalStatus: 'pending', rating: 0,
    ratingCount: 0, availableLitres: 0, isOpen: false
  }));
  if (user.role === 'driver') writes.push(createWrite(`drivers/${uid}`, {
    userId: uid, displayName: user.displayName, email: user.email, phoneNumber: user.phoneNumber,
    status: 'pending', online: false, completedDeliveries: 0, rating: 0
  }));

  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes })
  });
  if (!response.ok) throw new Error(`Firestore profile creation failed for ${user.email}: ${await response.text()}`);
}

async function seedUser(user) {
  const auth = await authenticate(user.email);
  const updated = await identityRequest('update', { idToken: auth.idToken, displayName: user.displayName, returnSecureToken: true });
  const response = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/upsertAccountProfile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${updated.idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { displayName: user.displayName, role: user.role, phoneNumber: user.phoneNumber } })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) await bootstrapProfile(user, updated.localId ?? auth.localId, updated.idToken);
  console.log(`Seeded ${user.role}: ${user.email}`);
}

for (const user of users) await seedUser(user);
