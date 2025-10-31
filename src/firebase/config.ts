
// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

// This configuration is public and safe to expose in client-side code.
// Firebase security is handled by Firestore Security Rules, not by hiding this config.
const firebaseConfig: FirebaseOptions = {
  projectId: 'studio-9860458777-cd8ef',
  appId: '1:113778645763:web:d48d4cea9cc59ce873e736',
  apiKey: 'AIzaSyA3lc5Qry46gGOMBMH_w6CTM3kgWzVg85U',
  authDomain: 'studio-9860458777-cd8ef.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '113778645763'
};

export function getFirebaseConfig() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error(
      'No Firebase configuration object provided.'
    );
  }
  return firebaseConfig;
}
