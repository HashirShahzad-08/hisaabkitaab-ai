// Live list of the user's transactions, newest first.
// Ordering by one field needs no custom index. Filters are done on the phone.
import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db } from '../firebase';
import { toDateKey } from '../utils/format';

export default function useTransactions(uid, reloadKey = 0) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    setLoading(true);
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('dateTime', 'desc'),
      limit(1000)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => {
            const data = d.data();
            const dateTime = data.dateTime?.toDate ? data.dateTime.toDate() : new Date();
            return { id: d.id, ...data, dateTime, date: data.date || toDateKey(dateTime) };
          })
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.code || 'unknown');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid, reloadKey]);

  return { items, loading, error };
}
