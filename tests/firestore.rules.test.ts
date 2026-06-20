import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

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
