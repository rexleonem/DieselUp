import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
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
export const upsertAccountProfile = (input: { displayName: string; role: 'customer' | 'supplier' | 'driver'; phoneNumber?: string }) => httpsCallable(functions, 'upsertAccountProfile')(input);
export const cancelOrder = (orderId: string) => httpsCallable(functions, 'cancelOrder')({ orderId });
export const refundOrder = (orderId: string, reason: string) => httpsCallable(functions, 'refundOrder')({ orderId, reason });
