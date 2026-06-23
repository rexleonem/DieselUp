import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';
import type { SupportTicket } from '@/types/domain';

export function useSupportTickets() {
  const { profile } = useAuth();
  const [data, setData] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'support_tickets'),
      where('customerId', '==', profile.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setData(tickets);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching support tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.id]);

  return { data, loading };
}
