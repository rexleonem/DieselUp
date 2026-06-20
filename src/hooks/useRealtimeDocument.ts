import { useEffect, useState } from 'react';
import { onSnapshot, type DocumentReference } from 'firebase/firestore';

export function useRealtimeDocument<T>(reference: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(!!reference); const [error, setError] = useState<Error | null>(null);
  useEffect(() => { if (!reference) { setData(null); setLoading(false); return; } setLoading(true); return onSnapshot(reference, (snapshot) => { setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null); setLoading(false); setError(null); }, (reason) => { setError(reason); setLoading(false); }); }, [reference]);
  return { data, loading, error };
}
