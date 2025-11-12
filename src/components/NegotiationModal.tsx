// src/components/NegotiationModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Button,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (counterPrice: string, message: string) => Promise<void>;
  adminPrice: number;
};

export default function NegotiationModal({
  isVisible,
  onClose,
  onSubmit,
  adminPrice,
}: Props) {
  const [counterPrice, setCounterPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!counterPrice) {
      alert('Please enter a counter-offer price.');
      return;
    }
    setLoading(true);
    await onSubmit(counterPrice, message);
    setLoading(false);
    // onClose() will be called from the parent screen on success
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Negotiate Quote</Text>
            </View>
            <Text style={styles.subtitle}>
              The current offer from our team is
              <Text style={styles.adminPrice}>
                {' '}
                ₹{adminPrice.toLocaleString()}
              </Text>
              .
            </Text>
            <Text style={styles.label}>Your Counter-Offer Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 45000"
              keyboardType="numeric"
              value={counterPrice}
              onChangeText={setCounterPrice}
            />
            <Text style={styles.label}>Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., 'This fits our budget better...'"
              multiline
              value={message}
              onChangeText={setMessage}
            />
            <View style={styles.buttonContainer}>
              <Button title="Cancel" onPress={onClose} color="#888" />
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Button title="Submit Counter-Offer" onPress={handleSubmit} />
              )}
            </View>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  adminPrice: {
    fontWeight: 'bold',
    color: '#c0392b',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});