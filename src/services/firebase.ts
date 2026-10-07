/**
 * =========================================================================
 * eFootball Tournament Arena - Firebase Modular Service
 * =========================================================================
 * 
 * Tech Stack: Firebase Web SDK v11 (Auth, Firestore, Storage)
 * 
 * WHERE TO PUT YOUR FIREBASE CONFIG KEYS:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Add a Web App in your Firebase Project settings
 * 3. Copy the credentials and replace the placeholder object below, OR
 *    enter them directly into the "Firebase Settings" modal inside the app UI!
 * 4. Remember to enable:
 *    - Authentication -> Email/Password & Google provider
 *    - Firestore Database -> Create database in production/test rules
 *    - Firebase Storage -> Get started
 * =========================================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider, 
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import { FirebaseConfigSettings, UserProfile, MatchFixture, Tournament, LeaderboardEntry } from '../types/tournament';

// User's Active Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigSettings = {
  apiKey: "AIzaSyAaS43F8wsXW7nBStStn9_Oy3beTzzmi2s",
  authDomain: "efootball-tournament-390f3.firebaseapp.com",
  projectId: "efootball-tournament-390f3",
  storageBucket: "efootball-tournament-390f3.firebasestorage.app",
  messagingSenderId: "366690770197",
  appId: "1:366690770197:web:04abb659578cde5aee1d1c",
  measurementId: "G-S9P6QB49NM",
  isConfigured: true
};

const STORAGE_KEY_FIREBASE = 'efootball_firebase_custom_config';

export function getStoredFirebaseConfig(): FirebaseConfigSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && !parsed.apiKey.includes('Dummy')) {
        return { ...parsed, isConfigured: true };
      }
    }
  } catch (e) {
    console.error('Failed reading firebase config from storage', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveStoredFirebaseConfig(config: FirebaseConfigSettings): void {
  localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
}

let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  if (config.apiKey && !config.apiKey.includes('Dummy')) {
    try {
      if (!getApps().length) {
        firebaseAppInstance = initializeApp(config);
      } else {
        firebaseAppInstance = getApp();
      }
      authInstance = getAuth(firebaseAppInstance);
      firestoreInstance = getFirestore(firebaseAppInstance);
      storageInstance = getStorage(firebaseAppInstance);

      // Safe Analytics initialization
      if (typeof window !== 'undefined' && config.measurementId) {
        isAnalyticsSupported().then((supported) => {
          if (supported && firebaseAppInstance) {
            analyticsInstance = getAnalytics(firebaseAppInstance);
          }
        }).catch(() => {});
      }

      console.log('✅ Real Firebase SDK connected: ' + config.projectId);
      return { 
        app: firebaseAppInstance, 
        auth: authInstance, 
        db: firestoreInstance, 
        storage: storageInstance, 
        analytics: analyticsInstance,
        live: true 
      };
    } catch (err) {
      console.warn('⚠️ Firebase initialization notice:', err);
    }
  }
  return { app: null, auth: null, db: null, storage: null, analytics: null, live: false };
}

// Initial setup
export const firebaseServices = initFirebase();

/**
 * Upload match result screenshot to Firebase Storage (with local fallback)
 */
export async function uploadMatchScreenshot(
  dataUrlOrFile: string, 
  matchId: string, 
  uploaderId: string
): Promise<string> {
  const { storage, live } = initFirebase();

  if (live && storage && dataUrlOrFile.startsWith('data:')) {
    try {
      const storageRef = ref(storage, `match_screenshots/${matchId}_${uploaderId}_${Date.now()}.png`);
      const snapshot = await uploadString(storageRef, dataUrlOrFile, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('✅ Screenshot uploaded to Firebase Storage:', downloadUrl);
      return downloadUrl;
    } catch (e) {
      console.warn('Firebase storage upload fallback to data URL:', e);
    }
  }

  return dataUrlOrFile;
}

/**
 * Sync tournament to Firestore database
 */
export async function syncTournamentToFirestore(tournament: Tournament): Promise<void> {
  const { db, live } = initFirebase();
  if (live && db) {
    try {
      await setDoc(doc(db, 'tournaments', tournament.id), tournament, { merge: true });
    } catch (e) {
      console.warn('Firestore syncTournament error:', e);
    }
  }
}

/**
 * Sync fixture to Firestore database
 */
export async function syncFixtureToFirestore(fixture: MatchFixture): Promise<void> {
  const { db, live } = initFirebase();
  if (live && db) {
    try {
      await setDoc(doc(db, 'fixtures', fixture.id), fixture, { merge: true });
    } catch (e) {
      console.warn('Firestore syncFixture error:', e);
    }
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserToFirestore(user: UserProfile): Promise<void> {
  const { db, live } = initFirebase();
  if (live && db) {
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.warn('Firestore syncUser error:', e);
    }
  }
}
