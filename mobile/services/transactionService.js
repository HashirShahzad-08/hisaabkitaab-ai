// Saving and deleting transactions in Firestore: users/{uid}/transactions
import { collection, deleteDoc, doc, serverTimestamp, setDoc, Timestamp, writeBatch } from 'firebase/firestore';

import { db } from '../firebase';
import { toDateKey } from '../utils/format';

export const withTimeout = (promise, ms = 4000) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

// A new, empty document. Make it once and reuse it when retrying, so a retry can never save twice.
export const newTransactionRef = (uid) => doc(collection(db, 'users', uid, 'transactions'));

// date: a JS Date (the day the user picked). We keep today's clock time on it
// so the History list can show a time and sort inside a day.
// source: "manual", "sms" or "quick" (how the transaction was entered)
export function transactionData({ amount, type, category, paymentType, date, note = '', merchant = '', source = 'manual' }) {
  const now = new Date();
  const when = new Date(
    date.getFullYear(), date.getMonth(), date.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  );
  return {
    amount,
    type,
    category,
    paymentType,
    merchant: merchant.trim(),
    note: note.trim(),
    date: toDateKey(date),
    dateTime: Timestamp.fromDate(when),
    source,
    createdAt: serverTimestamp(),
  };
}

export async function addTransaction(uid, fields) {
  const ref = newTransactionRef(uid);
  // Online: finishes fast. Offline: Firestore keeps the write and sends it later,
  // so after 4 seconds we carry on instead of making the user wait.
  // Real errors (like "permission denied") still throw.
  await withTimeout(setDoc(ref, transactionData(fields)));
  return ref.id;
}

// Several at once, all or nothing. entries: [{ ref, fields }]
export async function addTransactions(entries) {
  const batch = writeBatch(db);
  entries.forEach(({ ref, fields }) => batch.set(ref, transactionData(fields)));
  await withTimeout(batch.commit());
}

export function deleteTransaction(uid, id) {
  return withTimeout(deleteDoc(doc(db, 'users', uid, 'transactions', id)), 4000);
}
