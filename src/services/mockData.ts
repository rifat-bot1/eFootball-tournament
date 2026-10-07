import { Tournament, MatchFixture, UserProfile } from '../types/tournament';

// Admin profile only (No demo players)
export const SEED_PLAYERS: UserProfile[] = [
  {
    id: 'user_admin_01',
    name: 'Mohammad Rifat (Admin)',
    email: 'rfrifatbs@gmail.com',
    efootballId: '6595302089',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    favoriteClub: 'Real Madrid',
    rating: 1980,
    division: 'Division 1',
    createdAt: '2026-01-01'
  }
];

// Empty tournaments (No demo tournaments)
export const SEED_TOURNAMENTS: Tournament[] = [];

// Empty fixtures (No demo fixtures)
export const SEED_FIXTURES: MatchFixture[] = [];

// Fallback sample match screenshot for testing
export const SAMPLE_MATCH_SCREENSHOT = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="#0a1224"/>
  <rect x="20" y="20" width="760" height="410" rx="16" fill="#0f172a" stroke="#00ff87" stroke-width="2"/>
  <text x="400" y="58" fill="#00ff87" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">eFootball Match Result Proof</text>
  <text x="400" y="230" fill="#ffffff" font-family="monospace" font-size="64" font-weight="bold" text-anchor="middle">2 - 1</text>
  <text x="400" y="290" fill="#00e5ff" font-family="sans-serif" font-size="16" text-anchor="middle">FULL TIME - VERIFIED RESULT</text>
</svg>
`);

