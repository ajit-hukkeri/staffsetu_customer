// src/screens/MapPickerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Button, Text } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/MainTabNavigator';
import { Ionicons } from '@expo/vector-icons';

// --- FIXED: Use RootStackParamList ---
type NavProp = NavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'MapPicker'>;

const BENGALURU_COORDS = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapPickerScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  
  // --- FIXED: Get context from params ---
  const { serviceId, serviceName } = route.params;
  
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

  // --- FIXED: Pass context forward to AddressDetails ---
  const onConfirmLocation = () => {
    navigation.navigate('AddressDetails', {
      latitude: selectedRegion.latitude,
      longitude: selectedRegion.longitude,
      serviceId,
      serviceName
    });
  };

  if (!initialRegion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );
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