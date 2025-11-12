// src/screens/AddressDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Alert, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList, ServiceAddress } from '../navigation/MainTabNavigator';

type DetailsRouteProp = RouteProp<RootStackParamList, 'AddressDetails'>;
type NavProp = NavigationProp<RootStackParamList>;

export default function AddressDetailsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<DetailsRouteProp>();
  
  // --- FIXED: Get ALL params including context ---
  const { latitude, longitude, serviceId, serviceName } = route.params;
  
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [nickname, setNickname] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    (async () => {
      try {
        let geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded.length > 0) {
          const g = geocoded[0];
          setAddressLine1(`${g.streetNumber || ''} ${g.street || ''}`.trim());
          setCity(g.city || '');
          setPostalCode(g.postalCode || '');
        }
      } catch (e) {
        Alert.alert("Error", "Could not fetch address details.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [latitude, longitude]);

  const onSaveAddress = async () => {
    if (!user) return Alert.alert("Error", "You must be logged in.");
    if (!nickname || !addressLine1) {
      return Alert.alert("Missing Info", "Please add a nickname (e.g., Home) and address.");
    }

    setIsSaving(true);
    try {
      const newAddressData = {
        nickname,
        addressLine1,
        landmark,
        city,
        postalCode,
        latitude,
        longitude,
      };
      
      const addressesRef = collection(db, 'users', user.uid, 'addresses');
      const docRef = await addDoc(addressesRef, newAddressData);

      // Create the full address object
      const newAddress: ServiceAddress = {
        id: docRef.id,
        ...newAddressData
      };
      
      // --- FIXED: Navigate back with FULL context ---
      navigation.navigate('ServiceRequestForm', {
        serviceId,
        serviceName,
        selectedAddress: newAddress
      });
      
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save address.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Finding address...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nickname (e.g., Home, Work)</Text>
      <TextInput 
        style={styles.input} 
        value={nickname} 
        onChangeText={setNickname} 
        placeholder="Home" 
      />
      
      <Text style={styles.label}>Address (Flat, Building, Street)</Text>
      <TextInput 
        style={styles.input} 
        value={addressLine1} 
        onChangeText={setAddressLine1} 
        placeholder="A-123, Prestige Tower" 
      />

      <Text style={styles.label}>Landmark (Optional)</Text>
      <TextInput 
        style={styles.input} 
        value={landmark} 
        onChangeText={setLandmark} 
        placeholder="Near MG Road Metro" 
      />

      <Text style={styles.label}>City</Text>
      <TextInput 
        style={styles.input} 
        value={city} 
        onChangeText={setCity} 
        placeholder="Bengaluru" 
      />

      <Text style={styles.label}>Postal Code</Text>
      <TextInput 
        style={styles.input} 
        value={postalCode} 
        onChangeText={setPostalCode} 
        placeholder="560001" 
      />

      <Button 
        title={isSaving ? "Saving..." : "Save Address"} 
        onPress={onSaveAddress} 
        disabled={isSaving} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginTop: 15, 
    marginBottom: 5 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
});