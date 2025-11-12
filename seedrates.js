// seedRates.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedServiceRates() {
  try {
    console.log('Fetching existing services from Firestore...');
    const servicesSnapshot = await db.collection('services').get();
    
    if (servicesSnapshot.empty) {
      console.log('No services found. Exiting.');
      return;
    }

    console.log(`Found ${servicesSnapshot.size} services. Populating serviceRates...`);
    
    const ratesCollection = db.collection('serviceRates');
    let count = 0;

    for (const doc of servicesSnapshot.docs) {
      const service = doc.data();
      const serviceId = doc.id;
      
      const rateData = {
        serviceId: serviceId,
        serviceName: service.name || 'Unnamed Service',
        rate: service.basePrice || 100, // Use existing basePrice or a default
        unit: service.priceUnit || "per hour" // Use existing unit or a default
      };

      // Use the service ID as the document ID for the rate
      await ratesCollection.doc(serviceId).set(rateData);
      
      console.log(`  - Created/updated rate for: ${service.name}`);
      count++;
    }

    console.log(`\n✅ Seeding complete! ${count} service rates processed.`);
  } catch (error) {
    console.error('❌ Error seeding serviceRates:', error);
  }
}

seedServiceRates();