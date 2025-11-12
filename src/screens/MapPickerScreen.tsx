// src/screens/MapPickerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Button, Text } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AddressStackParamList } from '../navigation/AddressModalNavigator'; // NEW Import
import { Ionicons } from '@expo/vector-icons';

// Use the MODAL's navigation prop
type NavProp = NavigationProp<AddressStackParamList>;

const BENGALURU_COORDS = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapPickerScreen() {
  const navigation = useNavigation<NavProp>(); // Uses modal's navigation
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region>(BENGALURU_COORDS);
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied.');
        setInitialRegion(BENGALURU_COORDS);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setInitialRegion(region);
        setSelectedRegion(region);
      } catch (e) {
        Alert.alert("Error", "Could not fetch current location.");
        setInitialRegion(BENGALURU_COORDS);
      }
    })();
  }, []);

  const onConfirmLocation = () => {
    // Navigates WITHIN the modal
    navigation.navigate('AddressDetails', {
      latitude: selectedRegion.latitude,
      longitude: selectedRegion.longitude,
    });
  };

  if (!initialRegion) {
    return <View style={styles.container}><ActivityIndicator size="large" /><Text>Getting your location...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={(region) => setSelectedRegion(region)}
        showsUserLocation
      />
      
      <View style={styles.pinContainer}>
        <Ionicons name="location-sharp" size={44} color="#e74c3c" />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Confirm This Location" onPress={onConfirmLocation} />
      </View>
    </View>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinContainer: {
    position: 'absolute',
    alignSelf: 'center',
    marginTop: -44 / 2, 
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
});