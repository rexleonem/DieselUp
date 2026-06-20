import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// To run this script against production, you must either:
// 1. Install gcloud CLI and run: gcloud auth application-default login
// 2. OR download a Service Account Key from Firebase Console and set:
//    set GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
initializeApp({ credential: applicationDefault(), projectId: 'dieselup-4f893' });

const auth = getAuth();
const db = getFirestore();

async function createDemoCustomer() {
    let user;
    try {
        user = await auth.getUserByEmail('demo.customer@dieselup.ng');
    } catch {
        user = await auth.createUser({ email: 'demo.customer@dieselup.ng', password: 'password123', displayName: 'Demo Customer', emailVerified: true });
    }
    await auth.setCustomUserClaims(user.uid, { role: 'customer', status: 'active' });
    await db.doc(`users/${user.uid}`).set({
        email: user.email,
        displayName: user.displayName,
        role: 'customer',
        status: 'active',
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Created Demo Customer: demo.customer@dieselup.ng`);
}

async function createDemoSupplier() {
    let user;
    try {
        user = await auth.getUserByEmail('demo.supplier@dieselup.ng');
    } catch {
        user = await auth.createUser({ email: 'demo.supplier@dieselup.ng', password: 'password123', displayName: 'Demo Supplier', emailVerified: true });
    }
    const supplierId = 'demo-supplier-123';
    await auth.setCustomUserClaims(user.uid, { role: 'supplier', status: 'active', supplierId });
    await db.doc(`users/${user.uid}`).set({
        email: user.email,
        displayName: user.displayName,
        role: 'supplier',
        status: 'active',
        supplierId,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    await db.doc(`suppliers/${supplierId}`).set({
        businessName: 'Demo Energy Corp',
        approvalStatus: 'approved',
        pricePerLitre: 1050,
        deliveryFee: 15000,
        serviceRadiusKm: 50,
        estimatedDeliveryMinutes: 45,
        isOpen: true,
        location: { latitude: 6.5244, longitude: 3.3792 },
        address: 'Lagos, Nigeria',
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Created Demo Supplier: demo.supplier@dieselup.ng`);

    // Create Demo Products / Inventory
    await db.collection(`suppliers/${supplierId}/tanks`).doc('tank-1').set({
        name: 'Main Depot Tank A',
        capacityLitres: 100000,
        availableLitres: 85000,
        lowStockThreshold: 10000,
        updatedAt: FieldValue.serverTimestamp()
    });
    console.log(`Created Demo Products (Inventory Tank) for Supplier`);
}

async function run() {
    console.log('Seeding demo data...');
    await createDemoCustomer();
    await createDemoSupplier();
    console.log('Done!');
}

run().catch(console.error);
