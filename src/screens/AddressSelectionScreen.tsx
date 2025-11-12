// src/screens/AddressSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native'; // Import CommonActions
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAddress, RootStackParamList } from '../navigation/MainTabNavigator'; // Import main types

// --- REMOVED prop drilling ---

// This navigation prop is for the ROOT stack
type NavProp = NavigationProp<RootStackParamList>;

export default function AddressSelectionScreen() {
  const navigation = useNavigation<NavProp>(); // Use ROOT navigation
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ServiceAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const addressesRef = collection(db, 'users', user.uid, 'addresses');
    const q = query(addressesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAddresses: ServiceAddress[] = [];
      snapshot.forEach(doc => {
        newAddresses.push({ id: doc.id, ...doc.data() } as ServiceAddress);
      });
      setAddresses(newAddresses);
      setLoading(false);
    }, (error) => {
      console.error(error);
      Alert.alert("Error", "Could not fetch addresses.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- THIS IS THE FIX ---
  // This function sends the data back to the form screen
  const selectAddress = (address: ServiceAddress) => {
    // We use CommonActions.navigate to be explicit
    navigation.dispatch(
      CommonActions.navigate({
        name: 'ServiceRequestForm',
        params: { selectedAddress: address },
        merge: true, // This merges with existing params (serviceId, etc)
      })
    );
  };
  // -----------------------

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.addButton} 
        // Use root navigation to go to the MapPicker
        onPress={() => navigation.navigate('MapPicker')}
      >
        <Ionicons name="add-circle" size={24} color="#007AFF" />
        <Text style={styles.addButtonText}>Add a New Address</Text>
      </Pressable>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.addressCard} onPress={() => selectAddress(item)}>
            <Ionicons name={item.nickname === 'Home' ? 'home' : 'business'} size={24} color="#333" />
            <View style={styles.addressText}>
              <Text style={styles.nickname}>{item.nickname}</Text>
              <Text>{item.addressLine1}, {item.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No saved addresses found.</Text>}
      />
    </View>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  addButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  addButtonText: { fontSize: 16, color: '#007AFF', marginLeft: 10, fontWeight: '600' },
  addressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', marginHorizontal: 10, marginVertical: 5, borderRadius: 8 },
  addressText: { flex: 1, marginLeft: 15 },
  nickname: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: 'gray' },
});