// src/firebase/index.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getFirebaseConfig } from './config';

export function initializeFirebase() {
  const firebaseConfig = getFirebaseConfig();
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  return { firebaseApp: app, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './auth/use-user';
