// Small writes to the user's profile document: users/{uid}/profile/main
import { doc, setDoc } from 'firebase/firestore';

import { db } from '../firebase';

// Offline: Firestore keeps the write and sends it later, so do not make the user wait for it.
const withTimeout = (promise, ms = 4000) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

const merge = (uid, data) => withTimeout(setDoc(doc(db, 'users', uid, 'profile', 'main'), data, { merge: true }));

// Best effort: never blocks or breaks the language switch
export const saveLanguageToProfile = (uid, language) => (uid ? merge(uid, { language }).catch(() => {}) : Promise.resolve());

// The welcome flow was finished (or skipped)
export const saveWelcomeDone = (uid) => merge(uid, { welcomeDone: true }).catch(() => {});

export const saveMonthlyIncome = (uid, monthlyIncome) => merge(uid, { monthlyIncome });
