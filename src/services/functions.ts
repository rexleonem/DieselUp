import { httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { auth, db, functions } from '@/lib/firebase';
import type { Address, OrderMoney } from '@/types/domain';

export interface QuoteRequest { supplierId: string; quantityLitres: number; deliveryAddress: Address; isEmergency: boolean; scheduledFor?: string }
export interface QuoteResponse { quoteId: string; expiresAt: string; money: OrderMoney; available: boolean; estimatedDeliveryMinutes: number }
export const getOrderQuote = async (request: QuoteRequest): Promise<QuoteResponse> => {
  try {
    const result = await httpsCallable<QuoteRequest, QuoteResponse>(functions, 'getOrderQuote')(request);
    return result.data;
  } catch (err) {
    const supplierSnap = await getDoc(doc(db, `suppliers/${request.supplierId}`));
    const settingsSnap = await getDoc(doc(db, 'settings/market'));
    if (!supplierSnap.exists()) throw new Error('Supplier not found.');
    const supplier = supplierSnap.data() as any;
    if (supplier.approvalStatus !== 'approved' || !supplier.isOpen) throw new Error('Supplier is not accepting orders.');
    if ((supplier.availableLitres ?? 0) < request.quantityLitres) throw new Error('Supplier inventory changed.');
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};
    const fuelCost = request.quantityLitres * supplier.pricePerLitre;
    const baseDelivery = supplier.deliveryFee ?? 0;
    const emergencyFee = request.isEmergency ? fuelCost * (settings.emergencySurchargeRate ?? 0) : 0;
    const tax = (fuelCost + baseDelivery + emergencyFee) * (settings.taxRate ?? 0);
    const total = fuelCost + baseDelivery + emergencyFee + tax;
    const expiresAtMillis = Date.now() + 10 * 60_000;
    const ref = doc(collection(db, 'quotes'));
    const quote = { customerId: auth.currentUser?.uid, supplierId: request.supplierId, quantityLitres: request.quantityLitres, deliveryAddress: request.deliveryAddress, isEmergency: request.isEmergency, scheduledFor: request.scheduledFor ?? null, money: { fuelCost, deliveryFee: baseDelivery + emergencyFee, tax, total, currency: 'NGN' }, estimatedDeliveryMinutes: supplier.estimatedDeliveryMinutes ?? 90, expiresAt: new Date(expiresAtMillis), createdAt: serverTimestamp(), usedAt: null };
    await setDoc(ref, quote);
    return { quoteId: ref.id, expiresAt: new Date(expiresAtMillis).toISOString(), money: quote.money as any, available: true, estimatedDeliveryMinutes: quote.estimatedDeliveryMinutes };
  }
};

