// src/screens/ServiceRequestsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp, // We still need this for the type
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import NegotiationModal from '../components/NegotiationModal';

// --- (Types are all correct) ---
type NegotiationEntry = {
  from: 'customer' | 'admin';
  price: number;
  message?: string;
  timestamp: any; // Using 'any' to accommodate both server and client timestamps
  action?: 'accepted' | 'initial_offer';
};

type Quote = {
  price: number;
  terms: string;
  sentAt: any;
  sentBy: string;
};

type ServiceRequest = {
  id: string;
  serviceName: string;
  status:
    | 'quote_requested'
    | 'quote_provided'
    | 'quote_negotiating'
    | 'quote_accepted'
    | 'in_progress'
    | 'completed';
  details: string;
  createdAt: { seconds: number; nanoseconds: number };
  quote?: Quote;
  negotiationHistory?: NegotiationEntry[];
};

// ... (formatStatus function is the same)
const formatStatus = (status: string) => {
  switch (status) {
    case 'quote_requested': return 'Quote Requested';
    case 'quote_provided': return 'Action Required: Quote Provided';
    case 'quote_negotiating': return 'Negotiation: Pending Admin Response';
    case 'quote_accepted': return 'Quote Accepted';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return 'Unknown';
  }
};

export default function ServiceRequestsScreen() {
  const { userProfile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null,
  );

  // ... (useEffect for fetching data is the same)
  useEffect(() => {
    if (authLoading || !userProfile?.orgId) { return; }
    const q = query(
      collection(db, 'serviceRequests'),
      where('orgId', '==', userProfile.orgId),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedRequests: ServiceRequest[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as ServiceRequest);
      });
      setRequests(fetchedRequests);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching service requests:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile, authLoading]);

  // ... (handleAcceptQuote function is the same)
  const handleAcceptQuote = (requestId: string) => {
    Alert.alert(
      'Accept Quote',
      'Are you sure you want to accept this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              const requestDocRef = doc(db, 'serviceRequests', requestId);
              await updateDoc(requestDocRef, { status: 'quote_accepted' });
            } catch (error) {
              console.error('Error accepting quote:', error);
              Alert.alert('Error', 'Could not accept the quote.');
            }
          },
        },
      ],
    );
  };

  // ... (handleOpenNegotiateModal is the same)
  const handleOpenNegotiateModal = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  // --- UPDATED handleSubmitNegotiation ---
  const handleSubmitNegotiation = async (
    counterPrice: string,
    message: string,
  ) => {
    if (!selectedRequest) return;

    try {
      const requestDocRef = doc(db, 'serviceRequests', selectedRequest.id);
      
      const newNegotiationEntry: NegotiationEntry = {
        from: 'customer',
        price: parseFloat(counterPrice),
        message: message || '',
        // --- THIS IS THE FIX ---
        // Use a client-side timestamp instead of serverTimestamp()
        timestamp: new Date(),
        // ----------------------
      };

      await updateDoc(requestDocRef, {
        status: 'quote_negotiating', // Set status so admin sees it
        negotiationHistory: arrayUnion(newNegotiationEntry), // Add to history
      });
      
      setIsModalVisible(false);
      setSelectedRequest(null);

    } catch (error) {
      console.error('Error submitting negotiation:', error);
      Alert.alert('Error', 'Could not submit your counter-offer.');
    }
  };

  // ... (handleCallSupport function is the same)
  const handleCallSupport = () => {
    const supportNumber = '+919449960432'; 
    Alert.alert(
      'Call Support',
      `Would you like to call our team at ${supportNumber} to finalize this quote?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'default',
          onPress: () => {
            Linking.openURL(`tel:${supportNumber}`);
          },
        },
      ],
    );
  };

  // ... (RenderQuoteDetails is the same)
  const RenderQuoteDetails = ({ item }: { item: ServiceRequest }) => {
    const hasCustomerNegotiated = item.negotiationHistory?.some(
      (entry) => entry.from === 'customer',
    );

    if (item.status === 'quote_provided' && item.quote) {
      return (
        <View style={styles.quoteBox}>
          <Text style={styles.quoteTitle}>
            {hasCustomerNegotiated ? 'Final Quote Received' : 'Quote Received'}
          </Text>
          <Text style={styles.quotePrice}>
            Price: ₹{item.quote.price.toLocaleString()}
          </Text>
          <Text style={styles.quoteTerms}>Terms: {item.quote.terms || 'N/A'}</Text>
          <View style={styles.buttonContainer}>
            {hasCustomerNegotiated ? (
              <Button
                title="Call Support"
                onPress={handleCallSupport}
                color="#f39c12"
              />
            ) : (
              <Button
                title="Negotiate"
                onPress={() => handleOpenNegotiateModal(item)}
                color="#f39c12"
              />
            )}
            <Button
              title="Accept Quote"
              onPress={() => handleAcceptQuote(item.id)}
              color="#27ae60"
            />
          </View>
        </View>
      );
    }

    if (item.status === 'quote_negotiating') {
      const lastOffer = item.negotiationHistory?.slice(-1)[0];
      return (
        <View style={styles.quoteBox}>
          <Text style={styles.negotiatingText}>
            Counter-offer of ₹{lastOffer?.price.toLocaleString()} submitted.
          </Text>
          <Text style={styles.negotiatingSubtext}>
            Waiting for admin to respond...
          </Text>
        </View>
      );
    }

    if (item.status === 'quote_accepted') {
      return (
        <Text style={styles.acceptedText}>
          Quote accepted! Our team will be in touch to coordinate.
        </Text>
      );
    }
    return null;
  };

  // ... (Main component return is the same)
  if (loading || authLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Service Requests</Text>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <Text style={styles.cardTitle}>{item.serviceName}</Text>
              <Text style={styles.cardDetails}>{item.details}</Text>
              <Text
                style={[
                  styles.cardStatus,
                  { color: 
                      item.status === 'quote_provided' ? '#e67e22' : 
                      item.status === 'quote_negotiating' ? '#8e44ad' : '#555' 
                  },
                ]}
              >
                {formatStatus(item.status)}
              </Text>
              <RenderQuoteDetails item={item} />
            </View>
          )}
        />
      </View>
      
      {selectedRequest && (
        <NegotiationModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSubmit={handleSubmitNegotiation}
          adminPrice={selectedRequest.quote!.price}
        />
      )}
    </SafeAreaView>
  );
}

// ... (Styles are exactly the same)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 50 },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  cardDetails: { fontSize: 14, color: '#555', marginBottom: 10, lineHeight: 20 },
  cardStatus: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  quoteBox: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quoteTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  quotePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginVertical: 5,
  },
  quoteTerms: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  acceptedText: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  negotiatingText: {
    fontSize: 16,
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  negotiatingSubtext: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 5,
  },
});