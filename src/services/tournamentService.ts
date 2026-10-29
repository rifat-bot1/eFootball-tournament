import { 
  Tournament, 
  MatchFixture, 
  UserProfile, 
  LeaderboardEntry, 
  MatchResult,
  TournamentRules 
} from '../types/tournament';
import { 
  SEED_PLAYERS, 
  SEED_TOURNAMENTS, 
  SEED_FIXTURES, 
  ADMIN_EMAIL, 
  ADMIN_PASSWORD, 
  isUserAdmin,
  OFFICIAL_ADMIN_PROFILE,
  DEFAULT_GUEST_PLAYER,
  HISTORICAL_COMPLETED_TOURNAMENTS,
  HISTORICAL_COMPLETED_FIXTURES
} from './mockData';
import { sendTelegramNotification } from './telegramService';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  db,
  uploadMatchScreenshot, 
  syncTournamentToFirestore, 
  deleteTournamentFromFirestore,
  syncFixtureToFirestore, 
  deleteFixtureFromFirestore,
  syncUserToFirestore 
} from './firebase';

export { 
  ADMIN_EMAIL, 
  ADMIN_PASSWORD, 
  isUserAdmin,
  HISTORICAL_COMPLETED_TOURNAMENTS,
  HISTORICAL_COMPLETED_FIXTURES
};

const STORAGE_USERS = 'efootball_users_clean_v3';
const STORAGE_CURRENT_USER = 'efootball_current_user_clean_v3';
const STORAGE_PERMANENT_USER = 'efootball_active_user_session_permanent';
const STORAGE_TOURNAMENTS = 'efootball_tournaments_clean_v3';
const STORAGE_FIXTURES = 'efootball_fixtures_clean_v3';

// Immediate cleanup of old legacy demo keys from browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('efootball_users_v1');
    localStorage.removeItem('efootball_tournaments_v1');
    localStorage.removeItem('efootball_fixtures_v1');
    localStorage.removeItem('efootball_current_user_v1');
    localStorage.removeItem('efootball_users_v2');
    localStorage.removeItem('efootball_tournaments_v2');
    localStorage.removeItem('efootball_fixtures_v2');
    localStorage.removeItem('efootball_current_user_v2');
  } catch (e) {}
}

// Initial state helpers
export function getUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      // Remove any leftover demo player emails
      const cleaned = parsed.filter(u => 
        !['striker@efootball.com', 'neymar@efootball.com', 'saka@efootball.com', 'haaland@efootball.com', 'messi@efootball.com', 'yamal@efootball.com', 'bellingham@efootball.com', 'debruyne@efootball.com'].includes(u.email)
      );
      if (cleaned.length === 0) {
        cleaned.push(SEED_PLAYERS[0]);
      }
      localStorage.setItem(STORAGE_USERS, JSON.stringify(cleaned));
      return cleaned;
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_USERS, JSON.stringify(SEED_PLAYERS));
  return SEED_PLAYERS;
}

/**
 * Returns currently saved persistent user session.
 * Always remembers the logged-in user across tab reloads, restarts, and sessions.
 */
export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_PERMANENT_USER) || localStorage.getItem(STORAGE_CURRENT_USER);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      if (parsed && parsed.id && parsed.name) {
        // Enforce strict security: ONLY ADMIN_EMAIL can have role 'admin'
        if (parsed.role === 'admin' && parsed.email?.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          parsed.role = 'player';
        }
        // Fix outdated or broken Unsplash avatars
        if (parsed.avatarUrl?.includes('unsplash.com') || !parsed.avatarUrl) {
          parsed.avatarUrl = parsed.role === 'admin' ? './images/avatar-admin.svg' : './images/avatar-player.svg';
        }
        // Ensure eFootball ID is restored from permanent email mapping if available
        const savedId = (parsed.email && localStorage.getItem(`efootball_saved_id_${parsed.email.toLowerCase()}`)) ||
          localStorage.getItem('efootball_saved_id_last') ||
          parsed.efootballId;
        if (savedId) {
          parsed.efootballId = savedId;
        }
        return parsed;
      }
    }
  } catch (e) {}
  const defaultUser = { ...DEFAULT_GUEST_PLAYER };
  try {
    const savedId = localStorage.getItem('efootball_saved_id_last');
    if (savedId) {
      defaultUser.efootballId = savedId;
    }
    localStorage.setItem(STORAGE_PERMANENT_USER, JSON.stringify(defaultUser));
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(defaultUser));
  } catch (e) {}
  return defaultUser;
}

/**
 * Persist user permanently into localStorage and sync with app users
 */
export function setCurrentUser(user: UserProfile): void {
  try {
    // Remember eFootball ID specifically for this email and globally
    if (user.efootballId) {
      localStorage.setItem('efootball_saved_id_last', user.efootballId);
      if (user.email) {
        localStorage.setItem(`efootball_saved_id_${user.email.toLowerCase()}`, user.efootballId);
      }
    }
    localStorage.setItem(STORAGE_PERMANENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(user));

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  } catch (e) {}
}

/**
 * Explicit logout clearing session
 */
export function clearCurrentUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_PERMANENT_USER);
    localStorage.removeItem(STORAGE_CURRENT_USER);
  } catch (e) {}
}

/**
 * Helper to match or create a profile for an authenticated Firebase user
 */
