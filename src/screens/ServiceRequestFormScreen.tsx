// src/screens/ServiceRequestFormScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableOpacity,
  Pressable,
  // --- REMOVED Modal ---
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// --- We use RootStackParamList from the main navigator ---
import { RootStackParamList, ServiceAddress} from '../navigation/MainTabNavigator'; 
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CheckBox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';

// --- REMOVED AddressModalNavigator import ---

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceRequestForm'>;

export default function ServiceRequestFormScreen({ route, navigation }: Props) {
  
  // --- THIS IS THE FIX for the 'undefined' bug ---
  // We save the initial params to state.
  const [serviceId, setServiceId] = useState(route.params.serviceId);
  const [serviceName, setServiceName] = useState(route.params.serviceName);
  // --------------------------------------------

  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffCount, setStaffCount] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [details, setDetails] = useState('');
  const [quoteGuide, setQuoteGuide] = useState('');
  const [address, setAddress] = useState<ServiceAddress | null>(null);

  // --- REMOVED isAddressModalVisible state ---
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(17, 0, 0, 0)));
  const [isOneDayJob, setIsOneDayJob] = useState(true);
  const [showPicker, setShowPicker] = useState<null | 'start' | 'end' | 'time_start' | 'time_end'>(null);

  // --- ADDED THIS HOOK BACK ---
  // This listens for the 'selectedAddress' param when we return
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);
  // ----------------------------

  // Set the screen title (Uses state)
  useEffect(() => {
    navigation.setOptions({ title: `Request: ${serviceName}` });
  }, [navigation, serviceName]);

  // Fetch user's orgId and Quote Guide (Uses state)
  useEffect(() => {
    // ... (This logic is correct and unchanged)
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().orgId) {
          setUserOrgId(docSnap.data().orgId);
        } else {
          Alert.alert('Error', 'Could not find your organization details.');
          navigation.goBack();
        }
      });
    }
    const fetchQuoteGuide = async () => {
      if (!serviceId) return;
      try {
        const q = query(collection(db, 'serviceRates'), where('serviceId', '==', serviceId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const rateData = querySnapshot.docs[0].data();
          setQuoteGuide(`(Usual rate: ₹${rateData.rate} per hour)`);
        }
      } catch (e) { console.error("No quote guide found:", e); }
    };
    fetchQuoteGuide();
  }, [navigation, serviceId]);

  // --- Date/Time Handlers (Unchanged) ---
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || (showPicker === 'start' ? startDate : endDate);
    setShowPicker(null);
    if (showPicker === 'start') {
      setStartDate(currentDate);
      if (isOneDayJob) setEndDate(currentDate);
    } else if (showPicker === 'end') {
      setEndDate(currentDate);
    }
  };
  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const currentTime = selectedTime || (showPicker === 'time_start' ? startTime : endTime);
    setShowPicker(null);
    if (showPicker === 'time_start') {
      setStartTime(currentTime);
    } else if (showPicker === 'time_end') {
      setEndTime(currentTime);
    }
  };
  
  // --- REMOVED handleAddressSelect ---

  // --- Submit Handler (Unchanged, it works with 'address' state) ---
  const handleSubmitRequest = async () => {
    if (!staffCount || !details) {
      Alert.alert('Missing Details', 'Please fill out "Staff Needed" and "Details".');
      return;
    }
    if (!address) {
      Alert.alert('Missing Address', 'Please select a service address.');
      return;
    }
    // ... (Your existing submit logic is 100% correct)
    setLoading(true);
    const user = auth.currentUser;
    const finalEndDate = isOneDayJob ? startDate : endDate;
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        orgId: userOrgId,
        requestingUserId: user?.uid,
        serviceId: serviceId,
        serviceName: serviceName,
        status: 'quote_requested',
        createdAt: serverTimestamp(),
        jobDetails: details.trim(),
        jobStaffCount: parseInt(staffCount, 10),
        jobStartDate: finalEndDate,
        jobEndDate: finalEndDate,
        jobStartTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        jobEndTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        jobIsOneDay: isOneDayJob,
        initialBudget: initialBudget ? parseFloat(initialBudget) : null,
        serviceAddress: {
          addressLine1: address.addressLine1,
          landmark: address.landmark || null,
          city: address.city,
          latitude: address.latitude,
          longitude: address.longitude,
        }
      });
      setLoading(false);
      Alert.alert('Request Submitted', 'Your request has been submitted.');
      navigation.popToTop();
      navigation.navigate('MainTabs', { screen: 'Service Requests' });
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Could not submit your request.');
      setLoading(false);
    }
  };

  const showPickerModal = (mode: 'start' | 'end' | 'time_start' | 'time_end') => {
    setShowPicker(mode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>New Service Request</Text>
          <Text style={styles.subtitle}>
            Please provide details for your job. Our team will review and send you a quote.
          </Text>

          {/* --- UPDATED ADDRESS BUTTON --- */}
          <Text style={styles.label}>Service Address</Text>
          <Pressable 
            style={styles.addressButton} 
            onPress={() => navigation.navigate('AddressSelection')} // <-- CHANGED
          >
            <Ionicons name="location" size={20} color="#333" />
            <View style={styles.addressButtonTextContainer}>
              {address ? (
                <>
                  <Text style={styles.addressButtonTextBold}>{address.nickname}</Text>
                  <Text style={styles.addressButtonText}>{address.addressLine1}</Text>
                </>
              ) : (
                <Text style={styles.addressButtonText}>Select an address</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </Pressable>
          {/* ------------------------ */}

          {/* ... (Rest of your form is 100% unchanged) ... */}
          <Text style={styles.label}>Number of Staff Needed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 4"
            value={staffCount}
            onChangeText={setStaffCount}
            keyboardType="number-pad"
          />
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={isOneDayJob}
              onValueChange={(newValue) => {
                setIsOneDayJob(newValue);
                if (newValue) setEndDate(startDate);
              }}
              style={styles.checkbox}
            />
            <Text style={styles.label}>This is a one-day job</Text>
          </View>
          <Text style={styles.label}>Start Date</Text>
          <Button onPress={() => showPickerModal('start')} title={startDate.toLocaleDateString()} />
          {!isOneDayJob && (
            <>
              <Text style={styles.label}>End Date</Text>
              <Button onPress={() => showPickerModal('end')} title={endDate.toLocaleDateString()} />
            </>
          )}
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.label}>Start Time</Text>
              <Button onPress={() => showPickerModal('time_start')} title={startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.label}>End Time</Text>
              <Button onPress={() => showPickerModal('time_end')} title={endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
            </View>
          </View>
          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={
                showPicker === 'start' ? startDate :
                showPicker === 'end' ? endDate :
                showPicker === 'time_start' ? startTime : endTime
              }
              mode={showPicker.includes('time') ? 'time' : 'date'}
              display="default"
              onChange={showPicker.includes('time') ? onTimeChange : onDateChange}
              minimumDate={new Date()}
            />
          )}
          <Text style={styles.label}>Your Budget (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2000"
            value={initialBudget}
            onChangeText={setInitialBudget}
            keyboardType="number-pad"
          />
          {quoteGuide ? (
            <TouchableOpacity onPress={() => Alert.alert('Quote Guide', quoteGuide.replace(/[\(\)]/g, ''))}>
              <Text style={styles.quoteGuide}>{quoteGuide}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.label}>Additional Details</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 'Emergency cleanup for hotel party', 'Need staff Mon-Fri, 9am-5pm'"
            value={details}
            onChangeText={setDetails}
            multiline
          />
          {loading ? (
            <ActivityIndicator size="large" style={styles.button} />
          ) : (
            <Button
              title="Submit for Quote"
              onPress={handleSubmitRequest}
            />
          )}

        </View>
      </ScrollView>

      {/* --- REMOVED <Modal> COMPONENT --- */}

    </SafeAreaView>
  );
}

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  label: { fontSize: 16, color: '#555', marginBottom: 5, marginTop: 10 },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    height: 120,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  button: { marginTop: 10 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  timeBlock: {
    flex: 1,
    paddingHorizontal: 5,
  },
  quoteGuide: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  addressButtonTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  addressButtonText: {
    fontSize: 16,
    color: '#333',
  },
  addressButtonTextBold: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
});