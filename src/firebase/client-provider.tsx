'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    try {
      return initializeFirebase();
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
      return null;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  if (!firebaseServices) {
    // Render children without Firebase context if initialization fails.
    // Firestore-dependent parts of the app will not function.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
