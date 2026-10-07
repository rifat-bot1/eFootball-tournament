import { Tournament, MatchFixture, UserProfile } from '../types/tournament';

// Pre-seeded players
export const SEED_PLAYERS: UserProfile[] = [
  {
    id: 'user_admin_01',
    name: 'Mohammad Rifat (Admin)',
    email: 'rfrifatbs@gmail.com',
    efootballId: '659-530-208',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    favoriteClub: 'Real Madrid',
    rating: 1980,
    division: 'Division 1',
    createdAt: '2026-01-01'
  },
  {
    id: 'user_player_01',
    name: 'Kylian Striker',
    email: 'striker@efootball.com',
    efootballId: '982-412-104',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'Real Madrid',
    rating: 1890,
    division: 'Division 1',
    createdAt: '2026-02-10'
  },
  {
    id: 'user_player_02',
    name: 'Neymar Dribble',
    email: 'neymar@efootball.com',
    efootballId: '701-849-221',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'FC Barcelona',
    rating: 1845,
    division: 'Division 1',
    createdAt: '2026-02-12'
  },
  {
    id: 'user_player_03',
    name: 'Saka Precision',
    email: 'saka@efootball.com',
    efootballId: '314-559-012',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'Arsenal',
    rating: 1790,
    division: 'Division 1',
    createdAt: '2026-02-15'
  },
  {
    id: 'user_player_04',
    name: 'Haaland Finisher',
    email: 'haaland@efootball.com',
    efootballId: '822-194-673',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'Manchester City',
    rating: 1820,
    division: 'Division 1',
    createdAt: '2026-02-18'
  },
  {
    id: 'user_player_05',
    name: 'Pedri Maestro',
    email: 'pedri@efootball.com',
    efootballId: '455-890-112',
    avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'FC Barcelona',
    rating: 1765,
    division: 'Division 2',
    createdAt: '2026-02-20'
  },
  {
    id: 'user_player_06',
    name: 'Bellingham Box2Box',
    email: 'jude@efootball.com',
    efootballId: '611-304-988',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'Real Madrid',
    rating: 1805,
    division: 'Division 1',
    createdAt: '2026-02-22'
  },
  {
    id: 'user_player_07',
    name: 'Musiala Magician',
    email: 'musiala@efootball.com',
    efootballId: '903-128-445',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'Bayern Munich',
    rating: 1780,
    division: 'Division 2',
    createdAt: '2026-02-25'
  },
  {
    id: 'user_player_08',
    name: 'Yamal Prodigy',
    email: 'yamal@efootball.com',
    efootballId: '542-871-339',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    role: 'player',
    favoriteClub: 'FC Barcelona',
    rating: 1830,
    division: 'Division 1',
    createdAt: '2026-03-01'
  }
];

// High quality sample eFootball match screenshot (SVG data-uri)
export const SAMPLE_MATCH_SCREENSHOT = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1224"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00ff87"/>
      <stop offset="100%" stop-color="#00e5ff"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect x="20" y="20" width="760" height="410" rx="16" fill="#0f172a" stroke="#00ff87" stroke-width="2" opacity="0.9"/>
  <!-- Header Banner -->
  <rect x="20" y="20" width="760" height="60" rx="16" fill="#1e293b"/>
  <text x="400" y="58" fill="#00ff87" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">eFootball™ 2026 - FINAL MATCH STATS</text>
  
  <!-- Team 1 -->
  <circle cx="160" cy="180" r="50" fill="#1e3a8a" stroke="#60a5fa" stroke-width="4"/>
  <text x="160" y="190" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">RMA</text>
  <text x="160" y="260" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Kylian Striker</text>
  <text x="160" y="285" fill="#94a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">ID: 982-412-104</text>
  
  <!-- Score Display -->
  <rect x="300" y="140" width="200" height="80" rx="12" fill="#020617" stroke="#334155" stroke-width="2"/>
  <text x="400" y="198" fill="#00ff87" font-family="monospace" font-size="48" font-weight="bold" text-anchor="middle">3 - 1</text>
  <text x="400" y="245" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">FULL TIME (90 MIN)</text>
  
  <!-- Team 2 -->
  <circle cx="640" cy="180" r="50" fill="#831843" stroke="#f472b6" stroke-width="4"/>
  <text x="640" y="190" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">BAR</text>
  <text x="640" y="260" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Neymar Dribble</text>
  <text x="640" y="285" fill="#94a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">ID: 701-849-221</text>
  
  <!-- Stats Comparison -->
  <rect x="180" y="320" width="440" height="85" rx="8" fill="#1e293b" opacity="0.8"/>
  <text x="250" y="345" fill="#ffffff" font-size="14" font-family="sans-serif">12</text>
  <text x="400" y="345" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Shots</text>
  <text x="550" y="345" fill="#ffffff" font-size="14" font-family="sans-serif" text-anchor="end">7</text>
  
  <text x="250" y="370" fill="#ffffff" font-size="14" font-family="sans-serif">58%</text>
  <text x="400" y="370" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Possession</text>
  <text x="550" y="370" fill="#ffffff" font-size="14" font-family="sans-serif" text-anchor="end">42%</text>
  
  <text x="250" y="395" fill="#ffffff" font-size="14" font-family="sans-serif">89%</text>
  <text x="400" y="395" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">Pass Accuracy</text>
  <text x="550" y="395" fill="#ffffff" font-size="14" font-family="sans-serif" text-anchor="end">81%</text>