export function getOrCreateUserProfileForAuth(
  authEmail: string, 
  displayName?: string, 
  photoURL?: string,
  preferredEfootballId?: string
): UserProfile {
  const users = getUsers();
  const isMasterAdmin = authEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const existing = users.find(u => u.email.toLowerCase() === authEmail.toLowerCase());
  if (existing) {
    if (isMasterAdmin) {
      existing.role = 'admin';
      existing.name = displayName || OFFICIAL_ADMIN_PROFILE.name;
      existing.avatarUrl = photoURL || OFFICIAL_ADMIN_PROFILE.avatarUrl;
    } else {
      existing.role = 'player';
    }
    if (preferredEfootballId && preferredEfootballId !== existing.efootballId) {
      existing.efootballId = preferredEfootballId;
    }
    setCurrentUser(existing);
    return existing;
  }

  if (isMasterAdmin) {
    const adminUser: UserProfile = {
      ...OFFICIAL_ADMIN_PROFILE,
      name: displayName || OFFICIAL_ADMIN_PROFILE.name,
      avatarUrl: photoURL || OFFICIAL_ADMIN_PROFILE.avatarUrl
    };
    users.push(adminUser);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    setCurrentUser(adminUser);
    syncUserToFirestore(adminUser).catch(() => {});
    return adminUser;
  }

  const rememberedId = preferredEfootballId || 
    localStorage.getItem(`efootball_saved_id_${authEmail.toLowerCase()}`) || 
    `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: displayName || authEmail.split('@')[0],
    email: authEmail,
    efootballId: rememberedId,
    avatarUrl: photoURL || './images/avatar-player.svg',
    role: 'player',
    favoriteClub: 'eFootball FC',
    rating: 1500,
    division: 'Division 3',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  setCurrentUser(newUser);
  syncUserToFirestore(newUser).catch(() => {});
  return newUser;
}

/**
 * Update player profile details and sync across fixtures and storage
 */
export function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): UserProfile {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  const current = getCurrentUser();

  const targetUser = index >= 0 ? users[index] : current;

  // Strict security: Never allow non-master-admin to claim admin role
  const isMasterAdmin = (data.email || targetUser.email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const safeRole = isMasterAdmin ? (data.role || targetUser.role) : 'player';

  // 1. Check eFootball In-Game ID change & enforce 10-day cooldown and uniqueness
  const newEfootballId = data.efootballId ? data.efootballId.trim() : targetUser.efootballId;
  const isIdChanged = Boolean(
    targetUser.efootballId && 
    newEfootballId.toLowerCase() !== targetUser.efootballId.trim().toLowerCase()
  );

  let newLastChangedAt = targetUser.lastEfootballIdChangedAt;

  if (isIdChanged) {
    // A) Enforce uniqueness across all players
    const idDuplicate = users.find(
      u => u.id !== targetUser.id && 
           u.efootballId && 
           u.efootballId.trim().toLowerCase() === newEfootballId.toLowerCase()
    );
    if (idDuplicate) {
      throw new Error(`eFootball In-Game ID "${newEfootballId}" is already taken by player "${idDuplicate.name}". Every player must have a unique ID! (এই eFootball In-Game ID টি অন্য একজন খেলোয়াড় ইতিমধ্যে ব্যবহার করছেন। সবার আইডি আলাদা হতে হবে।)`);
    }

    // B) Enforce 10-day cooldown rule
    if (targetUser.lastEfootballIdChangedAt) {
      const COOLDOWN_DAYS = 10;
      const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const lastChange = new Date(targetUser.lastEfootballIdChangedAt).getTime();
      const elapsed = Date.now() - lastChange;
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        throw new Error(
          `eFootball In-Game ID can only be changed once every 10 days! Please wait ${remainingDays > 1 ? `${remainingDays} more days` : `${remainingHours} more hours`} before changing your ID again. (eFootball In-Game ID ১০ দিন পরপর পরিবর্তন করা যাবে।)`
        );
      }
    }

    // Record timestamp of this eFootball ID modification
    newLastChangedAt = new Date().toISOString();
  }

  // 2. Check email change and uniqueness
  const newEmail = data.email ? data.email.trim() : targetUser.email;
  const isEmailChanged = Boolean(
    targetUser.email && 
    newEmail.toLowerCase() !== targetUser.email.trim().toLowerCase()
  );
  if (isEmailChanged && newEmail) {
    const emailDuplicate = users.find(
      u => u.id !== targetUser.id && 
           u.email && 
           u.email.trim().toLowerCase() === newEmail.toLowerCase()
    );
    if (emailDuplicate) {
      throw new Error(`Email address "${newEmail}" is already registered to another account.`);
    }
    if (newEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && targetUser.id !== OFFICIAL_ADMIN_PROFILE.id) {
      throw new Error('This email address is reserved exclusively for the Admin.');
    }
  }

  // 3. Password validation
  let updatedPassword = targetUser.password;
  if (data.password !== undefined && data.password.trim() !== '') {
    if (data.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    updatedPassword = data.password.trim();
  }

  const updatedUser: UserProfile = {
    ...targetUser,
    ...data,
    id: targetUser.id, // preserve immutable ID
    role: safeRole,
    efootballId: newEfootballId,
    name: data.name?.trim() || targetUser.name,
    email: newEmail,
    avatarUrl: data.avatarUrl || targetUser.avatarUrl,
    favoriteClub: data.favoriteClub?.trim() || targetUser.favoriteClub || 'eFootball FC',
    division: data.division || targetUser.division || 'Division 3',
    playstyle: data.playstyle || targetUser.playstyle || 'Quick Counter',
    phone: data.phone !== undefined ? data.phone.trim() : targetUser.phone,
    bio: data.bio !== undefined ? data.bio.trim() : targetUser.bio,
    password: updatedPassword,
    lastEfootballIdChangedAt: newLastChangedAt
  };

  // Update in users array
  if (index >= 0) {
    users[index] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

  // If this is the current active user, update current session
  if (current.id === updatedUser.id || (current.email && updatedUser.email && current.email.toLowerCase() === updatedUser.email.toLowerCase())) {
    setCurrentUser(updatedUser);
  }

  // Update permanent eFootball ID map
  if (updatedUser.efootballId) {
    localStorage.setItem('efootball_saved_id_last', updatedUser.efootballId);
    if (updatedUser.email) {
      localStorage.setItem(`efootball_saved_id_${updatedUser.email.toLowerCase()}`, updatedUser.efootballId);
      localStorage.setItem('efootball_remembered_email', updatedUser.email);
    }
  }

  // Reflect new name, avatar, and in-game ID in fixtures
  try {
    const rawFixtures = localStorage.getItem(STORAGE_FIXTURES);
    if (rawFixtures) {
      const fixtures: MatchFixture[] = JSON.parse(rawFixtures);
      let fixtureUpdated = false;
      fixtures.forEach(f => {
        if (f.player1.id === updatedUser.id) {
          f.player1.name = updatedUser.name;
          f.player1.avatarUrl = updatedUser.avatarUrl;
          f.player1.efootballId = updatedUser.efootballId;
          fixtureUpdated = true;
        }
        if (f.player2.id === updatedUser.id) {
          f.player2.name = updatedUser.name;
          f.player2.avatarUrl = updatedUser.avatarUrl;
          f.player2.efootballId = updatedUser.efootballId;
          fixtureUpdated = true;
        }
      });
      if (fixtureUpdated) {
        localStorage.setItem(STORAGE_FIXTURES, JSON.stringify(fixtures));
      }
    }
  } catch (e) {}

  // Sync to Firestore
  syncUserToFirestore(updatedUser).catch(() => {});

  return updatedUser;
}

export function getTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_TOURNAMENTS);
    if (raw) {
      const parsed: Tournament[] = JSON.parse(raw);
      // Filter out demo tournaments & upgrade legacy banners
      const cleaned = parsed
        .filter(t => !['tour_01', 'tour_02', 'tour_03'].includes(t.id))
        .map(t => ({
          ...t,
          bannerUrl: (!t.bannerUrl || t.bannerUrl.includes('unsplash.com')) ? './images/banner-stadium.svg' : t.bannerUrl
        }));
      localStorage.setItem(STORAGE_TOURNAMENTS, JSON.stringify(cleaned));
      return cleaned;
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_TOURNAMENTS, JSON.stringify([]));
  return [];
}

export function saveTournaments(tournaments: Tournament[]): void {
  localStorage.setItem(STORAGE_TOURNAMENTS, JSON.stringify(tournaments));
}

export function getFixtures(): MatchFixture[] {
  try {
    const raw = localStorage.getItem(STORAGE_FIXTURES);
    if (raw) {
      const parsed: MatchFixture[] = JSON.parse(raw);
      // Filter out demo fixtures & clean avatars
      const cleaned = parsed
        .filter(f => !f.id.startsWith('fix_10') && !f.id.startsWith('fix_20') && !f.id.startsWith('fix_30'))
        .map(f => ({
          ...f,
          player1: {
            ...f.player1,
            avatarUrl: (!f.player1.avatarUrl || f.player1.avatarUrl.includes('unsplash.com')) ? './images/avatar-admin.svg' : f.player1.avatarUrl
          },
          player2: {
            ...f.player2,
            avatarUrl: (!f.player2.avatarUrl || f.player2.avatarUrl.includes('unsplash.com')) ? './images/avatar-player.svg' : f.player2.avatarUrl
          }
        }));
      localStorage.setItem(STORAGE_FIXTURES, JSON.stringify(cleaned));
      return cleaned;
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_FIXTURES, JSON.stringify([]));
  return [];
}

export function saveFixtures(fixtures: MatchFixture[]): void {
  localStorage.setItem(STORAGE_FIXTURES, JSON.stringify(fixtures));
}

/**
 * Real-time subscription to Tournaments across all devices via Firestore
 */
export function subscribeToTournaments(callback: (tournaments: Tournament[]) => void): () => void {
  // 1. Immediately emit local/cached tournaments for instant response
  const initial = getTournaments();
  callback(initial);

  // 2. Real-time Firestore snapshot listener
  try {
    const colRef = collection(db, 'tournaments');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: Tournament[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Tournament;
          if (data && data.id && !['tour_01', 'tour_02', 'tour_03'].includes(data.id)) {
            cloudList.push({
              ...data,
              bannerUrl: (!data.bannerUrl || data.bannerUrl.includes('unsplash.com')) ? './images/banner-stadium.svg' : data.bannerUrl
            });
          }
        });
        // Sort newest tournaments first
        cloudList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        saveTournaments(cloudList);
        callback(cloudList);
      },
      (error) => {
        console.warn('Tournaments snapshot listener:', error);
        callback(getTournaments());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed subscribing to tournaments:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to Fixtures across all devices via Firestore
 */
export function subscribeToFixtures(callback: (fixtures: MatchFixture[]) => void): () => void {
  const initial = getFixtures();
  callback(initial);

  try {
    const colRef = collection(db, 'fixtures');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: MatchFixture[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MatchFixture;
          if (data && data.id && !data.id.startsWith('fix_10') && !data.id.startsWith('fix_20')) {
            cloudList.push(data);
          }
        });
        saveFixtures(cloudList);
        callback(cloudList);
      },
      (error) => {
        console.warn('Fixtures snapshot listener:', error);
        callback(getFixtures());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed subscribing to fixtures:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to Users across all devices via Firestore
 */
export function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  const initial = getUsers();
  callback(initial);

  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudList: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as UserProfile;
            if (data && data.id) {
              cloudList.push(data);
            }
          });
          // Ensure admin is in the list
          if (!cloudList.some(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
            cloudList.push(OFFICIAL_ADMIN_PROFILE);
          }
          saveUsers(cloudList);
          callback(cloudList);
        }
      },
      (error) => {
        console.warn('Users snapshot listener:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

/**
 * Register a new user with eFootball In-Game ID
 */
export function registerUser(data: {
  name: string;
  email: string;
  efootballId: string;
  password?: string;
  favoriteClub?: string;
  role?: 'player' | 'admin';
}): UserProfile {
  const users = getUsers();
  const trimmedId = data.efootballId.trim();

  // 1. Enforce unique eFootball In-Game ID
  const duplicateId = users.find(
    u => u.efootballId && u.efootballId.trim().toLowerCase() === trimmedId.toLowerCase()
  );
  if (duplicateId) {
    throw new Error(`eFootball In-Game ID "${trimmedId}" is already taken by player "${duplicateId.name}". Every player must have a unique ID! (এই eFootball In-Game ID টি অন্য একজন খেলোয়াড় ইতিমধ্যে ব্যবহার করছেন। সবার আইডি আলাদা হতে হবে।)`);
  }

  // 2. Check unique email
  const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    throw new Error('User with this email already exists.');
  }

  const isMasterAdmin = data.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (isMasterAdmin) {
    throw new Error('The admin account is already registered. Please use the LOGIN tab with your admin password.');
  }

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: data.name,
    email: data.email,
    efootballId: trimmedId,
    avatarUrl: './images/avatar-player.svg',
    role: 'player',
    favoriteClub: data.favoriteClub || 'FC Barcelona',
    password: data.password ? data.password.trim() : undefined,
    lastEfootballIdChangedAt: new Date().toISOString(),
    rating: 1500,
    division: 'Division 3',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  setCurrentUser(newUser);
  syncUserToFirestore(newUser).catch(() => {});
  return newUser;
}

/**
 * Login user
 */
export function loginUser(email: string): UserProfile {
  const users = getUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    throw new Error('User not found. Please register first.');
  }
  setCurrentUser(found);
  return found;
}

/**
 * Join Tournament and send real-time notification to Telegram
 */
export async function joinTournament(
  tournamentId: string, 
  user: UserProfile,
  customDetails?: {
    name?: string;
    efootballId?: string;
    email?: string;
    phone?: string;
    favoriteClub?: string;
    division?: string;
  }
): Promise<{ tournament: Tournament; telegramResult: any }> {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  const tour = tournaments[index];
  if (tour.registeredPlayerIds.includes(user.id)) {
    throw new Error('You are already registered in this tournament.');
  }
  if (tour.registeredPlayerIds.length >= tour.maxPlayers) {
    throw new Error('This tournament is already full!');
  }

  // If user updated their details when joining, sync to profile & persistence
  if (customDetails) {
    const updatedUser: UserProfile = {
      ...user,
      name: customDetails.name || user.name,
      efootballId: customDetails.efootballId || user.efootballId,
      email: customDetails.email || user.email,
      favoriteClub: customDetails.favoriteClub || user.favoriteClub,
      division: customDetails.division || user.division
    };
    setCurrentUser(updatedUser);
    user = updatedUser;
  }

  tour.registeredPlayerIds.push(user.id);
  tournaments[index] = { ...tour };
  saveTournaments(tournaments);
  syncTournamentToFirestore(tour).catch(() => {});

  // Send real-time notification to Telegram channel with ALL player & tournament details
  let telegramResult: any = null;
  try {
    telegramResult = await sendTelegramNotification({
      event: 'player_joined_tournament',
      tournament_title: tour.title,
      player_name: user.name,
      efootball_id: user.efootballId,
      player_email: user.email,
      phone: customDetails?.phone,
      favorite_club: user.favoriteClub,
      division: user.division,
      current_players: tour.registeredPlayerIds.length,
      max_players: tour.maxPlayers,
      entry_fee: (tour as any).entryFee || 0,
      prize_pool: tour.prizePool,
      joined_at: new Date().toLocaleString()
    });
  } catch (err: any) {
    console.warn('Failed dispatching player join notification to Telegram:', err);
    telegramResult = { success: false, message: err?.message || 'Telegram dispatch error' };
  }

  return { tournament: tour, telegramResult };
}

/**
 * Leave Tournament (Allows players or test users to unregister)
 */
export function leaveTournament(tournamentId: string, userId: string): Tournament {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  const tour = tournaments[index];
  tour.registeredPlayerIds = tour.registeredPlayerIds.filter(id => id !== userId);
  tournaments[index] = { ...tour };
  saveTournaments(tournaments);
  syncTournamentToFirestore(tour).catch(() => {});
  return tour;
}

/**
 * Save Users Helper
 */
export function saveUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

/**
 * Update Tournament Banner Image
 */
export function updateTournamentBanner(tournamentId: string, bannerUrl: string): Tournament {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  tournaments[index] = {
    ...tournaments[index],
    bannerUrl
  };
  saveTournaments(tournaments);
  syncTournamentToFirestore(tournaments[index]).catch(() => {});
  return tournaments[index];
}

/**
 * Update Tournament - Allows Admin to customize entryFee, title, description, format, status, maxPlayers, prizePool, rules, startDate, bannerUrl
 */
export function updateTournament(tournamentId: string, updates: Partial<Tournament>): Tournament {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  const current = tournaments[index];
  const updated: Tournament = {
    ...current,
    ...updates,
    entryFee: updates.entryFee !== undefined ? Number(updates.entryFee) : current.entryFee,
    maxPlayers: updates.maxPlayers !== undefined ? Number(updates.maxPlayers) : current.maxPlayers,
    rules: {
      ...current.rules,
      ...(updates.rules || {})
    }
  };

  tournaments[index] = updated;
  saveTournaments(tournaments);
  syncTournamentToFirestore(updated).catch(() => {});
  return updated;
}

/**
 * Delete Tournament and associated fixtures
 */
export async function deleteTournament(tournamentId: string): Promise<boolean> {
  // 1. Delete from local state immediately
  const tournaments = getTournaments();
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  saveTournaments(filtered);

  // 2. Delete associated fixtures from local state
  const fixtures = getFixtures();
  const deletedFixtures = fixtures.filter(f => f.tournamentId === tournamentId);
  const remainingFixtures = fixtures.filter(f => f.tournamentId !== tournamentId);
  saveFixtures(remainingFixtures);

  // 3. Delete from Firestore permanently
  try {
    await deleteTournamentFromFirestore(tournamentId);
    for (const fix of deletedFixtures) {
      await deleteFixtureFromFirestore(fix.id).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to delete tournament in cloud:', err);
  }

  return true;
}

/**
 * Admin manual score override / result adjudication
 */
export function adminOverrideMatchResult(
  fixtureId: string, 
  player1Score: number, 
  player2Score: number, 
  winnerId?: string,
  notes?: string
): MatchFixture {
  const fixtures = getFixtures();
  const index = fixtures.findIndex(f => f.id === fixtureId);
  if (index === -1) throw new Error('Match fixture not found');

  const fix = fixtures[index];
  const updatedFixture: MatchFixture = {
    ...fix,
    status: 'approved',
    result: {
      player1Score: Number(player1Score),
      player2Score: Number(player2Score),
      submittedBy: 'admin',
      submittedByName: 'Tournament Administrator',
      screenshotUrl: fix.result?.screenshotUrl || './images/match-proof-verified.svg',
      submittedAt: new Date().toISOString(),
      notes: notes || 'Score decided by Tournament Administrator',
      adminVerdict: {
        approvedBy: 'Administrator (Manual Override)',
        verifiedAt: new Date().toISOString()
      }
    }
  };

  fixtures[index] = updatedFixture;
  saveFixtures(fixtures);
  syncFixtureToFirestore(updatedFixture).catch(() => {});
  return updatedFixture;
}

/**
 * Admin User Management: update user details
 */
export function adminUpdateUser(userId: string, updates: Partial<UserProfile>): UserProfile {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('User not found');

  const updated: UserProfile = {
    ...users[index],
    ...updates
  };
  users[index] = updated;
  saveUsers(users);
  syncUserToFirestore(updated).catch(() => {});
  return updated;
}

/**
 * Admin User Management: delete user
 */
export function adminDeleteUser(userId: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveUsers(filtered);
  return true;
}

/**
 * Conclude and finalize tournament, determine champion, and archive into history
 */
export function concludeTournament(tournamentId: string): Tournament {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  const standings = calculateLeaderboard(tournamentId);
  const winner = standings[0];

  tournaments[index] = {
    ...tournaments[index],
    status: 'completed',
    winnerId: winner?.playerId || undefined,
    winnerName: winner?.playerName || undefined
  };

  saveTournaments(tournaments);
  syncTournamentToFirestore(tournaments[index]).catch(() => {});
  return tournaments[index];
}

/**
 * Create a new Tournament and trigger Telegram webhook
 */
export async function createTournament(data: {
  title: string;
  description: string;
  format: 'knockout' | 'league';
  maxPlayers: number;
  prizePool: string;
  rules: TournamentRules;
  bannerUrl?: string;
  entryFee?: number;
  autoGenerateFixtures?: boolean;
}): Promise<Tournament> {
  const tournaments = getTournaments();

  const newTour: Tournament = {
    id: `tour_${Date.now()}`,
    title: data.title,
    description: data.description,
    format: data.format,
    status: 'upcoming',
    maxPlayers: Number(data.maxPlayers),
    registeredPlayerIds: [], // Open for players to register
    prizePool: data.prizePool,
    entryFee: Number(data.entryFee) || 0,
    rules: data.rules,
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    bannerUrl: data.bannerUrl || './images/banner-stadium.svg',
    createdAt: new Date().toISOString()
  };

  tournaments.unshift(newTour);
  saveTournaments(tournaments);
  syncTournamentToFirestore(newTour).catch(() => {});

  // Trigger Telegram Notification for Tournament Creation
  try {
    await sendTelegramNotification({
      event: 'tournament_created',
      title: newTour.title,
      format: newTour.format,
      max_players: newTour.maxPlayers,
      prize_pool: newTour.prizePool,
      entry_fee: data.entryFee || 0,
      rules: `${newTour.rules.matchLength}, Extra Time: ${newTour.rules.extraTime ? 'ON' : 'OFF'}, PK: ${newTour.rules.penalties ? 'ON' : 'OFF'}`,
      app_url: window.location.href
    });
  } catch (err) {
    console.error('Failed dispatching tournament notification to Telegram', err);
  }

  return newTour;
}

/**
 * Admin helper to quickly register a player into a tournament for testing or manual management
 */
export function adminAddPlayerToTournament(
  tournamentId: string, 
  playerName?: string, 
  efootballId?: string
): Tournament {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournamentId);
  if (index === -1) throw new Error('Tournament not found');

  const tour = tournaments[index];
  const users = getUsers();

  const count = tour.registeredPlayerIds.length + 1;
  const customId = `player_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const name = playerName || `Challenger #${count}`;
  const gameId = efootballId || `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const CLUBS = ['Manchester City', 'Real Madrid', 'FC Barcelona', 'Arsenal', 'Bayern Munich', 'Inter Milan', 'Liverpool'];
  const newPlayer: UserProfile = {
    id: customId,
    name,
    email: `player_${customId.slice(-6)}@efootball.com`,
    efootballId: gameId,
    avatarUrl: './images/avatar-player.svg',
    role: 'player',
    favoriteClub: CLUBS[Math.floor(Math.random() * CLUBS.length)],
    rating: 1200 + Math.floor(Math.random() * 350),
    division: `Division ${Math.floor(1 + Math.random() * 4)}`,
    createdAt: new Date().toISOString()
  };

  users.push(newPlayer);
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  syncUserToFirestore(newPlayer).catch(() => {});

  tour.registeredPlayerIds.push(newPlayer.id);
  tournaments[index] = { ...tour };
  saveTournaments(tournaments);
  syncTournamentToFirestore(tour).catch(() => {});

  return tour;
}

/**
 * Generate Fixture Pairings for a Tournament
 */
export function generateFixturesForTournament(tournamentId: string): MatchFixture[] {
  const tournaments = getTournaments();
  const tour = tournaments.find(t => t.id === tournamentId);
  if (!tour) throw new Error('Tournament not found');

  const allUsers = getUsers();
  // Safe mapping of players, ensuring no registered ID is dropped if localStorage had desync
  const registeredUsers = tour.registeredPlayerIds
    .map(id => {
      const found = allUsers.find(u => u.id === id);
      if (found) return found;
      return {
        id,
        name: `Player ${id.slice(-4)}`,
        efootballId: `ID_${id.slice(-6)}`,
        avatarUrl: './images/avatar-player.svg',
        role: 'player' as const,
        favoriteClub: 'eFootball FC',
        rating: 1200,
        division: 'Division 3',
        createdAt: new Date().toISOString()
      };
    })
    .filter((u): u is UserProfile => Boolean(u));

  if (registeredUsers.length < 2) {
    throw new Error(`Tournament "${tour.title}" requires at least 2 registered players to generate fixtures (Currently registered: ${registeredUsers.length}).`);
  }

  // Shuffle players
  const shuffled = [...registeredUsers].sort(() => Math.random() - 0.5);
  const newFixtures: MatchFixture[] = [];

  if (tour.format === 'knockout') {
    // Generate Round 1 pairings
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const matchNum = Math.floor(i / 2) + 1;
      const roundLabel = shuffled.length <= 4 ? `Semi-Final ${matchNum}` : `Match ${matchNum}`;
      newFixtures.push({
        id: `fix_${Date.now()}_${i}`,
        tournamentId: tour.id,
        round: roundLabel,
        player1: {
          id: shuffled[i].id,
          name: shuffled[i].name,
          efootballId: shuffled[i].efootballId,
          avatarUrl: shuffled[i].avatarUrl,
          favoriteClub: shuffled[i].favoriteClub
        },
        player2: {
          id: shuffled[i + 1].id,
          name: shuffled[i + 1].name,
          efootballId: shuffled[i + 1].efootballId,
          avatarUrl: shuffled[i + 1].avatarUrl,
          favoriteClub: shuffled[i + 1].favoriteClub
        },
        scheduledTime: new Date(Date.now() + 3600000 * (matchNum + 1)).toISOString().slice(0, 16).replace('T', ' '),
        status: 'pending'
      });
    }
  } else {
    // League round-robin: pair all
    let count = 1;
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        newFixtures.push({
          id: `fix_${Date.now()}_${i}_${j}`,
          tournamentId: tour.id,
          round: `Matchday ${count}`,
          player1: {
            id: shuffled[i].id,
            name: shuffled[i].name,
            efootballId: shuffled[i].efootballId,
            avatarUrl: shuffled[i].avatarUrl,
            favoriteClub: shuffled[i].favoriteClub
          },
          player2: {
            id: shuffled[j].id,
            name: shuffled[j].name,
            efootballId: shuffled[j].efootballId,
            avatarUrl: shuffled[j].avatarUrl,
            favoriteClub: shuffled[j].favoriteClub
          },
          scheduledTime: new Date(Date.now() + 3600000 * count).toISOString().slice(0, 16).replace('T', ' '),
          status: 'pending'
        });
        count++;
      }
    }
  }

  // Update status to ongoing
  tour.status = 'ongoing';
  saveTournaments(tournaments);

  // Save new fixtures
  const existingFixtures = getFixtures().filter(f => f.tournamentId !== tournamentId);
  const updatedFixtures = [...existingFixtures, ...newFixtures];
  saveFixtures(updatedFixtures);

  // Automatically trigger Telegram broadcast for newly generated fixtures
  broadcastFixturesToTelegram(tournamentId).catch(err => {
    console.warn('Auto Telegram broadcast for fixtures failed:', err);
  });

  return newFixtures;
}

/**
 * Broadcast entire tournament fixtures to Telegram channel (@eFootballTournamentBD)
 */
export async function broadcastFixturesToTelegram(
  tournamentId: string
): Promise<{ success: boolean; message: string; telegramResult: any }> {
  const tournaments = getTournaments();
  const tour = tournaments.find(t => t.id === tournamentId);
  if (!tour) throw new Error('Tournament not found');

  const fixtures = getFixtures().filter(f => f.tournamentId === tournamentId);
  if (fixtures.length === 0) {
    throw new Error('No fixtures found for this tournament. Please generate fixtures first.');
  }

  const payload = {
    event: 'fixtures_published' as const,
    tournament_title: tour.title,
    format: tour.format,
    fixtures: fixtures.map(f => ({
      round: f.round,
      player1_name: f.player1.name,
      player1_efootball_id: f.player1.efootballId,
      player1_club: f.player1.favoriteClub,
      player2_name: f.player2.name,
      player2_efootball_id: f.player2.efootballId,
      player2_club: f.player2.favoriteClub,
      scheduled_time: f.scheduledTime
    }))
  };

  try {
    const telegramResult = await sendTelegramNotification(payload);
    return {
      success: telegramResult.success,
      message: telegramResult.message,
      telegramResult
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to dispatch to Telegram',
      telegramResult: null
    };
  }
}

/**
 * Broadcast a single match fixture to Telegram channel (@eFootballTournamentBD)
 */
export async function broadcastSingleFixtureToTelegram(
  fixtureId: string
): Promise<{ success: boolean; message: string; telegramResult: any }> {
  const fixtures = getFixtures();
  const fixture = fixtures.find(f => f.id === fixtureId);
  if (!fixture) throw new Error('Fixture not found');

  const tournaments = getTournaments();
  const tour = tournaments.find(t => t.id === fixture.tournamentId);

  const payload = {
    event: 'single_fixture_announced' as const,
    tournament_title: tour?.title || 'eFootball Tournament',
    round: fixture.round,
    player1_name: fixture.player1.name,
    player1_efootball_id: fixture.player1.efootballId,
    player1_club: fixture.player1.favoriteClub,
    player2_name: fixture.player2.name,
    player2_efootball_id: fixture.player2.efootballId,
    player2_club: fixture.player2.favoriteClub,
    scheduled_time: fixture.scheduledTime
  };

  try {
    const telegramResult = await sendTelegramNotification(payload);
    return {
      success: telegramResult.success,
      message: telegramResult.message,
      telegramResult
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to dispatch to Telegram',
      telegramResult: null
    };
  }
}

/**
 * Submit Match Result with Screenshot proof
 */
export async function submitMatchResult(
  fixtureId: string,
  submission: {
    player1Score: number;
    player2Score: number;
    screenshotUrlOrBase64: string;
    notes?: string;
  }
): Promise<MatchFixture> {
  const fixtures = getFixtures();
  const index = fixtures.findIndex(f => f.id === fixtureId);
  if (index === -1) throw new Error('Fixture not found');

  const fixture = fixtures[index];
  const currentUser = getCurrentUser();

  // Upload screenshot to Firebase Storage if provided (100% Optional)
  let finalScreenshotUrl = '';
  if (submission.screenshotUrlOrBase64 && submission.screenshotUrlOrBase64.trim()) {
    try {
      finalScreenshotUrl = await uploadMatchScreenshot(
        submission.screenshotUrlOrBase64,
        fixture.id,
        currentUser.id
      );
    } catch (uploadErr) {
      console.warn('Screenshot upload fallback, saving as local/base64 URL:', uploadErr);
      finalScreenshotUrl = submission.screenshotUrlOrBase64;
    }
  }

  const resultData: MatchResult = {
    player1Score: Number(submission.player1Score),
    player2Score: Number(submission.player2Score),
    submittedBy: currentUser.id,
    submittedByName: currentUser.name,
    screenshotUrl: finalScreenshotUrl,
    submittedAt: new Date().toISOString(),
    notes: submission.notes
  };

  fixture.result = resultData;
  fixture.status = 'submitted'; // Awaiting Admin Approval
  fixtures[index] = { ...fixture };
  saveFixtures(fixtures);
  syncFixtureToFirestore(fixture).catch(() => {});

  return fixture;
}

/**
 * Admin: Approve Result
 * Updates status to 'approved', recalculates leaderboard, and triggers Telegram notification!
 */
export async function approveMatchResult(
  fixtureId: string,
  adminName: string
): Promise<{ fixture: MatchFixture; telegramResult?: any }> {
  const fixtures = getFixtures();
  const index = fixtures.findIndex(f => f.id === fixtureId);
  if (index === -1) throw new Error('Fixture not found');

  const fixture = fixtures[index];
  if (!fixture.result) throw new Error('No result submitted for this fixture');

  fixture.status = 'approved';
  fixture.result.adminVerdict = {
    approvedBy: adminName,
    verifiedAt: new Date().toISOString()
  };

  fixtures[index] = { ...fixture };
  saveFixtures(fixtures);
  syncFixtureToFirestore(fixture).catch(() => {});

  // Get tournament info
  const tournaments = getTournaments();
  const tour = tournaments.find(t => t.id === fixture.tournamentId);

  // Trigger Telegram Webhook Notification!
  let telegramResult;
  try {
    telegramResult = await sendTelegramNotification({
      event: 'match_result_approved',
      tournament_name: tour?.title || 'eFootball Championship',
      round: fixture.round,
      player1_name: fixture.player1.name,
      player1_efootball_id: fixture.player1.efootballId,
      score1: fixture.result.player1Score,
      score2: fixture.result.player2Score,
      player2_name: fixture.player2.name,
      player2_efootball_id: fixture.player2.efootballId,
      approved_by: adminName,
      screenshot_url: fixture.result.screenshotUrl
    });
  } catch (err) {
    console.error('Failed dispatching to Telegram webhook:', err);
  }

  return { fixture, telegramResult };
}

/**
 * Admin: Reject Result
 */
export function rejectMatchResult(
  fixtureId: string,
  adminName: string,
  rejectionReason: string
): MatchFixture {
  const fixtures = getFixtures();
  const index = fixtures.findIndex(f => f.id === fixtureId);
  if (index === -1) throw new Error('Fixture not found');

  const fixture = fixtures[index];
  if (!fixture.result) throw new Error('No result submitted for this fixture');

  fixture.status = 'rejected';
  fixture.result.adminVerdict = {
    approvedBy: adminName,
    verifiedAt: new Date().toISOString(),
    rejectionReason: rejectionReason || 'Screenshot unclear or scores do not match in-game result screen.'
  };

  fixtures[index] = { ...fixture };
  saveFixtures(fixtures);
  return fixture;
}

/**
 * Calculate Leaderboard / Points Table
 * Standard: Win = 3 pts, Draw = 1 pt, Loss = 0 pts
 * Sorted by Points DESC, then Goal Difference DESC, then Goals For DESC
 */
export function calculateLeaderboard(tournamentId?: string): LeaderboardEntry[] {
  const allUsers = getUsers();
  const tournaments = getTournaments();
  const currentTour = tournamentId ? tournaments.find(t => t.id === tournamentId) : null;
  
  const fixtures = getFixtures().filter(f => {
    if (tournamentId) return f.tournamentId === tournamentId;
    return true;
  });

  const statsMap: Record<string, LeaderboardEntry> = {};

  // Initialize participants
  const participants = currentTour 
    ? allUsers.filter(u => currentTour.registeredPlayerIds.includes(u.id))
    : allUsers.filter(u => u.role === 'player' || fixtures.some(f => f.player1.id === u.id || f.player2.id === u.id));

  participants.forEach(u => {
    statsMap[u.id] = {
      playerId: u.id,
      playerName: u.name,
      efootballId: u.efootballId,
      avatarUrl: u.avatarUrl,
      favoriteClub: u.favoriteClub,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      form: []
    };
  });

  // Calculate only from approved fixtures
  const approvedMatches = fixtures.filter(f => f.status === 'approved' && f.result);

  approvedMatches.forEach(f => {
    const res = f.result!;
    const p1Id = f.player1.id;
    const p2Id = f.player2.id;

    if (!statsMap[p1Id]) {
      statsMap[p1Id] = {
        playerId: p1Id,
        playerName: f.player1.name,
        efootballId: f.player1.efootballId,
        avatarUrl: f.player1.avatarUrl,
        favoriteClub: f.player1.favoriteClub,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, form: []
      };
    }

    if (!statsMap[p2Id]) {
      statsMap[p2Id] = {
        playerId: p2Id,
        playerName: f.player2.name,
        efootballId: f.player2.efootballId,
        avatarUrl: f.player2.avatarUrl,
        favoriteClub: f.player2.favoriteClub,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, form: []
      };
    }

    const p1 = statsMap[p1Id];
    const p2 = statsMap[p2Id];

    p1.played += 1;
    p2.played += 1;

    p1.goalsFor += res.player1Score;
    p1.goalsAgainst += res.player2Score;

    p2.goalsFor += res.player2Score;
    p2.goalsAgainst += res.player1Score;

    if (res.player1Score > res.player2Score) {
      // P1 Win
      p1.won += 1;
      p1.points += 3;
      p1.form.push('W');

      p2.lost += 1;
      p2.points += 0;
      p2.form.push('L');
    } else if (res.player2Score > res.player1Score) {
      // P2 Win
      p2.won += 1;
      p2.points += 3;
      p2.form.push('W');

      p1.lost += 1;
      p1.points += 0;
      p1.form.push('L');
    } else {
      // Draw
      p1.drawn += 1;
      p1.points += 1;
      p1.form.push('D');

      p2.drawn += 1;
      p2.points += 1;
      p2.form.push('D');
    }
  });

  // Calculate Goal Difference and format array
  const table = Object.values(statsMap).map(entry => ({
    ...entry,
    goalDiff: entry.goalsFor - entry.goalsAgainst,
    form: entry.form.slice(-5) // Last 5 matches form
  }));

  // Sort strictly by Points DESC, then GD DESC, then Goals For DESC, then Wins DESC
  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.won - a.won;
  });

  return table;
}

/**
 * Reset all data to clean initial state
 */
export function resetToSeedData() {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(SEED_PLAYERS));
  localStorage.setItem(STORAGE_TOURNAMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_FIXTURES, JSON.stringify([]));
  localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(SEED_PLAYERS[0]));
}
