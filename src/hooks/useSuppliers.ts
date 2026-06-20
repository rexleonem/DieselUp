import { useMemo } from 'react';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRealtimeQuery } from './useRealtimeQuery';
import type { Supplier } from '@/types/domain';

export function useSuppliers(max = 50) {
  const suppliersQuery = useMemo(() => query(collection(db, 'suppliers'), where('approvalStatus', '==', 'approved'), where('isOpen', '==', true), orderBy('pricePerLitre', 'asc'), limit(max)), [max]);
  return useRealtimeQuery<Supplier>(suppliersQuery);
}
