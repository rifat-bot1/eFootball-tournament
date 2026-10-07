/**
 * =========================================================================
 * eFootball Tournament Arena - Provisioned Firebase Integration
 * =========================================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  onSnapshot,
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, MatchFixture, Tournament, LeaderboardEntry } from '../types/tournament';

// 1. Initialize Firebase App and Services
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Enable permanent local persistence for Firebase Auth session
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase auth persistence setup:', err);
  });
}

export function onFirebaseAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// 2. Validate Connection to Firestore on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Successfully connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 3. Structured Firestore Error Handling (Skill Directive)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Google Authentication (Skill Directive: Only Google login via signInWithPopup)
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// 5. High-level Sync Functions for Tournament Arena

/**
 * Upload match screenshot to Firebase Storage with fallback
 */
export async function uploadMatchScreenshot(
  dataUrlOrFile: string, 
  matchId: string, 
  uploaderId: string
): Promise<string> {
  if (dataUrlOrFile.startsWith('data:')) {
    try {
      const storageRef = ref(storage, `match_screenshots/${matchId}_${uploaderId}_${Date.now()}.png`);
      const snapshot = await uploadString(storageRef, dataUrlOrFile, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (e) {
      console.warn('Storage upload fallback to data URI:', e);
    }
  }
  return dataUrlOrFile;
}

/**
 * Sync tournament to Firestore database
 */
export async function syncTournamentToFirestore(tournament: Tournament): Promise<void> {
  const path = `tournaments/${tournament.id}`;
  try {
    await setDoc(doc(db, 'tournaments', tournament.id), tournament, { merge: true });
  } catch (error) {
    console.warn('Firestore syncTournament skipped:', error);
  }
}

/**
 * Sync fixture to Firestore database
 */
export async function syncFixtureToFirestore(fixture: MatchFixture): Promise<void> {
  const path = `fixtures/${fixture.id}`;
  try {
    await setDoc(doc(db, 'fixtures', fixture.id), fixture, { merge: true });
  } catch (error) {
    console.warn('Firestore syncFixture skipped:', error);
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserToFirestore(user: UserProfile): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (error) {
    console.warn('Firestore syncUser skipped:', error);
  }
}

export const firebaseServices = {
  app,
  db,
  auth,
  storage,
  live: true
};
