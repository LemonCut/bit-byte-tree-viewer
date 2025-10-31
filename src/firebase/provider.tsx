// src/firebase/provider.tsx
'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { createContext, useContext } from 'react';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
};

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

export const FirebaseProvider = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) => {
  return (
    <FirebaseContext.Provider value={props}>{children}</FirebaseContext.Provider>
  );
};

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};
