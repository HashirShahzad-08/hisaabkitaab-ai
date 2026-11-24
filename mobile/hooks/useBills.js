// Live list of the user's checked bills, newest first: users/{uid}/bills
import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db } from '../firebase';

export default function useBills(uid, reloadKey = 0) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    setLoading(true);
    const q = query(collection(db, 'users', uid, 'bills'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snap) => {
        setBills(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.code || 'unknown');
        setLoading(false);
      }
    );
  }, [uid, reloadKey]);

  return { bills, loading, error };
}
