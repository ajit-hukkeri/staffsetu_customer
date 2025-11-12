// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import CategoryCard from '../components/CategoryCard';
// NEW: Import the composite types we need
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, HomeTabParamList } from '../navigation/MainTabNavigator';

// Define a composite type for the navigation prop
type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Category = {
  id: string;
  name: string;
};

export default function HomeScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('displayOrder'));
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryServices', { 
      categoryId: category.id, 
      categoryName: category.name 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Services</Text>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={() => handleCategoryPress(item)} />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}
// ... styles are the same
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 10, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, paddingHorizontal: 10 },
  list: { justifyContent: 'center' },
});