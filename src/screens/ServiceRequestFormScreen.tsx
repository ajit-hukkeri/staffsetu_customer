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
  TouchableOpacity, // For the quote guide
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/MainTabNavigator';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CheckBox from 'expo-checkbox'; // Import CheckBox

// Get the navigation props
type Props = NativeStackScreenProps<RootStackParamList, 'ServiceRequestForm'>;

export default function ServiceRequestFormScreen({ route, navigation }: Props) {
  const { serviceId, serviceName } = route.params;
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- NEW Form Fields ---
  const [staffCount, setStaffCount] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
  const [details, setDetails] = useState('');
  const [quoteGuide, setQuoteGuide] = useState('');
  
  // --- NEW Date/Time State ---
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0))); // 9:00 AM
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(17, 0, 0, 0))); // 5:00 PM
  
  const [isOneDayJob, setIsOneDayJob] = useState(true); // Default to one-day job
  const [showPicker, setShowPicker] = useState<null | 'start' | 'end' | 'time_start' | 'time_end'>(null);

  // Set the screen title
  useEffect(() => {
    navigation.setOptions({ title: `Request: ${serviceName}` });
  }, [navigation, serviceName]);

  // Fetch user's orgId and the Quote Guide
  useEffect(() => {
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

    // Fetch the quote guide
    const fetchQuoteGuide = async () => {
      try {
        const q = query(collection(db, 'serviceRates'), where('serviceId', '==', serviceId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const rateData = querySnapshot.docs[0].data();
          setQuoteGuide(`(Usual rate: ₹${rateData.rate} per hour)`);
        }
      } catch (e) {
        console.error("No quote guide found:", e);
      }
    };
    fetchQuoteGuide();

  }, [navigation, serviceId]);

  // --- Date/Time Picker Handlers ---
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || (showPicker === 'start' ? startDate : endDate);
    setShowPicker(null);
    if (showPicker === 'start') {
      setStartDate(currentDate);
      if (isOneDayJob) setEndDate(currentDate); // Keep end date in sync if one-day job
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

  // --- Submit Handler ---
  const handleSubmitRequest = async () => {
    if (!staffCount || !details) {
      Alert.alert('Missing Details', 'Please fill out "Staff Needed" and "Details".');
      return;
    }

    setLoading(true);
    const user = auth.currentUser;
    const finalEndDate = isOneDayJob ? startDate : endDate; // Use startDate if it's a one-day job

    try {
      await addDoc(collection(db, 'serviceRequests'), {
        orgId: userOrgId,
        requestingUserId: user?.uid,
        serviceId: serviceId,
        serviceName: serviceName,
        status: 'quote_requested',
        createdAt: serverTimestamp(),
        
        // --- NEW DATA ---
        jobDetails: details.trim(),
        jobStaffCount: parseInt(staffCount, 10),
        jobStartDate: finalEndDate,
        jobEndDate: finalEndDate,
        jobStartTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        jobEndTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        jobIsOneDay: isOneDayJob,
        initialBudget: initialBudget ? parseFloat(initialBudget) : null,
        // ------------------
      });

      setLoading(false);
      Alert.alert('Request Submitted', 'Your request for a quote has been submitted.');
      navigation.popToTop();
      navigation.navigate('MainTabs', { screen: 'Service Requests' });
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Could not submit your request. Please try again.');
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
                if (newValue) setEndDate(startDate); // Sync dates if checked
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
    </SafeAreaView>
  );
}

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
  }
});