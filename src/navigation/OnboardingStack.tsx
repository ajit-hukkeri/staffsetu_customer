// src/navigation/OnboardingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from 'firebase/auth'; // <-- NEW: Import the User type

import LoginScreen from '../screens/LoginScreen';
import OrgOnboardingScreen from '../screens/OrgOnboardingScreen';

export type OnboardingStackParamList = {
  Login: undefined;
  OrgOnboarding: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// --- THIS IS THE CHANGE ---
// Accept the 'user' prop from App.tsx
export default function OnboardingStack({ user }: { user: User | null }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // CASE 1: User is LOGGED IN (but no orgId, based on App.tsx logic)
        // Show OrgOnboarding first. This is what you want!
        <>
          <Stack.Screen name="OrgOnboarding" component={OrgOnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        // CASE 2: User is LOGGED OUT (null)
        // Show Login first.
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OrgOnboarding" component={OrgOnboardingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}