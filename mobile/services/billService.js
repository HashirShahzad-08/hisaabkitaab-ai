// Saving a checked bill: users/{uid}/bills, and (if asked) one expense in users/{uid}/transactions.
// Also a tiny in-memory hand-over between the Bills screens, so we do not push big objects through the URL.
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { db } from '../firebase';
import { newTransactionRef, transactionData, withTimeout } from './transactionService';

// ---- hand-over between screens
let current = null; // { request, result, saved }  saved = true when it comes from the saved list
let flash = ''; // an i18n key for a one-time message on the Bills tab

export const setCurrentBill = (bill) => { current = bill; };
export const getCurrentBill = () => current;
export const setFlash = (key) => { flash = key; };
export const takeFlash = () => { const k = flash; flash = ''; return k; };

// Make these once per bill and reuse them when retrying, so a retry can never save it twice.
export const newBillRefs = (uid) => ({
  bill: doc(collection(db, 'users', uid, 'bills')),
  expense: newTransactionRef(uid),
});

// request: what we sent to the backend. result: what came back (we keep the whole thing).
// expense: { label } adds a "Bills" expense of the bill amount dated today, or null to skip it.
// The bill and its expense are written together: both are saved, or neither.
export async function saveBill({ refs, request, result, expense }) {
  const batch = writeBatch(db);
  batch.set(refs.bill, {
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
  if (expense) {
    batch.set(refs.expense, transactionData({
      amount: request.amount,
      type: 'expense',
      category: 'Bills',
      paymentType: 'Cash',
      date: new Date(),
      note: expense.label,
      source: 'bill',
    }));
  }
  await withTimeout(batch.commit()); // offline: Firestore keeps the write and sends it later
  return refs.bill.id;
}
