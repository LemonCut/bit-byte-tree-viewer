// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

export function getFirebaseConfig() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error(
      'No Firebase configuration object provided.' +
        'Add your web app\'s configuration object to .env.local'
    );
  }
  return firebaseConfig;
}
