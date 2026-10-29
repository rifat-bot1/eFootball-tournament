/**
 * =========================================================================
 * eFootball Tournament Arena - Master App Settings Service
 * =========================================================================
 * Manages all global app configurations, customizable details, payment numbers,
 * contact links, rules defaults, and emergency banners.
 */

import { AppSettings } from '../types/tournament';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_STORAGE_KEY = 'efootball_app_settings_master_v1';
const FIRESTORE_SETTINGS_COLLECTION = 'system_settings';
const FIRESTORE_SETTINGS_DOC = 'global_config';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: 'eFootball BD Arena',
  appTagline: 'Bangladesh Premier eFootball Esports Championship',
  telegramChannelUrl: 'https://t.me/eFootballTournamentBD',
  telegramGroupUrl: 'https://t.me/eFootballTournamentBDGroup',
  whatsappNumber: '+8801700000000',
  supportPhone: '+8801700000000',
  bkashNumber: '01621833825 (Personal / Send Money)',
  nagadNumber: '01621833825 (Personal / Send Money)',
  rocketNumber: '01621833825 (Personal)',
  paymentInstructions: 'রেজিস্ট্রেশন ফি পাঠাতে bKash অথবা Nagad-এ Send Money করুন এবং রেফারেন্সে আপনার eFootball ID লিখুন। পেমেন্ট শেষে ট্রানজেকশন আইডি বা সেন্ডার নম্বর জমা দিন।',
  urgentTickerText: '🔥 Season 1 Championship Registration Open! Play & Win eFootball Coins & Prizes!',
  isUrgentTickerActive: true,
  defaultEntryFee: 0,
  defaultMatchLength: '10 Mins',
  defaultExtraTime: false,
  defaultPenalties: true,
  defaultCondition: 'Excellent',
  screenshotDeadlineMinutes: 60,
  allowPlayerRegistration: true,
  maintenanceMode: false
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed
      };
    }
  } catch (e) {
    console.warn('Error reading app settings from localStorage:', e);
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('app_settings_updated', { detail: settings }));

    // Sync to Firestore in background
    if (db) {
      const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SETTINGS_DOC);
      setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true })
        .catch((err) => console.warn('Could not sync settings to Firestore:', err));
    }
  } catch (e) {
    console.error('Error saving app settings:', e);
  }
}

export function updateAppSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...updates
  };
  saveAppSettings(updated);
  return updated;
}

export function resetAppSettings(): AppSettings {
  saveAppSettings(DEFAULT_APP_SETTINGS);
  return DEFAULT_APP_SETTINGS;
}

/**
 * React hook or listener helper for live settings sync across tabs & components
 */
export function subscribeToAppSettings(callback: (settings: AppSettings) => void): () => void {
  // Fire initial value
  callback(getAppSettings());

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<AppSettings>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getAppSettings());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      callback(getAppSettings());
    }
  };

  window.addEventListener('app_settings_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Also fetch from Firestore once if online
  if (db) {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SETTINGS_DOC);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const firestoreData = snap.data() as Partial<AppSettings>;
        const merged = { ...getAppSettings(), ...firestoreData };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        callback(merged);
      }
    }).catch(() => {});
  }

  return () => {
    window.removeEventListener('app_settings_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
