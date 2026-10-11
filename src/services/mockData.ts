import { Tournament, MatchFixture, UserProfile } from '../types/tournament';

export const ADMIN_EMAIL = 'rfrifatbs@gmail.com';
export const ADMIN_PASSWORD = 'Rifat@11';

export function isUserAdmin(user?: UserProfile | null): boolean {
  if (!user) return false;
  return Boolean(
    user.email &&
    user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    user.role === 'admin'
  );
}

// Default guest player profile for all unauthenticated/normal users
export const DEFAULT_GUEST_PLAYER: UserProfile = {
  id: 'guest_player',
  name: 'Player',
  email: '',
  efootballId: 'PLAYER_7',
  avatarUrl: './images/avatar-player.svg',
  role: 'player',
  favoriteClub: 'FC Barcelona',
  rating: 1200,
  division: 'Division 3',
  createdAt: '2026-01-01'
};

// Official Admin profile (Accessible ONLY via login with rfrifatbs@gmail.com and password Rifat@11)
export const OFFICIAL_ADMIN_PROFILE: UserProfile = {
  id: 'user_admin_01',
  name: 'Mohammad Rifat (Admin)',
  email: 'rfrifatbs@gmail.com',
  efootballId: '6595302089',
  avatarUrl: './images/avatar-admin.svg',
  role: 'admin',
  favoriteClub: 'Real Madrid',
  rating: 1980,
  division: 'Division 1',
  createdAt: '2026-01-01'
};

export const SEED_PLAYERS: UserProfile[] = [
  DEFAULT_GUEST_PLAYER,
  OFFICIAL_ADMIN_PROFILE
];

// Empty tournaments (No demo tournaments)
export const SEED_TOURNAMENTS: Tournament[] = [];

// Empty fixtures (No demo fixtures)
export const SEED_FIXTURES: MatchFixture[] = [];

// Historical completed tournaments archive
export const HISTORICAL_COMPLETED_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour_hist_01',
    title: 'eFootball BD Super Cup - Season 1',
    description: 'The inaugural championship tournament of the eFootball Arena community, featuring top mobile contenders.',
    format: 'knockout',
    status: 'completed',
    maxPlayers: 8,
    registeredPlayerIds: ['user_admin_01', 'guest_player'],
    rules: {
      matchLength: '10 Mins',
      extraTime: true,
      penalties: true,
      playerCondition: 'Excellent',
      injuries: false,
      substitutions: 5
    },
    prizePool: '2,500 eFootball Coins + Champion Trophy',
    startDate: '2025-12-15',
    bannerUrl: './images/banner-trophy.svg',
    winnerId: 'user_admin_01',
    winnerName: 'Mohammad Rifat',
    createdAt: '2025-12-01'
  },
  {
    id: 'tour_hist_02',
    title: 'Winter Masters League 2025',
    description: 'Intense round-robin league stage where consistency and tactics determined the ultimate division champion.',
    format: 'league',
    status: 'completed',
    maxPlayers: 6,
    registeredPlayerIds: ['guest_player', 'user_admin_01'],
    rules: {
      matchLength: '10 Mins',
      extraTime: false,
      penalties: false,
      playerCondition: 'Random',
      injuries: true,
      substitutions: 5
    },
    prizePool: '1,500 eFootball Coins',
    startDate: '2025-11-20',
    bannerUrl: './images/banner-esports.svg',
    winnerId: 'guest_player',
    winnerName: 'Player',
    createdAt: '2025-11-10'
  }
];

// Historical completed match fixtures archive
export const HISTORICAL_COMPLETED_FIXTURES: MatchFixture[] = [
  {
    id: 'fix_hist_101',
    tournamentId: 'tour_hist_01',
    round: 'Grand Final',
    player1: {
      id: 'user_admin_01',
      name: 'Mohammad Rifat',
      efootballId: '6595302089',
      avatarUrl: './images/avatar-admin.svg',
      favoriteClub: 'Real Madrid'
    },
    player2: {
      id: 'guest_player',
      name: 'Player',
      efootballId: 'PLAYER_7',
      avatarUrl: './images/avatar-player.svg',
      favoriteClub: 'FC Barcelona'
    },
    scheduledTime: '2025-12-20 20:00',
    status: 'approved',
    result: {
      player1Score: 3,
      player2Score: 1,
      submittedBy: 'user_admin_01',
      submittedByName: 'Mohammad Rifat',
      screenshotUrl: './images/banner-stadium.svg',
      submittedAt: '2025-12-20T20:25:00.000Z',
      notes: 'Final whistle thrilling match, 3-1 victory to secure the championship.',
      adminVerdict: {
        approvedBy: 'Tournament Desk',
        verifiedAt: '2025-12-20T20:30:00.000Z'
      }
    }
  },
  {
    id: 'fix_hist_102',
    tournamentId: 'tour_hist_01',
    round: 'Semi-Finals',
    player1: {
      id: 'user_admin_01',
      name: 'Mohammad Rifat',
      efootballId: '6595302089',
      avatarUrl: './images/avatar-admin.svg',
      favoriteClub: 'Real Madrid'
    },
    player2: {
      id: 'guest_player_2',
      name: 'Striker King',
      efootballId: '882-941-201',
      avatarUrl: './images/avatar-player.svg',
      favoriteClub: 'Manchester City'
    },
    scheduledTime: '2025-12-18 19:00',
    status: 'approved',
    result: {
      player1Score: 2,
      player2Score: 0,
      submittedBy: 'user_admin_01',
      submittedByName: 'Mohammad Rifat',
      screenshotUrl: './images/banner-trophy.svg',
      submittedAt: '2025-12-18T19:20:00.000Z',
      notes: 'Clean sheet in the semi final match.',
      adminVerdict: {
        approvedBy: 'Tournament Desk',
        verifiedAt: '2025-12-18T19:25:00.000Z'
      }
    }
  },
  {
    id: 'fix_hist_201',
    tournamentId: 'tour_hist_02',
    round: 'Matchday 5',
    player1: {
      id: 'guest_player',
      name: 'Player',
      efootballId: 'PLAYER_7',
      avatarUrl: './images/avatar-player.svg',
      favoriteClub: 'FC Barcelona'
    },
    player2: {
      id: 'user_admin_01',
      name: 'Mohammad Rifat',
      efootballId: '6595302089',
      avatarUrl: './images/avatar-admin.svg',
      favoriteClub: 'Real Madrid'
    },
    scheduledTime: '2025-11-28 21:00',
    status: 'approved',
    result: {
      player1Score: 2,
      player2Score: 2,
      submittedBy: 'guest_player',
      submittedByName: 'Player',
      screenshotUrl: './images/banner-esports.svg',
      submittedAt: '2025-11-28T21:25:00.000Z',
      notes: 'Exciting El Clasico draw in the final matchday.',
      adminVerdict: {
        approvedBy: 'Tournament Desk',
        verifiedAt: '2025-11-28T21:30:00.000Z'
      }
    }
  }
];

