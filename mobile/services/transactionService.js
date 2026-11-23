// Saving and deleting transactions in Firestore: users/{uid}/transactions
import { collection, deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

import { db } from '../firebase';
import { toDateKey } from '../utils/format';

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

// date: a JS Date (the day the user picked). We keep today's clock time on it
// so the History list can show a time and sort inside a day.
export async function addTransaction(uid, { amount, type, category, paymentType, date, note }) {
  const now = new Date();
  const when = new Date(
    date.getFullYear(), date.getMonth(), date.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  );
  const ref = doc(collection(db, 'users', uid, 'transactions'));
  const save = setDoc(ref, {
    amount,
    type,
    category,
    paymentType,
    merchant: '',
    note: note.trim(),
    date: toDateKey(date),
    dateTime: Timestamp.fromDate(when),
    source: 'manual',
    createdAt: serverTimestamp(),
  });
  // Online: finishes fast. Offline: Firestore keeps the write and sends it later,
  // so after 4 seconds we carry on instead of making the user wait.
  // Real errors (like "permission denied") still throw.
  await withTimeout(save, 4000);
  return ref.id;
}

export function deleteTransaction(uid, id) {
  return withTimeout(deleteDoc(doc(db, 'users', uid, 'transactions', id)), 4000);
}
