'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

let auth: Auth | null = null;
let firestore: Firestore | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  // We only need firestore for this app, so we can conditionally initialize auth
  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
  // No auth needed for now
  // if (!auth) {
  //   auth = getAuth(firebaseApp);
  // }

  return { firebaseApp, auth, firestore };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
