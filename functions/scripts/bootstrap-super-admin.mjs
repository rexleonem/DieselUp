import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) throw new Error('Usage: npm run bootstrap-admin -- admin@your-domain.com');

initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'super_admin', status: 'active' });
await getFirestore().doc(`users/${user.uid}`).set({
  email: user.email,
  phoneNumber: user.phoneNumber ?? null,
  displayName: user.displayName ?? email.split('@')[0],
  role: 'super_admin',
  status: 'active',
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });
await getAuth().revokeRefreshTokens(user.uid);
console.log(`Super-admin access granted to ${email}. Existing sessions were revoked.`);
