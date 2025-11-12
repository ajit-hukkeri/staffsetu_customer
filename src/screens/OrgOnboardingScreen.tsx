// src/screens/OrgOnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebase/firebaseConfig';
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

export default function OrgOnboardingScreen() {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrganization = async () => {
    // Simple validation
    if (!orgName.trim()) {
      Alert.alert('Organization Name Required', 'Please enter your company name.');
      return;
    }

    setLoading(true);

    // 1. Get the current logged-in user
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      Alert.alert('Error', 'You are not logged in.');
      // This should theoretically never happen if our Gatekeeper works
      return;
    }

    try {
      // 2. Create the new organization document in Firestore
      const orgDocRef = await addDoc(collection(db, 'organizations'), {
        orgName: orgName.trim(),
        createdAt: serverTimestamp(),
        // We can add billing details, address, etc. here later
      });

      // 3. Update the user's document to link them to this new organization
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        orgId: orgDocRef.id,
        role: 'admin', // Make the user who creates the org an 'admin'
        onboardingComplete: true, // You can keep this flag
      });

      // NOTE: We don't need to navigate.
      // The 'App.tsx' Gatekeeper is listening for this 'orgId' change
      // and will automatically switch the user to the MainTabNavigator.
    } catch (error: any) {
      console.error('Error creating organization:', error);
      Alert.alert('Error', 'Could not create organization. Please try again.');
      setLoading(false);
    }
    // We don't need to set loading(false) on success,
    // because the component will unmount and switch to the main app.
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join or Create an Organization</Text>
        <Text style={styles.subtitle}>
          To get started, please create your organization. This will be the
          company profile you manage.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your Company Name"
          value={orgName}
          onChangeText={setOrgName}
          autoCapitalize="words"
        />

        {loading ? (
          <ActivityIndicator size="large" style={styles.button} />
        ) : (
          <Button
            title="Create Organization"
            onPress={handleCreateOrganization}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});