/**
 * Firebase & Cloud Firestore Configuration with Offline Persistence & Cloud Sync
 * Configures persistent local cache (IndexedDB) with multi-tab manager and cloud database synchronization.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import type { CollectionName } from '../types/index.ts';

export const firebaseConfig = {
  apiKey: "AIzaSyDNVXh1vj_LqBvCoon3lSILxo0RM2tJdkc",
  authDomain: "raildairy-dfcc.firebaseapp.com",
  projectId: "raildairy-dfcc",
  storageBucket: "raildairy-dfcc.firebasestorage.app",
  messagingSenderId: "646558743589",
  appId: "1:646558743589:web:630f09df40802055d593cc",
  measurementId: "G-17CXDFFJ4W"
};

let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;
let cachedAuth: Auth | null = null;

/**
 * Initializes and returns Firebase App instance.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(firebaseConfig);
    }
  }
  return cachedApp;
}

/**
 * Initializes and returns Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    const app = getFirebaseApp();
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User };

/**
 * Initializes and returns Cloud Firestore with offline persistence enabled.
 * Uses persistentLocalCache and multi-tab synchronization.
 */
export function getFirestoreInstance(): Firestore {
  if (cachedFirestore) {
    return cachedFirestore;
  }

  const app = getFirebaseApp();

  try {
    // Modular Firestore v9/v10/v11 offline cache setup
    cachedFirestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err: any) {
    // If already initialized, retrieve existing instance
    if (err?.code === 'failed-precondition' || err?.message?.includes('already been initialized')) {
      cachedFirestore = getFirestore(app);
    } else {
      console.warn('Persistent cache initialization warning, falling back to default getFirestore:', err);
      cachedFirestore = getFirestore(app);
    }
  }

  return cachedFirestore;
}

/**
 * Helper to check whether Firebase environment is configured.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Upload an entire collection of items to Cloud Firestore
 */
export async function syncCollectionToFirestore(colName: string, items: any[]): Promise<number> {
  if (!isFirebaseConfigured()) return 0;
  const db = getFirestoreInstance();
  let count = 0;

  // Process in batches of 400 (Firestore limit is 500)
  const batchSize = 400;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docId = String(item.id || item.docId || `doc_${count}`);
      const docRef = doc(db, colName, docId);
      batch.set(docRef, item, { merge: true });
      count++;
    }

    try {
      await batch.commit();
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        throw new Error(
          'Missing or insufficient permissions in Firebase Cloud Firestore.\n\n' +
          'To fix this in 1 minute:\n' +
          '1. Open Firebase Console (console.firebase.google.com)\n' +
          '2. Go to "raildairy-dfcc" -> Build -> Firestore Database -> Rules\n' +
          '3. Set rules to:\n' +
          '   rules_version = \'2\';\n' +
          '   service cloud.firestore {\n' +
          '     match /databases/{database}/documents {\n' +
          '       match /{document=**} {\n' +
          '         allow read, write: if true;\n' +
          '       }\n' +
          '     }\n' +
          '   }\n' +
          '4. Click "Publish".'
        );
      }
      throw err;
    }
  }

  return count;
}

/**
 * Sync single document update to Cloud Firestore
 */
export async function syncDocToFirestore(colName: string, docId: string, data: any): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getFirestoreInstance();
    const docRef = doc(db, colName, String(docId));
    await setDoc(docRef, data, { merge: true });
  } catch (err: any) {
    console.warn(`Firestore sync write error for ${colName}/${docId}:`, err?.message || err);
  }
}

/**
 * Sync document deletion to Cloud Firestore
 */
export async function deleteDocFromFirestore(colName: string, docId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getFirestoreInstance();
    const docRef = doc(db, colName, String(docId));
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn(`Firestore sync delete error for ${colName}/${docId}:`, err?.message || err);
  }
}

/**
 * Fetch all documents for a collection from Cloud Firestore
 */
export async function fetchCollectionFromFirestore(colName: string): Promise<any[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const db = getFirestoreInstance();
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err: any) {
    console.warn(`Firestore fetch error for ${colName}:`, err?.message || err);
    return [];
  }
}
