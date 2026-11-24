// Saving a checked bill: users/{uid}/bills, and (if asked) one expense in users/{uid}/transactions.
// Also a tiny in-memory hand-over between the Bills screens, so we do not push big objects through the URL.
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { addTransaction } from './transactionService';

// ---- hand-over between screens
let current = null; // { request, result, saved }  saved = true when it comes from the saved list
let flash = ''; // an i18n key for a one-time message on the Bills tab

export const setCurrentBill = (bill) => { current = bill; };
export const getCurrentBill = () => current;
export const setFlash = (key) => { flash = key; };
export const takeFlash = () => { const k = flash; flash = ''; return k; };

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

// request: what we sent to the backend. result: what came back (we keep the whole thing).
// expense: { label } adds a "Bills" expense of the bill amount dated today, or null to skip it.
export async function saveBill(uid, { request, result, expense }) {
  const ref = doc(collection(db, 'users', uid, 'bills'));
  const save = setDoc(ref, {
    // handy top-level fields for the list
    billMonth: request.bill_month,
    units: request.units_billed,
    amount: request.amount,
    verdict: result.verdict,
    company: request.company || '',
    request,
    result,
    addedToExpenses: !!expense,
    createdAt: serverTimestamp(),
  });
  await withTimeout(save, 4000); // offline: Firestore keeps the write and sends it later

  if (expense) {
    await addTransaction(uid, {
      amount: request.amount,
      type: 'expense',
      category: 'Bills',
      paymentType: 'Cash',
      date: new Date(),
      note: expense.label,
      source: 'bill',
    });
  }
  return ref.id;
}
