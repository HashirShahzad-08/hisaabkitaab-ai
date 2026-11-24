// Live lists: users/{uid}/budgets (one document per category) and users/{uid}/goals.
import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db } from '../firebase';

function useList(uid, name, makeQuery, reloadKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    setLoading(true);
    return onSnapshot(
      makeQuery(collection(db, 'users', uid, name)),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.code || 'unknown');
        setLoading(false);
      }
    );
  }, [uid, reloadKey]);

  return { items, loading, error };
}

export const useBudgets = (uid, reloadKey = 0) => useList(uid, 'budgets', (c) => query(c, limit(50)), reloadKey);

export const useGoals = (uid, reloadKey = 0) =>
  useList(uid, 'goals', (c) => query(c, orderBy('createdAt', 'desc'), limit(100)), reloadKey);
