// staffsetu_customer/app.config.js
require('dotenv').config({ path: './.env.local' });

export default ({ config }) => ({
  ...config,
  name: "staffsetu_customer",
  slug: "staffsetu_customer",
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    phoneEmailClientId: process.env.PHONE_EMAIL_CLIENT_ID,
  },
  
  // --- THIS IS THE NEW PART ---
  android: {
    ...config.android, // Inherit existing config
    package: "com.staffsetu.customer",
    googleServicesFile: "./google-services.json",
    // This injects the API key into the native Android build
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  },
  // ----------------------------
  
  ios: {
    ...config.ios, // Inherit existing config
    supportsTablet: true,
    bundleIdentifier: "com.staffsetu.customer",
    googleServicesFile: "./GoogleService-Info.plist"
  },
  web: {
    ...config.web,
    favicon: "./assets/favicon.png"
  },
});