// src/firebase/client-provider.tsx
'use client';
import { useMemo } from 'react';
import { initializeFirebase, FirebaseProvider } from '.';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, firestore, auth } = useMemo(
    () => initializeFirebase(),
    []
  );

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
