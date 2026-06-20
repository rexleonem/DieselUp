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
  { email: 'demo.supplier@dieselup.ng', displayName: 'DieselUp Demo Supplier', role: 'supplier', phoneNumber: '+2348000000102' },
  { email: 'demo.driver@dieselup.ng', displayName: 'DieselUp Demo Driver', role: 'driver', phoneNumber: '+2348000000103' }
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

async function seedUser(user) {
  const auth = await authenticate(user.email);
  const updated = await identityRequest('update', { idToken: auth.idToken, displayName: user.displayName, returnSecureToken: true });
  const response = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/upsertAccountProfile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${updated.idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { displayName: user.displayName, role: user.role, phoneNumber: user.phoneNumber } })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error?.message ?? `Profile creation failed for ${user.email}.`);
  console.log(`Seeded ${user.role}: ${user.email}`);
}

for (const user of users) await seedUser(user);
