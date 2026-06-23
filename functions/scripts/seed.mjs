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

async function createMarketRate() {
    await db.doc('settings/market').set({
        currentPricePerLitre: 1250,
        previousPricePerLitre: 1200,
        updatedAt: FieldValue.serverTimestamp()
    });
    console.log(`Created Market Rate`);
}

async function createDemoSupplier(email, displayName, supplierId, price) {
    let user;
    try {
        user = await auth.getUserByEmail(email);
    } catch {
        user = await auth.createUser({ email, password: 'password123', displayName, emailVerified: true });
    }
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
        businessName: displayName,
        approvalStatus: 'approved',
        pricePerLitre: price,
        deliveryFee: 15000,
        serviceRadiusKm: 50,
        estimatedDeliveryMinutes: 45,
        isOpen: true,
        location: { latitude: 6.5244, longitude: 3.3792 },
        address: 'Lagos, Nigeria',
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Created Demo Supplier: ${email}`);

    // Create Demo Products / Inventory
    await db.collection(`suppliers/${supplierId}/tanks`).doc('tank-1').set({
        name: 'Main Depot Tank A',
        capacityLitres: 100000,
        availableLitres: 85000,
        lowStockThreshold: 10000,
        updatedAt: FieldValue.serverTimestamp()
    });
}

async function run() {
    console.log('Seeding demo data...');
    await createDemoCustomer();
    await createDemoSupplier('demo.supplier@dieselup.ng', 'Oando PLC', 'supplier-oando', 1250);
    await createDemoSupplier('total.energies@dieselup.ng', 'TotalEnergies Nigeria', 'supplier-total', 1270);
    await createDemoSupplier('conoil.supplier@dieselup.ng', 'Conoil Plc', 'supplier-conoil', 1240);
    await createDemoSupplier('ardova.plc@dieselup.ng', 'Ardova Plc', 'supplier-ardova', 1260);
    await createDemoSupplier('nnpc.retail@dieselup.ng', 'NNPC Retail', 'supplier-nnpc', 1200);
    await createDemoSupplier('forte.oil@dieselup.ng', 'Forte Oil', 'supplier-forte', 1255);
    await createDemoSupplier('rainoil.ltd@dieselup.ng', 'Rainoil Limited', 'supplier-rainoil', 1245);
    await createMarketRate();
    console.log('Done!');
}

run().catch(console.error);
