import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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

  const supplierId = user.role === 'supplier' ? `supplier-${uid.slice(0, 10)}` : null;
  
  await setDoc(doc(db, 'users', uid), {
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    photoURL: null,
    role: user.role,
    status: user.role === 'customer' ? 'active' : 'pending',
    ...(supplierId ? { supplierId } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  if (user.role === 'customer') {
    await setDoc(doc(db, 'customers', uid), {
      userId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else if (user.role === 'supplier') {
    await setDoc(doc(db, 'suppliers', supplierId), {
      ownerId: uid,
      businessName: user.displayName,
      approvalStatus: 'approved',
      rating: 4.8,
      ratingCount: 12,
      availableLitres: 100000,
      pricePerLitre: 1250,
      deliveryFee: 5000,
      serviceRadiusKm: 50,
      isOpen: true,
      location: { latitude: 6.5244, longitude: 3.3792 },
      address: 'Lagos, Nigeria',
      estimatedDeliveryMinutes: 45,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else if (user.role === 'driver') {
    await setDoc(doc(db, 'drivers', uid), {
      userId: uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: 'pending',
      online: false,
      completedDeliveries: 0,
      rating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  console.log(`Seeded ${user.role}: ${user.email}`);
}

async function run() {
  for (const u of users) {
    await seedUser(u);
  }
  process.exit(0);
}

run().catch(console.error);
