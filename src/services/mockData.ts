import { Tournament, MatchFixture, UserProfile } from '../types/tournament';

// Admin profile only (No demo players)
export const SEED_PLAYERS: UserProfile[] = [
  {
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
  }
];

// Empty tournaments (No demo tournaments)
export const SEED_TOURNAMENTS: Tournament[] = [];

// Empty fixtures (No demo fixtures)
export const SEED_FIXTURES: MatchFixture[] = [];

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

