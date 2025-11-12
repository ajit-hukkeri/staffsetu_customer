// src/screens/LoginScreen.tsx
import React from 'react';
import { View, Text, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, functions } from '../firebase/firebaseConfig';


export default function LoginScreen() {
  const [loading, setLoading] = React.useState(false);
  const [showWebView, setShowWebView] = React.useState(false);
  

  // This URL is loaded into the WebView
  const phoneEmailAuthUrl = () => {
    const clientId = Constants.expoConfig?.extra?.phoneEmailClientId;
    return `https://auth.phone.email/log-in?client_id=${clientId}&auth_type=4`;
  };

  // This function handles the message sent from the WebView on success
  const handleWebViewMessage = async (event: any) => {
    // Log 1: See the raw data from the WebView
    console.log(">>>> Raw WebView Data:", event.nativeEvent.data);

    setLoading(true);
    setShowWebView(false); // Hide the WebView after getting the token

    try {
      // 2. Get the token from the WebView message
      const phoneEmailToken = event.nativeEvent.data;
      
      // Log 2: Check the variable and its type right after assignment
      console.log(">>>> Assigned Token:", phoneEmailToken);
      console.log(">>>> Type of Token:", typeof phoneEmailToken);

      if (typeof phoneEmailToken !== 'string' || !phoneEmailToken) {
        throw new Error('Token from provider was not a valid string.');
      }
      
      // Log 3: See the exact object being sent to the Cloud Function
      const dataToSend = { phoneEmailToken };
      console.log(">>>> Sending this object to Firebase:", dataToSend);

      // 3. Call our Firebase Cloud Function to verify the token
      const authenticateUser = httpsCallable(functions, 'authenticateUser');
      const { data }: any = await authenticateUser(dataToSend);
      const { token: customToken } = data;

      if (!customToken) {
        throw new Error('Could not retrieve a custom token from the server.');
      }

      // 4. Use the custom token to sign in to Firebase
      await signInWithCustomToken(auth, customToken);
      
      // User is now signed in!
      
       

    } catch (err: any) {
      console.error(err);
      Alert.alert('Login failed', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // If showWebView is true, display the login page
  if (showWebView) {
    return (
      <WebView
        source={{ uri: phoneEmailAuthUrl() }}
        onMessage={handleWebViewMessage}
        style={{ flex: 1, marginTop: 40 }} // Added margin to avoid status bar
      />
    );
  }

  // Otherwise, show the initial login button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StaffSetu</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Login with Phone" onPress={() => setShowWebView(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
});