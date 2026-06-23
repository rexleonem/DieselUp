import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'supplier' | 'driver' | 'admin' | 'super_admin';
export type OrderStatus = 'pending' | 'payment_pending' | 'paid' | 'supplier_assigned' | 'driver_assigned' | 'en_route' | 'arrived' | 'delivered' | 'cancelled' | 'refunded';
export type TransactionType = 'credit' | 'debit' | 'refund' | 'bonus' | 'withdrawal';
export type ApprovalStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface GeoPointValue { latitude: number; longitude: number }
export interface Address { id?: string; label: string; formattedAddress: string; location: GeoPointValue; placeId?: string; instructions?: string; isDefault?: boolean }
export interface AppUser {
  id: string; email: string | null; phoneNumber: string | null; displayName: string; photoURL?: string | null;
  role: UserRole; status: 'active' | 'suspended' | 'pending'; supplierId?: string; createdAt: Timestamp; updatedAt: Timestamp;
}
export interface Supplier {
  id: string; ownerId: string; businessName: string; rating: number; ratingCount: number; approvalStatus: ApprovalStatus;
  pricePerLitre: number; deliveryFee: number; serviceRadiusKm: number; location: GeoPointValue; address: string;
  availableLitres: number; isOpen: boolean; estimatedDeliveryMinutes: number; documentStatus: Record<string, ApprovalStatus>;
}
export interface OrderMoney { fuelCost: number; deliveryFee: number; tax: number; total: number; currency: 'NGN' }
export interface Order {
  id: string; orderNumber: string; customerId: string; supplierId: string; driverId?: string; status: OrderStatus;
  quantityLitres: number; deliveryAddress: Address; money: OrderMoney; paymentMethod: 'paystack' | 'wallet';
  paymentReference?: string; estimatedArrival?: Timestamp; createdAt: Timestamp; updatedAt: Timestamp; scheduledFor?: Timestamp;
  isEmergency: boolean; verificationMethod: 'otp' | 'qr';
}
export interface TrackingPoint { orderId: string; driverId: string; location: GeoPointValue; heading?: number; speed?: number; accuracy?: number; recordedAt: Timestamp }
export interface Wallet { userId: string; availableBalance: number; pendingBalance: number; currency: 'NGN'; updatedAt: Timestamp }
export interface WalletTransaction { id: string; userId: string; type: TransactionType; amount: number; balanceAfter: number; reference: string; status: 'pending' | 'successful' | 'failed'; description: string; createdAt: Timestamp }
export interface InventoryTank { id: string; supplierId: string; name: string; capacityLitres: number; availableLitres: number; lowStockThreshold: number; updatedAt: Timestamp }
export interface Delivery { id: string; orderId: string; supplierId: string; driverId: string; status: OrderStatus; proofUrl?: string; customerVerifiedAt?: Timestamp; completedAt?: Timestamp }
export interface Notification { id: string; userId: string; title: string; body: string; event: string; readAt?: Timestamp; data?: Record<string, string>; createdAt: Timestamp }
export interface Conversation { id: string; participantIds: string[]; orderId?: string; lastMessage?: string; lastMessageAt?: Timestamp; unreadCounts: Record<string, number> }
export interface Message { id: string; senderId: string; text?: string; attachmentUrl?: string; readBy: string[]; createdAt: Timestamp }
export interface SupportTicket { id: string; customerId: string; subject: string; description: string; status: 'open' | 'in_progress' | 'resolved'; priority: 'low' | 'medium' | 'high' | 'urgent'; createdAt: Timestamp; updatedAt: Timestamp }
