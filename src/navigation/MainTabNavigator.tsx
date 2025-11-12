// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import all your screens
import HomeScreen from '../screens/HomeScreen';
import AccountScreen from '../screens/AccountScreen';
import CategoryServicesScreen from '../screens/CategoryServicesScreen';
import ServiceRequestsScreen from '../screens/ServiceRequestsScreen';
import ServiceRequestFormScreen from '../screens/ServiceRequestFormScreen';

// --- IMPORT THE ADDRESS SCREENS ---
import AddressSelectionScreen from '../screens/AddressSelectionScreen';
import MapPickerScreen from '../screens/MapPickerScreen';
import AddressDetailsScreen from '../screens/AddressDetailsScreen';

// --- DEFINE THE ADDRESS TYPE ---
export interface ServiceAddress {
  id: string;
  nickname: string;
  addressLine1: string;
  landmark: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}
// -----------------------------

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<HomeTabParamList>;
  CategoryServices: { categoryId: string; categoryName: string };
  
  // --- THIS IS THE FIX for the 'undefined' bug ---
  // We make these optional so we can merge params
  ServiceRequestForm: { 
    serviceId?: string; 
    serviceName?: string; 
    selectedAddress?: ServiceAddress; 
  };
  // ------------------------------------------

  // --- ADD THE MODAL STACK PARAMS ---
  AddressSelection: undefined;
  MapPicker: undefined;
  AddressDetails: { latitude: number; longitude: number };
  // ----------------------------------
};

export type HomeTabParamList = {
  Home: undefined;
  "Service Requests": undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeTabs() {
  // ... (Your HomeTabs component is correct, no changes needed)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'help-circle';
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Service Requests') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Service Requests" component={ServiceRequestsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Stack.Navigator>
      {/* --- Main App Screens --- */}
      <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CategoryServices" component={CategoryServicesScreen} />
      <Stack.Screen name="ServiceRequestForm" component={ServiceRequestFormScreen} />
      
      {/* --- NEW MODAL GROUP ---
        This tells React Navigation to present these screens
        as modals sliding up from the bottom.
      */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen 
          name="AddressSelection" 
          component={AddressSelectionScreen} 
          options={{ title: 'Select an Address' }} 
        />
        <Stack.Screen 
          name="MapPicker" 
          component={MapPickerScreen} 
          options={{ title: 'Select Location' }} 
        />
        <Stack.Screen 
          name="AddressDetails" 
          component={AddressDetailsScreen} 
          options={{ title: 'Address Details' }} 
        />
      </Stack.Group>
      {/* --------------------- */}
    </Stack.Navigator>
  );
}