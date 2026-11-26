// Login, sign up and log out. Screens call these, so screens stay simple.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUp({ name, email, password, language }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateProfile(cred.user, { displayName: name.trim() });
    // Saved at users/{uid}/profile/main
    await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'main'), {
      name: name.trim(),
      email: email.trim(),
      language,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // The account already exists, so do not block the user if the profile save fails
    // (for example Firestore not enabled yet or no internet). Log it for debugging.
    console.warn('Profile save failed:', e?.code || e);
  }
  return cred;
}

export function logout() {
  return signOut(auth);
}

// Turns a Firebase error into the i18n key of a plain-words message,
// plus which field it belongs under.
export function mapAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return { field: 'email', key: 'auth.errors.invalidEmail' };
    case 'auth/email-already-in-use':
      return { field: 'email', key: 'auth.errors.emailInUse' };
    case 'auth/weak-password':
      return { field: 'password', key: 'auth.errors.weakPassword' };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return { field: 'password', key: 'auth.errors.wrongCredentials' };
    case 'auth/network-request-failed':
      return { field: 'form', key: 'auth.errors.noInternet' };
    case 'auth/too-many-requests':
      return { field: 'form', key: 'auth.errors.tooManyAttempts' };
    default:
      return { field: 'form', key: 'auth.errors.generic' };
  }
}
