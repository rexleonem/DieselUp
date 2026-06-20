import { useMemo } from 'react';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeQuery } from './useRealtimeQuery';
import type { Order } from '@/types/domain';

export function useOrders(max = 30) {
  const { firebaseUser, profile } = useAuth();
  const ordersQuery = useMemo(() => {
    if (!firebaseUser || !profile) return null;
    const roleField = profile.role === 'customer' ? 'customerId' : profile.role === 'supplier' ? 'supplierId' : profile.role === 'driver' ? 'driverId' : null;
    return roleField
      ? query(collection(db, 'orders'), where(roleField, '==', profile.role === 'supplier' ? profile.supplierId ?? firebaseUser.uid : firebaseUser.uid), orderBy('createdAt', 'desc'), limit(max))
      : query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(max));
  }, [firebaseUser, max, profile]);
  return useRealtimeQuery<Order>(ordersQuery);
}
