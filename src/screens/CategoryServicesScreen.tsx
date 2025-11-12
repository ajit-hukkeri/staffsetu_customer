// src/screens/CategoryServicesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/MainTabNavigator';

type Service = {
  id: string;
  name: string;
  // You can add/remove B2B specific fields here
};

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryServices'>;

export default function CategoryServicesScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set the title of the screen to the category name
    navigation.setOptions({ title: categoryName });

    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, where('categoryId', '==', categoryId));
        const querySnapshot = await getDocs(q);
        const fetchedServices = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        setServices(fetchedServices);
      } catch (error) {
        console.error('Error fetching services: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [categoryId, categoryName, navigation]); // Added categoryName & navigation to deps

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  // --- THIS IS THE FIX ---
  const handleServicePress = (service: Service) => {
    // Navigate to our new B2B form screen, not the old B2C screen
    navigation.navigate('ServiceRequestForm', {
      serviceId: service.id,
      serviceName: service.name,
    });
  };
  // -------------------------

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => handleServicePress(item)}
          >
            <Text style={styles.serviceName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Updated styles for B2B (removed price)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  serviceItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceName: { fontSize: 18, fontWeight: '600' },
});