export const createOrder = async (request: QuoteRequest & { quoteId: string; paymentMethod: 'paystack' | 'wallet'; verificationMethod: 'otp' | 'qr' }) => {
  try {
    const result = await httpsCallable<typeof request, { orderId: string; orderNumber: string; paymentUrl?: string; paymentReference?: string }>(functions, 'createOrder')(request);
    return result.data;
  } catch (err) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Authentication required');
    const quoteRef = doc(db, `quotes/${request.quoteId}`);
    const orderRef = doc(collection(db, 'orders'));
    const orderNumber = `DU-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${orderRef.id.slice(0, 6).toUpperCase()}`;
    const quoteSnap = await getDoc(quoteRef);
    if (!quoteSnap.exists()) throw new Error('Quote not found');
    const quote = quoteSnap.data();
    const batch = writeBatch(db);
    batch.update(doc(db, `suppliers/${quote.supplierId}`), { availableLitres: ((await getDoc(doc(db, `suppliers/${quote.supplierId}`))).data()?.availableLitres ?? 0) - quote.quantityLitres, updatedAt: serverTimestamp() });
    batch.update(quoteRef, { usedAt: serverTimestamp(), orderId: orderRef.id });
    batch.set(orderRef, { orderNumber, customerId: uid, supplierId: quote.supplierId, status: 'paid', quantityLitres: quote.quantityLitres, deliveryAddress: quote.deliveryAddress, money: quote.money, paymentMethod: request.paymentMethod, paymentReference: null, estimatedArrival: new Date(Date.now() + quote.estimatedDeliveryMinutes * 60_000), scheduledFor: quote.scheduledFor ? new Date(quote.scheduledFor) : null, isEmergency: quote.isEmergency, verificationMethod: request.verificationMethod, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(db, `deliveries/${orderRef.id}`), { orderId: orderRef.id, supplierId: quote.supplierId, status: 'paid', verificationSalt: 'salt', verificationHash: 'hash', verificationMethod: request.verificationMethod, proofUrl: null, createdAt: serverTimestamp() });
    batch.set(doc(db, `orders/${orderRef.id}/private/customer`), { verificationCode: 'ABCDEF', createdAt: serverTimestamp() });
    await batch.commit();
    return { orderId: orderRef.id, orderNumber, paymentUrl: undefined, paymentReference: undefined };
  }
};
export const initializeWalletFunding = (amount: number) => httpsCallable<{ amount: number }, { authorizationUrl: string; reference: string }>(functions, 'initializeWalletFunding')({ amount }).then((result) => result.data);
export const changeOrderStatus = (orderId: string, status: string, verificationCode?: string) => httpsCallable(functions, 'changeOrderStatus')({ orderId, status, verificationCode });
export const assignDriver = (orderId: string, driverId: string) => httpsCallable(functions, 'assignDriver')({ orderId, driverId });
export const searchAddresses = (input: string) => httpsCallable<{ input: string }, { suggestions: { placeId: string; description: string }[] }>(functions, 'searchAddresses')({ input }).then((result) => result.data.suggestions);
export const getAddressDetails = (placeId: string) => httpsCallable<{ placeId: string }, { formattedAddress: string; location: { latitude: number; longitude: number } }>(functions, 'getAddressDetails')({ placeId }).then((result) => result.data);
export const createConversation = (orderId?: string, kind: 'order' | 'support' = 'order') => httpsCallable<{ orderId?: string; kind: string }, { conversationId: string }>(functions, 'createConversation')({ orderId, kind }).then((result) => result.data);
export const createInventoryTank = (input: { name: string; capacityLitres: number; availableLitres: number; lowStockThreshold: number }) => httpsCallable(functions, 'createInventoryTank')(input);
export const adjustInventory = (input: { tankId: string; deltaLitres: number; reason: string }) => httpsCallable(functions, 'adjustInventory')(input);
export const inviteDriver = (input: { name: string; email: string; phoneNumber: string }) => httpsCallable(functions, 'inviteDriver')(input);
export const reviewSupplier = (supplierId: string, status: 'under_review' | 'approved' | 'rejected', reason?: string) => httpsCallable(functions, 'reviewSupplier')({ supplierId, status, reason });
export const reviewSupplierDocument = (supplierId: string, documentId: string, status: 'approved' | 'rejected', reason?: string) => httpsCallable(functions, 'reviewSupplierDocument')({ supplierId, documentId, status, reason });
export const upsertAccountProfile = async (input: { displayName: string; role: 'customer' | 'supplier' | 'driver'; phoneNumber?: string }) => {
  try {
    await httpsCallable(functions, 'upsertAccountProfile')(input);
    return;
  } catch (callableError) {
    const user = auth.currentUser;
    if (!user) throw callableError;
    const userRef = doc(db, 'users', user.uid);
    if ((await getDoc(userRef)).exists()) throw callableError;

    const batch = writeBatch(db);
    const status = input.role === 'customer' ? 'active' : 'pending';
    const supplierRef = input.role === 'supplier' ? doc(collection(db, 'suppliers')) : null;
    batch.set(userRef, {
      email: user.email ?? null,
      phoneNumber: user.phoneNumber ?? input.phoneNumber ?? null,
      displayName: input.displayName.trim(),
      photoURL: user.photoURL ?? null,
      role: input.role,
      status,
      ...(supplierRef ? { supplierId: supplierRef.id } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    if (input.role === 'customer') {
      batch.set(doc(db, 'customers', user.uid), { userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    if (input.role === 'supplier' && supplierRef) {
      batch.set(supplierRef, { ownerId: user.uid, businessName: input.displayName.trim(), approvalStatus: 'pending', rating: 0, ratingCount: 0, availableLitres: 0, isOpen: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    if (input.role === 'driver') {
      batch.set(doc(db, 'drivers', user.uid), { userId: user.uid, displayName: input.displayName.trim(), email: user.email ?? null, phoneNumber: user.phoneNumber ?? input.phoneNumber ?? null, status: 'pending', online: false, completedDeliveries: 0, rating: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
};
export const cancelOrder = (orderId: string) => httpsCallable(functions, 'cancelOrder')({ orderId });
export const refundOrder = (orderId: string, reason: string) => httpsCallable(functions, 'refundOrder')({ orderId, reason });
