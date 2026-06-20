import { useEffect, useState } from 'react';
import { onSnapshot, type DocumentData, type Query } from 'firebase/firestore';

export function useRealtimeQuery<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!query) { setData([]); setLoading(false); return; }
    setLoading(true);
    return onSnapshot(query, (snapshot) => {
      setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as T)));
      setLoading(false); setError(null);
    }, (reason) => { setError(reason); setLoading(false); });
  }, [query]);
  return { data, loading, error };
}