// Fallback sample match screenshot for testing
export const SAMPLE_MATCH_SCREENSHOT = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070c18"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00ff87"/>
      <stop offset="100%" stop-color="#00e5ff"/>
    </linearGradient>
  </defs>
  <rect width="900" height="500" fill="url(#bg)"/>
  
  <!-- Header Bar -->
  <rect x="0" y="0" width="900" height="56" fill="#030814" stroke="#1e293b" stroke-width="1"/>
  <text x="30" y="36" fill="#00ff87" font-family="system-ui, sans-serif" font-size="18" font-weight="900" letter-spacing="2">eFOOTBALL™ FRIEND MATCH</text>
  <text x="870" y="36" fill="#94a3b8" font-family="monospace, sans-serif" font-size="14" text-anchor="end">MATCH COMPLETED (FT)</text>

  <!-- Score Board Card -->
  <rect x="40" y="80" width="820" height="150" rx="20" fill="#0a1324" stroke="#334155" stroke-width="2"/>
  
  <!-- Home Team -->
  <circle cx="130" cy="155" r="42" fill="#0f172a" stroke="#00ff87" stroke-width="3"/>
  <text x="130" y="162" fill="#00ff87" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">HOME</text>
  <text x="260" y="145" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="900">Mohammad Rifat</text>
  <text x="260" y="172" fill="#00ff87" font-family="monospace, sans-serif" font-size="13">ID: 6595302089 • FC Barcelona</text>

  <!-- Big Score -->
  <rect x="390" y="112" width="120" height="85" rx="14" fill="#030712" stroke="#00ff87" stroke-width="2"/>
  <text x="450" y="172" fill="#ffffff" font-family="monospace, sans-serif" font-size="52" font-weight="900" text-anchor="middle">3 - 1</text>

  <!-- Away Team -->
  <circle cx="770" cy="155" r="42" fill="#0f172a" stroke="#00e5ff" stroke-width="3"/>
  <text x="770" y="162" fill="#00e5ff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">AWAY</text>
  <text x="640" y="145" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="end">Challenger</text>
  <text x="640" y="172" fill="#00e5ff" font-family="monospace, sans-serif" font-size="13" text-anchor="end">ID: 4892019481 • Real Madrid</text>

  <!-- Match Statistics Table -->
  <rect x="40" y="250" width="820" height="210" rx="16" fill="#080f1c" stroke="#1e293b" stroke-width="1.5"/>
  <text x="450" y="280" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="2">MATCH STATISTICS</text>

  <!-- Stat 1: Possession -->
  <text x="140" y="320" fill="#00ff87" font-family="monospace, sans-serif" font-size="16" font-weight="bold">58%</text>
  <text x="450" y="320" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Possession</text>
  <text x="760" y="320" fill="#00e5ff" font-family="monospace, sans-serif" font-size="16" font-weight="bold" text-anchor="end">42%</text>
  <rect x="200" y="312" width="200" height="8" rx="4" fill="#00ff87"/>
  <rect x="500" y="312" width="200" height="8" rx="4" fill="#00e5ff"/>

  <!-- Stat 2: Shots -->
  <text x="140" y="360" fill="#00ff87" font-family="monospace, sans-serif" font-size="16" font-weight="bold">9 (7)</text>
  <text x="450" y="360" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Shots (On Target)</text>
  <text x="760" y="360" fill="#00e5ff" font-family="monospace, sans-serif" font-size="16" font-weight="bold" text-anchor="end">4 (2)</text>

  <!-- Stat 3: Pass Accuracy -->
  <text x="140" y="400" fill="#00ff87" font-family="monospace, sans-serif" font-size="16" font-weight="bold">86%</text>
  <text x="450" y="400" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Pass Accuracy</text>
  <text x="760" y="400" fill="#00e5ff" font-family="monospace, sans-serif" font-size="16" font-weight="bold" text-anchor="end">78%</text>

  <!-- Stamp -->
  <rect x="320" y="425" width="260" height="28" rx="6" fill="#00ff87" fill-opacity="0.2" stroke="#00ff87" stroke-width="1"/>
  <text x="450" y="444" fill="#00ff87" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle" letter-spacing="1">✓ OFFICIAL eFOOTBALL VERIFIED</text>
</svg>
`);

