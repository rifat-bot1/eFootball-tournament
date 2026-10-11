/**
 * =========================================================================
 * eFootball Tournament Arena - Real-Time Firestore Announcement Service
 * =========================================================================
 * Fetches and listens to real-time tournament announcements, urgent breaking news,
 * and system updates from the dedicated Firestore `announcements` collection.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { TournamentAnnouncement } from '../types/tournament';
import { sendTelegramNotification } from './telegramService';

const COLLECTION_NAME = 'announcements';
const STORAGE_KEY_ANNOUNCEMENTS = 'efootball_cached_announcements';

// Default starter announcements for instant, rich dashboard experience
export const INITIAL_ANNOUNCEMENTS: TournamentAnnouncement[] = [
  {
    id: 'ann_urgent_season1',
    title: '🚨 Urgent Match Schedule Alert',
    message: 'All players must complete their scheduled Friend Matches and upload result screenshots with clear score proof within 24 hours. Unplayed matches risk forfeit!',
    type: 'urgent',
    priority: 'high',
    active: true,
    authorName: 'Mohammad Rifat (Tournament Organizer)',
    createdAt: new Date().toISOString(),
    actionLabel: 'Check Fixtures',
    actionUrl: '#fixtures'
  },
  {
    id: 'ann_welcome_tour',
    title: '🏆 Season 1 Championship Registration Open',
    message: 'Welcome to the official eFootball BD Arena! 2,500 eFootball Coins + Champion badge up for grabs. Invite your clan & friends to register now!',
    type: 'tournament',
    priority: 'medium',
    active: true,
    authorName: 'Tournament Committee',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    actionLabel: 'Join Tournament',
    actionUrl: '#dashboard'
  }
];

export function getCachedAnnouncements(): TournamentAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached announcements:', err);
  }
  return INITIAL_ANNOUNCEMENTS;
}

export function saveCachedAnnouncements(list: TournamentAnnouncement[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to cache announcements in localStorage:', err);
  }
}

/**
 * Real-time subscription to Firestore announcements collection.
 * Triggers callback on initial load and every live server update.
 */
export function subscribeToAnnouncements(
  callback: (announcements: TournamentAnnouncement[]) => void
): () => void {
  // Emit cached or initial data immediately for instant zero-latency UI
  const initial = getCachedAnnouncements();
  callback(initial);

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TournamentAnnouncement[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              title: data.title || 'Announcement',
              message: data.message || '',
              type: data.type || 'info',
              priority: data.priority || 'medium',
              active: typeof data.active === 'boolean' ? data.active : true,
              createdBy: data.createdBy,
              authorName: data.authorName || 'Tournament Desk',
              createdAt: data.createdAt || new Date().toISOString(),
              actionUrl: data.actionUrl,
              actionLabel: data.actionLabel,
              expiresAt: data.expiresAt
            });
          });

          // Sort by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          saveCachedAnnouncements(list);
          callback(list);
        } else {
          // Fallback to local default starter notices
          callback(getCachedAnnouncements());
          if (auth.currentUser && auth.currentUser.email === 'rfrifatbs@gmail.com') {
            seedInitialAnnouncementsToFirestore().catch(() => {});
          }
        }
      },
      (_error) => {
        // Fallback to cached notices on network interruptions
        callback(getCachedAnnouncements());
      }
    );

    return unsubscribe;
  } catch (_err) {
    return () => {};
  }
}

/**
 * Seed initial starter announcements if empty
 */
async function seedInitialAnnouncementsToFirestore(): Promise<void> {
  try {
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      const docRef = doc(db, COLLECTION_NAME, ann.id);
      await setDoc(docRef, ann, { merge: true });
    }
  } catch {}
}

/**
 * Publish a new announcement
 */
export async function createAnnouncement(data: {
  title: string;
  message: string;
  type: 'urgent' | 'tournament' | 'maintenance' | 'info';
  priority?: 'high' | 'medium' | 'low';
  authorName?: string;
  createdBy?: string;
  actionUrl?: string;
  actionLabel?: string;
  postToTelegram?: boolean;
}): Promise<TournamentAnnouncement> {
  const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newAnnouncement: TournamentAnnouncement = {
    id,
    title: data.title.trim(),
    message: data.message.trim(),
    type: data.type,
    priority: data.priority || (data.type === 'urgent' ? 'high' : 'medium'),
    active: true,
    createdBy: data.createdBy,
    authorName: data.authorName || 'Mohammad Rifat (Tournament Organizer)',
    createdAt: new Date().toISOString(),
    actionUrl: data.actionUrl?.trim(),
    actionLabel: data.actionLabel?.trim()
  };

  // 1. Save to cloud storage if authorized
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, newAnnouncement);
  } catch {}

  // 2. Update local cache
  const cached = getCachedAnnouncements();
  const updated = [newAnnouncement, ...cached.filter(a => a.id !== id)];
  saveCachedAnnouncements(updated);

  // 3. Optional Telegram Broadcast
  if (data.postToTelegram) {
    try {
      const typeBadge = data.type === 'urgent' ? '🚨 URGENT ANNOUNCEMENT' : '📢 TOURNAMENT NEWS UPDATE';
      const telegramText = 
        `<b>${typeBadge}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 <b>${newAnnouncement.title}</b>\n\n` +
        `${newAnnouncement.message}\n\n` +
        `✍️ <i>Author: ${newAnnouncement.authorName}</i>\n` +
        `⏰ <i>${new Date().toLocaleString()}</i>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ Check live tournament updates on eFootball Arena Web App!`;

      await sendTelegramNotification({
        event: 'test_ping',
        text: telegramText
      });
    } catch (teleErr) {
      console.warn('Telegram announcement broadcast error:', teleErr);
    }
  }

  return newAnnouncement;
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch {}

  const cached = getCachedAnnouncements();
  saveCachedAnnouncements(cached.filter(a => a.id !== id));
}

/**
 * Toggle announcement active status
 */
export async function toggleAnnouncementActive(id: string, active: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { active });
  } catch {}

  const cached = getCachedAnnouncements();
  const updated = cached.map(a => a.id === id ? { ...a, active } : a);
  saveCachedAnnouncements(updated);
}
