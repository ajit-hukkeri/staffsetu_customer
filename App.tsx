// App.tsx
import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from './src/firebase/firebaseConfig';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { ActivityIndicator, View } from 'react-native';
import OnboardingStack from './src/navigation/OnboardingStack';
import { NavigationContainer } from '@react-navigation/native';


interface UserProfile {
  orgId?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let firestoreUnsubscribe: Unsubscribe | undefined;
    const authUnsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (firestoreUnsubscribe) firestoreUnsubscribe();
      if (authenticatedUser) {
        const userDocRef = doc(db, 'users', authenticatedUser.uid);
        firestoreUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) setUserProfile(doc.data() as UserProfile);
          else setUserProfile(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) firestoreUnsubscribe();
    };
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    // --- 2. WRAP YOUR APP ---
    
      <NavigationContainer>
        {!user ? (
          <OnboardingStack user={null} /> // I've fixed your prop logic from the old file
        ) : userProfile?.orgId ? (
          <MainTabNavigator />
        ) : (
          <OnboardingStack user={user} /> // This passes the user prop
        )}
      </NavigationContainer>
    
    // ------------------------
  );
}