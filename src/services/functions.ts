import { httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { auth, db, functions } from '@/lib/firebase';
import type { Address, BankAccount, DeliveryMode, OrderMoney, PaymentMethod } from '@/types/domain';

export interface QuoteRequest { supplierId: string; quantityLitres: number; deliveryAddress: Address; isEmergency: boolean; deliveryMode?: DeliveryMode; scheduledFor?: string }
export interface QuoteResponse { quoteId: string; expiresAt: string; money: OrderMoney; available: boolean; estimatedDeliveryMinutes: number }
export interface ManualFundingInput {
  amount: number; purpose: 'wallet' | 'order_payment'; proofUrl: string; proofStoragePath?: string; transferReference?: string;
  bankAccount?: BankAccount | null; orderId?: string; orderNumber?: string;
}
export interface CreateOrderRequest extends QuoteRequest {
  quoteId: string; paymentMethod: PaymentMethod; verificationMethod: 'otp' | 'qr';
  manualFundingProofUrl?: string; manualFundingProofPath?: string; manualFundingTransferReference?: string; bankAccount?: BankAccount | null;
}
export const getOrderQuote = async (request: QuoteRequest): Promise<QuoteResponse> => {
  try {
    const result = await httpsCallable<QuoteRequest, QuoteResponse>(functions, 'getOrderQuote')(request);
    return result.data;
  } catch {
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
    const quote = { customerId: auth.currentUser?.uid, supplierId: request.supplierId, quantityLitres: request.quantityLitres, deliveryAddress: request.deliveryAddress, isEmergency: request.isEmergency, deliveryMode: request.deliveryMode ?? (request.isEmergency ? 'emergency' : request.scheduledFor ? 'scheduled' : 'quick'), scheduledFor: request.scheduledFor ?? null, money: { fuelCost, deliveryFee: baseDelivery + emergencyFee, tax, total, currency: 'NGN' }, estimatedDeliveryMinutes: supplier.estimatedDeliveryMinutes ?? 90, expiresAt: new Date(expiresAtMillis), createdAt: serverTimestamp(), usedAt: null };
    await setDoc(ref, quote);
    return { quoteId: ref.id, expiresAt: new Date(expiresAtMillis).toISOString(), money: quote.money as any, available: true, estimatedDeliveryMinutes: quote.estimatedDeliveryMinutes };
  }
};

export const createOrder = async (request: CreateOrderRequest) => {
  const result = await httpsCallable<typeof request, { orderId: string; orderNumber: string; paymentUrl?: string; paymentReference?: string; manualFundingRequestId?: string }>(functions, 'createOrder')(request);
  return result.data;
};
export const initializeWalletFunding = (amount: number) => httpsCallable<{ amount: number }, { authorizationUrl: string; reference: string }>(functions, 'initializeWalletFunding')({ amount }).then((result) => result.data);
export const submitManualFundingRequest = async (input: ManualFundingInput) => {
  try {
    const result = await httpsCallable<ManualFundingInput, { requestId: string }>(functions, 'submitManualFundingRequest')(input);
    return result.data;
  } catch {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');
    const ref = doc(collection(db, 'manual_funding_requests'));
    await setDoc(ref, {
      userId: user.uid,
      userName: user.displayName ?? user.email ?? null,
      amount: input.amount,
      currency: 'NGN',
      purpose: input.purpose,
      orderId: input.orderId ?? null,
      orderNumber: input.orderNumber ?? null,
      status: 'pending',
      proofUrl: input.proofUrl,
      proofStoragePath: input.proofStoragePath ?? null,
      transferReference: input.transferReference?.trim() ?? '',
      bankName: input.bankAccount?.bankName ?? null,
      accountName: input.bankAccount?.accountName ?? null,
      accountNumber: input.bankAccount?.accountNumber ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { requestId: ref.id };
  }
};
export const reviewManualFundingRequest = async (requestId: string, status: 'approved' | 'rejected', reviewNote?: string) => {
  await httpsCallable(functions, 'reviewManualFundingRequest')({ requestId, status, reviewNote });
};
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