</svg>
`);

export const SEED_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour_01',
    title: 'eFootball 2026 Continental Mobile Cup',
    description: 'Premier regional tournament for mobile competitors. 8 elite players battling for glory, verified screenshots, and Telegram broadcast.',
    format: 'knockout',
    status: 'ongoing',
    maxPlayers: 8,
    registeredPlayerIds: [
      'user_player_01', 'user_player_02', 'user_player_03', 'user_player_04',
      'user_player_05', 'user_player_06', 'user_player_07', 'user_player_08'
    ],
    rules: {
      matchLength: '10 Mins',
      extraTime: false,
      penalties: true,
      playerCondition: 'Excellent',
      injuries: false,
      substitutions: 5
    },
    prizePool: '5,000 eFootball Coins + Verified Champion Role',
    startDate: '2026-10-10T18:00:00Z',
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    createdAt: '2026-10-01T12:00:00Z'
  },
  {
    id: 'tour_02',
    title: 'Neon Division 1 Premier League',
    description: 'Round-robin points tournament. Win = 3 pts, Draw = 1 pt. Play your scheduled matchdays and upload full-time screenshots.',
    format: 'league',
    status: 'ongoing',
    maxPlayers: 6,
    registeredPlayerIds: [
      'user_player_01', 'user_player_02', 'user_player_03',
      'user_player_04', 'user_player_05', 'user_player_06'
    ],
    rules: {
      matchLength: '10 Mins',
      extraTime: false,
      penalties: false,
      playerCondition: 'Random',
      injuries: true,
      substitutions: 5
    },
    prizePool: '2,500 eFootball Coins',
    startDate: '2026-10-15T20:00:00Z',
    bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
    createdAt: '2026-10-02T15:00:00Z'
  },
  {
    id: 'tour_03',
    title: 'Weekend Flash Knockout: Golden Goal',
    description: 'Fast-paced single elimination cup open for community registrations. Slots filling fast!',
    format: 'knockout',
    status: 'upcoming',
    maxPlayers: 16,
    registeredPlayerIds: [
      'user_player_01', 'user_player_03', 'user_player_05'
    ],
    rules: {
      matchLength: '8 Mins',
      extraTime: true,
      penalties: true,
      playerCondition: 'Excellent',
      injuries: false,
      substitutions: 5
    },
    prizePool: '1,000 eFootball Coins',
    startDate: '2026-10-20T17:00:00Z',
    bannerUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1000&q=80',
    createdAt: '2026-10-05T09:00:00Z'
  }
];

export const SEED_FIXTURES: MatchFixture[] = [
  // Tour 01 - Quarter Finals (Completed / Approved)
  {
    id: 'fix_101',
    tournamentId: 'tour_01',
    round: 'Quarter-Final 1',
    player1: {
      id: 'user_player_01',
      name: 'Kylian Striker',
      efootballId: '982-412-104',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Real Madrid'
    },
    player2: {
      id: 'user_player_02',
      name: 'Neymar Dribble',
      efootballId: '701-849-221',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'FC Barcelona'
    },
    scheduledTime: '2026-10-06 14:00',
    status: 'approved',
    result: {
      player1Score: 3,
      player2Score: 1,
      submittedBy: 'user_player_01',
      submittedByName: 'Kylian Striker',
      screenshotUrl: SAMPLE_MATCH_SCREENSHOT,
      submittedAt: '2026-10-06T14:35:00Z',
      notes: 'GG opponent, intense counter attacks in second half.',
      adminVerdict: {
        approvedBy: 'Coach Ferguson (Admin)',
        verifiedAt: '2026-10-06T14:40:00Z'
      }
    }
  },
  // Tour 01 - Quarter Finals (Submitted / Waiting Admin Review!)
  {
    id: 'fix_102',
    tournamentId: 'tour_01',
    round: 'Quarter-Final 2',
    player1: {
      id: 'user_player_03',
      name: 'Saka Precision',
      efootballId: '314-559-012',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Arsenal'
    },
    player2: {
      id: 'user_player_04',
      name: 'Haaland Finisher',
      efootballId: '822-194-673',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Manchester City'
    },
    scheduledTime: '2026-10-06 15:30',
    status: 'submitted',
    result: {
      player1Score: 2,
      player2Score: 2,
      submittedBy: 'user_player_03',
      submittedByName: 'Saka Precision',
      screenshotUrl: SAMPLE_MATCH_SCREENSHOT,
      submittedAt: '2026-10-06T15:55:00Z',
      notes: 'Penalty shootout won 4-3 by Saka Precision. Screenshot attached.'
    }
  },
  // Tour 01 - Quarter Finals (Pending Play)
  {
    id: 'fix_103',
    tournamentId: 'tour_01',
    round: 'Quarter-Final 3',
    player1: {
      id: 'user_player_05',
      name: 'Pedri Maestro',
      efootballId: '455-890-112',
      avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'FC Barcelona'
    },
    player2: {
      id: 'user_player_06',
      name: 'Bellingham Box2Box',
      efootballId: '611-304-988',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Real Madrid'
    },
    scheduledTime: '2026-10-06 18:00',
    status: 'pending'
  },
  // Tour 01 - Quarter Finals (Pending Play)
  {
    id: 'fix_104',
    tournamentId: 'tour_01',
    round: 'Quarter-Final 4',
    player1: {
      id: 'user_player_07',
      name: 'Musiala Magician',
      efootballId: '903-128-445',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Bayern Munich'
    },
    player2: {
      id: 'user_player_08',
      name: 'Yamal Prodigy',
      efootballId: '542-871-339',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'FC Barcelona'
    },
    scheduledTime: '2026-10-06 19:30',
    status: 'pending'
  },
  // Tour 02 - League Fixtures
  {
    id: 'fix_201',
    tournamentId: 'tour_02',
    round: 'Matchday 1',
    player1: {
      id: 'user_player_01',
      name: 'Kylian Striker',
      efootballId: '982-412-104',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Real Madrid'
    },
    player2: {
      id: 'user_player_03',
      name: 'Saka Precision',
      efootballId: '314-559-012',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Arsenal'
    },
    scheduledTime: '2026-10-05 20:00',
    status: 'approved',
    result: {
      player1Score: 4,
      player2Score: 2,
      submittedBy: 'user_player_01',
      submittedByName: 'Kylian Striker',
      screenshotUrl: SAMPLE_MATCH_SCREENSHOT,
      submittedAt: '2026-10-05T20:30:00Z',
      adminVerdict: {
        approvedBy: 'Coach Ferguson (Admin)',
        verifiedAt: '2026-10-05T20:35:00Z'
      }
    }
  },
  {
    id: 'fix_202',
    tournamentId: 'tour_02',
    round: 'Matchday 1',
    player1: {
      id: 'user_player_02',
      name: 'Neymar Dribble',
      efootballId: '701-849-221',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'FC Barcelona'
    },
    player2: {
      id: 'user_player_04',
      name: 'Haaland Finisher',
      efootballId: '822-194-673',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      favoriteClub: 'Manchester City'
    },
    scheduledTime: '2026-10-05 21:00',
    status: 'approved',
    result: {
      player1Score: 2,
      player2Score: 2,
      submittedBy: 'user_player_02',
      submittedByName: 'Neymar Dribble',
      screenshotUrl: SAMPLE_MATCH_SCREENSHOT,
      submittedAt: '2026-10-05T21:25:00Z',
      adminVerdict: {
        approvedBy: 'Coach Ferguson (Admin)',
        verifiedAt: '2026-10-05T21:30:00Z'
      }
    }
  }
];
