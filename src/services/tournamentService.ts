import { 
  Tournament, 
  MatchFixture, 
  UserProfile, 
  LeaderboardEntry, 
  MatchResult,
  TournamentRules 
} from '../types/tournament';
import { SEED_PLAYERS, SEED_TOURNAMENTS, SEED_FIXTURES } from './mockData';
import { sendTelegramNotification } from './telegramService';
import { 
  uploadMatchScreenshot, 
  syncTournamentToFirestore, 
  syncFixtureToFirestore, 
  syncUserToFirestore 
} from './firebase';

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
      if (parsed && parsed.id && parsed.name && parsed.efootballId) {
        return parsed;
      }
    }
  } catch (e) {}
  const defaultUser = SEED_PLAYERS[0];
  try {
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
    localStorage.setItem(STORAGE_PERMANENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(user));
    // Remember eFootball ID specifically for this email
    if (user.email && user.efootballId) {
      localStorage.setItem(`efootball_saved_id_${user.email.toLowerCase()}`, user.efootballId);
    }
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
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
  const existing = users.find(u => u.email.toLowerCase() === authEmail.toLowerCase());
  if (existing) {
    if (preferredEfootballId && preferredEfootballId !== existing.efootballId) {
      existing.efootballId = preferredEfootballId;
    }
    setCurrentUser(existing);
    return existing;
  }

  const rememberedId = preferredEfootballId || 
    localStorage.getItem(`efootball_saved_id_${authEmail.toLowerCase()}`) || 
    `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: displayName || authEmail.split('@')[0],
    email: authEmail,
    efootballId: rememberedId,
    avatarUrl: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName || authEmail)}`,
    role: authEmail.toLowerCase() === 'rfrifatbs@gmail.com' ? 'admin' : 'player',
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

export function getTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_TOURNAMENTS);
    if (raw) {
      const parsed: Tournament[] = JSON.parse(raw);
      // Filter out demo tournaments
      const cleaned = parsed.filter(t => !['tour_01', 'tour_02', 'tour_03'].includes(t.id));
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
      // Filter out demo fixtures
      const cleaned = parsed.filter(f => !f.id.startsWith('fix_10') && !f.id.startsWith('fix_20') && !f.id.startsWith('fix_30'));
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
 * Register a new user with eFootball In-Game ID
 */
export function registerUser(data: {
  name: string;
  email: string;
  efootballId: string;
  favoriteClub?: string;
  role?: 'player' | 'admin';
}): UserProfile {
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    throw new Error('User with this email already exists.');
  }

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: data.name,
    email: data.email,
    efootballId: data.efootballId.trim(),
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
    role: data.role || 'player',
    favoriteClub: data.favoriteClub || 'FC Barcelona',
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
 * Join Tournament
 */
export function joinTournament(tournamentId: string, user: UserProfile): Tournament {
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

  tour.registeredPlayerIds.push(user.id);
  tournaments[index] = { ...tour };
  saveTournaments(tournaments);
  syncTournamentToFirestore(tour).catch(() => {});

  // Send real-time notification to Telegram channel with player & tournament details
  sendTelegramNotification({
    event: 'player_joined_tournament',
    tournament_title: tour.title,
    player_name: user.name,
    efootball_id: user.efootballId,
    player_email: user.email,
    favorite_club: user.favoriteClub,
    division: user.division,
    current_players: tour.registeredPlayerIds.length,
    max_players: tour.maxPlayers,
    entry_fee: (tour as any).entryFee || 0,
    prize_pool: tour.prizePool,
    joined_at: new Date().toLocaleString()
  }).catch((err) => {
    console.warn('Failed dispatching player join notification to Telegram:', err);
  });

  return tour;
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
  autoGenerateFixtures?: boolean;
}): Promise<Tournament> {
  const tournaments = getTournaments();
  const currentUser = getCurrentUser();

  const newTour: Tournament = {
    id: `tour_${Date.now()}`,
    title: data.title,
    description: data.description,
    format: data.format,
    status: 'upcoming',
    maxPlayers: Number(data.maxPlayers),
    registeredPlayerIds: [currentUser.id],
    prizePool: data.prizePool,
    rules: data.rules,
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
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
      rules: `${newTour.rules.matchLength}, Extra Time: ${newTour.rules.extraTime ? 'ON' : 'OFF'}, PK: ${newTour.rules.penalties ? 'ON' : 'OFF'}`,
      app_url: window.location.href
    });
  } catch (err) {
    console.error('Failed dispatching tournament notification to Telegram', err);
  }

  return newTour;
}

/**
 * Generate Fixture Pairings for a Tournament
 */
export function generateFixturesForTournament(tournamentId: string): MatchFixture[] {
  const tournaments = getTournaments();
  const tour = tournaments.find(t => t.id === tournamentId);
  if (!tour) throw new Error('Tournament not found');

  const allUsers = getUsers();
  const registeredUsers = tour.registeredPlayerIds
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is UserProfile => Boolean(u));

  if (registeredUsers.length < 2) {
    throw new Error('Need at least 2 registered players to generate fixtures.');
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

  return newFixtures;
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

  // Upload screenshot to Firebase Storage or format
  const finalScreenshotUrl = await uploadMatchScreenshot(
    submission.screenshotUrlOrBase64,
    fixture.id,
    currentUser.id
  );

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
