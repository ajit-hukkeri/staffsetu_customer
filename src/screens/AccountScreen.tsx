// src/screens/AccountScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth'; // <-- Import our hook

// Define the shape of an Organization
type Organization = {
  orgName: string;
};

export default function AccountScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      // Wait for the auth hook to finish loading
      return;
    }

    if (userProfile && userProfile.orgId) {
      // We have the orgId, now fetch the organization's details
      const orgDocRef = doc(db, 'organizations', userProfile.orgId);
      getDoc(orgDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setOrganization(docSnap.data() as Organization);
          } else {
            Alert.alert('Error', 'Could not find organization details.');
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching organization:', error);
          setLoading(false);
        });
    } else {
      // No orgId found, or no user profile
      setLoading(false);
    }
  }, [userProfile, authLoading]); // Re-run when auth data changes

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // The App.tsx Gatekeeper will automatically
      // navigate the user to the Login screen.
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Could not sign out. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Account</Text>

      {/* User Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{user?.phoneNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.valueSmall}>{user?.uid}</Text>
        </View>
      </View>

      {/* Organization Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Organization</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{organization?.orgName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Org ID:</Text>
          <Text style={styles.valueSmall}>{userProfile?.orgId}</Text>
        </View>
      </View>

      <View style={styles.signOutButton}>
        <Button title="Sign Out" color="#FF3B30" onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 12,
    color: '#888',
    flexShrink: 1,
    textAlign: 'right',
  },
  signOutButton: {
    marginTop: 20,
  },
});