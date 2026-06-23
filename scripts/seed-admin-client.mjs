import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const password = process.env.DIESELUP_DEMO_PASSWORD;

const app = initializeApp({
  apiKey,
  projectId,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
});

const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  { email: 'admin@dieselup.ng', displayName: 'DieselUp Admin', role: 'admin', phoneNumber: '+2348000000301' },
  { email: 'super.admin@dieselup.ng', displayName: 'DieselUp Super Admin', role: 'super_admin', phoneNumber: '+2348000000302' }
];

async function seedUser(user) {
  let userRecord;
  try {
    const cred = await signInWithEmailAndPassword(auth, user.email, password);
    userRecord = cred.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, user.email, password);
      userRecord = cred.user;
    } else {
      throw err;
    }
  }

  await updateProfile(userRecord, { displayName: user.displayName });
  
  const uid = userRecord.uid;
  
  await setDoc(doc(db, 'users', uid), {
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    photoURL: null,
    role: user.role,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  console.log(`Seeded ${user.role}: ${user.email}`);
}

async function run() {
  for (const u of users) {
    await seedUser(u);
  }
  process.exit(0);
}

run().catch(console.error);
