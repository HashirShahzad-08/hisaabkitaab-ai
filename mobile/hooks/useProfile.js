// The user's profile document: users/{uid}/profile/main
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';

export default function useProfile(uid, reloadKey = 0) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(
      doc(db, 'users', uid, 'profile', 'main'),
      (snap) => setProfile(snap.exists() ? snap.data() : null),
      () => setProfile(null)
    );
  }, [uid, reloadKey]);
  return profile;
}
