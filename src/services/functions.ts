import { httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db, functions } from '@/lib/firebase';
import type { Address, OrderMoney } from '@/types/domain';

export interface QuoteRequest { supplierId: string; quantityLitres: number; deliveryAddress: Address; isEmergency: boolean; scheduledFor?: string }
export interface QuoteResponse { quoteId: string; expiresAt: string; money: OrderMoney; available: boolean; estimatedDeliveryMinutes: number }
export const getOrderQuote = (request: QuoteRequest) => httpsCallable<QuoteRequest, QuoteResponse>(functions, 'getOrderQuote')(request).then((result) => result.data);
export const createOrder = (request: QuoteRequest & { quoteId: string; paymentMethod: 'paystack' | 'wallet'; verificationMethod: 'otp' | 'qr' }) => httpsCallable<typeof request, { orderId: string; orderNumber: string; paymentUrl?: string; paymentReference?: string }>(functions, 'createOrder')(request).then((result) => result.data);
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
