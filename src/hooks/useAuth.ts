// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

// Define the shape of our user profile from Firestore
export interface UserProfile {
  uid: string;
  phoneNumber: string;
  orgId?: string;
  role?: 'admin' | 'manager';
  // add any other fields you have
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a simplified version of your App.tsx logic
    const authSubscriber = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const firestoreSubscriber = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
        return firestoreSubscriber; // Unsubscribe from Firestore on cleanup
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return authSubscriber; // Unsubscribe from Auth on cleanup
  }, []);

  return { user, userProfile, loading };
}