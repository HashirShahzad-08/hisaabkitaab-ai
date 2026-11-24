// Saving budgets and goals. No transactions are created here (money added to a goal is just a number).
import { collection, deleteDoc, doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';

// Offline: Firestore keeps the write and sends it later, so do not make the user wait for it.
const withTimeout = (promise, ms = 4000) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

// ---- hand-over from a list to the edit screen
let editing = null;
export const setEditing = (item) => { editing = item; };
export const getEditing = () => editing;

// ---- budgets: the document id IS the category, so there can only be one per category
export const saveBudget = (uid, { category, limit }) =>
  withTimeout(setDoc(doc(db, 'users', uid, 'budgets', category), { category, limit, updatedAt: serverTimestamp() }, { merge: true }));

export const deleteBudget = (uid, category) => withTimeout(deleteDoc(doc(db, 'users', uid, 'budgets', category)));

// ---- goals
export function saveGoal(uid, { id, name, targetAmount, targetDate }) {
  if (id) {
    return withTimeout(updateDoc(doc(db, 'users', uid, 'goals', id), {
      name, targetAmount, targetDate: targetDate || null, updatedAt: serverTimestamp(),
    }));
  }
  const ref = doc(collection(db, 'users', uid, 'goals'));
  return withTimeout(setDoc(ref, {
    name, targetAmount, savedAmount: 0, targetDate: targetDate || null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
}

// increment() adds on the server, so two quick taps never overwrite each other
export const addMoneyToGoal = (uid, id, amount) =>
  withTimeout(updateDoc(doc(db, 'users', uid, 'goals', id), { savedAmount: increment(amount), updatedAt: serverTimestamp() }));

export const deleteGoal = (uid, id) => withTimeout(deleteDoc(doc(db, 'users', uid, 'goals', id)));
