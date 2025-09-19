// firebase-config.js

// This global variable will be used by app.js to initialize Firebase.
// IMPORTANT: Replace the placeholder values below with your actual Firebase project's configuration.
const firebaseConfig = {
    apiKey: "AIzaSyD5pCrKNq3hcJleuUmMFTCU2wi2_L_EHH8",
  authDomain: "containers-79130.firebaseapp.com",
  projectId: "containers-79130",
  storageBucket: "containers-79130.firebasestorage.app",
  messagingSenderId: "299184337314",
  appId: "1:299184337314:web:f7ddea3f3fee565d30c2fb",
  measurementId: "G-R7ZQ0HKM6Y"
};

// This variable is used to create unique paths to your database collections.
// For local testing, it uses a default value.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'container-app-local-dev';
