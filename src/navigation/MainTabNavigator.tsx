// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import AccountScreen from '../screens/AccountScreen';
import CategoryServicesScreen from '../screens/CategoryServicesScreen';
import ServiceRequestsScreen from '../screens/ServiceRequestsScreen';
import ServiceRequestFormScreen from '../screens/ServiceRequestFormScreen';


// --- THIS IS THE FIX ---
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<HomeTabParamList>;
  CategoryServices: { categoryId: string; categoryName: string };
  ServiceRequestForm: { serviceId: string; serviceName: string };
  // MapPicker can now receive these params so it can pass them back
  
};
// --------------------

export type HomeTabParamList = {
  Home: undefined;
  "Service Requests": undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeTabs() {
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
      <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CategoryServices" component={CategoryServicesScreen} />
      <Stack.Screen name="ServiceRequestForm" component={ServiceRequestFormScreen} />
    </Stack.Navigator>
  );
}