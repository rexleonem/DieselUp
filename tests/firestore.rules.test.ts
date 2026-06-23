import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({ projectId: 'dieselup-test', firestore: { rules: readFileSync(resolve('firestore.rules'), 'utf8') } });
});
afterEach(async () => environment.clearFirestore());
afterAll(async () => environment.cleanup());

async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/customer-a'), { role: 'customer', status: 'active', displayName: 'Customer A' });
    await setDoc(doc(db, 'users/customer-b'), { role: 'customer', status: 'active', displayName: 'Customer B' });
    await setDoc(doc(db, 'orders/order-a'), { customerId: 'customer-a', supplierId: 'supplier-a', driverId: 'driver-a', status: 'en_route' });
  });
}

describe('Firestore role boundaries', () => {
  it('denies unauthenticated account reads', async () => {
    await seed();
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), 'users/customer-a')));
  });

  it('lets customers read only their own profile and order', async () => {
    await seed();
    const db = environment.authenticatedContext('customer-a', { role: 'customer', status: 'active' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'users/customer-a')));
    await assertFails(getDoc(doc(db, 'users/customer-b')));
    await assertSucceeds(getDoc(doc(db, 'orders/order-a')));
  });

  it('prevents clients from creating privileged user profiles', async () => {
    const db = environment.authenticatedContext('attacker', { role: 'customer', status: 'active' }).firestore();
    await assertFails(setDoc(doc(db, 'users/attacker'), { role: 'super_admin', status: 'active' }));
  });

  it('allows an authenticated user to atomically bootstrap a customer profile', async () => {
    const db = environment.authenticatedContext('new-customer', { email: 'customer@example.com' }).firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users/new-customer'), { email: 'customer@example.com', phoneNumber: null, displayName: 'New Customer', photoURL: null, role: 'customer', status: 'active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'customers/new-customer'), { userId: 'new-customer', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
  });

  it('allows a pending supplier bootstrap but rejects mismatched ownership', async () => {
    const db = environment.authenticatedContext('new-supplier', { email: 'supplier@example.com' }).firestore();
    const valid = writeBatch(db);
    valid.set(doc(db, 'users/new-supplier'), { email: 'supplier@example.com', phoneNumber: null, displayName: 'New Supplier', photoURL: null, role: 'supplier', status: 'pending', supplierId: 'supplier-new', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    valid.set(doc(db, 'suppliers/supplier-new'), { ownerId: 'new-supplier', businessName: 'New Supplier', approvalStatus: 'pending', rating: 0, ratingCount: 0, availableLitres: 0, isOpen: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await assertSucceeds(valid.commit());

    const attacker = environment.authenticatedContext('attacker', { email: 'attacker@example.com' }).firestore();
    const invalid = writeBatch(attacker);
    invalid.set(doc(attacker, 'users/attacker'), { email: 'attacker@example.com', phoneNumber: null, displayName: 'Bad Supplier', photoURL: null, role: 'supplier', status: 'pending', supplierId: 'stolen-supplier', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    invalid.set(doc(attacker, 'suppliers/stolen-supplier'), { ownerId: 'someone-else', businessName: 'Bad Supplier', approvalStatus: 'pending', rating: 0, ratingCount: 0, availableLitres: 0, isOpen: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await assertFails(invalid.commit());
  });

  it('allows a pending driver bootstrap without custom claims', async () => {
    const db = environment.authenticatedContext('new-driver', { email: 'driver@example.com' }).firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users/new-driver'), { email: 'driver@example.com', phoneNumber: '+2348000000000', displayName: 'New Driver', photoURL: null, role: 'driver', status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'drivers/new-driver'), { userId: 'new-driver', displayName: 'New Driver', email: 'driver@example.com', phoneNumber: '+2348000000000', status: 'pending', online: false, completedDeliveries: 0, rating: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
  });

  it('allows customers to manage only their own validated addresses', async () => {
    const own = environment.authenticatedContext('customer-a', { role: 'customer' }).firestore();
    const other = environment.authenticatedContext('customer-b', { role: 'customer' }).firestore();
    const payload = { label: 'Office', formattedAddress: '1 Marina Road, Lagos', location: { latitude: 6.45, longitude: 3.39 }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(own, 'customers/customer-a/addresses/office'), payload));
    await assertFails(setDoc(doc(other, 'customers/customer-a/addresses/intrusion'), payload));
  });

  it('allows only the assigned driver to publish tracking points', async () => {
    await seed();
    const assigned = environment.authenticatedContext('driver-a', { role: 'driver' }).firestore();
    const other = environment.authenticatedContext('driver-b', { role: 'driver' }).firestore();
    const point = { orderId: 'order-a', driverId: 'driver-a', location: { latitude: 6.45, longitude: 3.39 }, recordedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(assigned, 'tracking/order-a/points/p1'), point));
    await assertFails(setDoc(doc(other, 'tracking/order-a/points/p2'), { ...point, driverId: 'driver-b' }));
  });
});
