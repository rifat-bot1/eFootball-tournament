export interface UserProfile {
  id: string;
  name: string;
  email: string;
  efootballId: string; // In-game ID e.g. 982-412-104
  avatarUrl: string;
  role: 'admin' | 'player';
  favoriteClub: string; // e.g. FC Barcelona, Real Madrid, Arsenal, Manchester City
  rating: number; // e.g. 1820
  division: string; // e.g. Division 1
  playstyle?: string; // e.g. Quick Counter, Possession Game, Long Ball Counter
  phone?: string;
  bio?: string;
  password?: string;
  lastEfootballIdChangedAt?: string; // ISO date of last eFootball ID change for 10-day cooldown
  balance?: number; // User wallet balance in BDT (৳)
  createdAt: string;
}

export type TournamentFormat = 'knockout' | 'league';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export interface TournamentRules {
  matchLength: string; // e.g. "10 Mins"
  extraTime: boolean;
  penalties: boolean;
  playerCondition: string; // e.g. "Excellent" or "Random"
  injuries: boolean;
  substitutions: number; // e.g. 5
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  format: TournamentFormat;
  status: TournamentStatus;
  maxPlayers: number;
  registeredPlayerIds: string[];
  rules: TournamentRules;
  prizePool: string;
  entryFee?: number; // Entry fee in BDT (0 or undefined = Free)
  startDate: string;
  bannerUrl: string;
  winnerId?: string;
  winnerName?: string;
  createdAt: string;
}

export type MatchStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface MatchResult {
  player1Score: number;
  player2Score: number;
  submittedBy: string; // User ID
  submittedByName: string;
  screenshotUrl: string; // Match screenshot image URL
  submittedAt: string;
  notes?: string;
  adminVerdict?: {
    approvedBy: string;
    verifiedAt: string;
    rejectionReason?: string;
  };
}

export interface MatchFixture {
  id: string;
  tournamentId: string;
  round: string; // e.g. "Round of 16", "Quarter-Finals", "Semi-Finals", "Grand Final", "Matchday 1"
  player1: {
    id: string;
    name: string;
    efootballId: string;
    avatarUrl?: string;
    favoriteClub?: string;
  };
  player2: {
    id: string;
    name: string;
    efootballId: string;
    avatarUrl?: string;
    favoriteClub?: string;
  };
  scheduledTime: string;
  status: MatchStatus;
  result?: MatchResult;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  efootballId: string;
  avatarUrl?: string;
  favoriteClub?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface FirebaseConfigSettings {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  isConfigured: boolean;
}

export interface TelegramConfigSettings {
  webhookUrl: string; // URL where telegram-notify.php is hosted
  botToken: string;
  chatId: string;
  secretKey: string;
  autoNotifyOnApproval: boolean;
  autoNotifyOnCreate: boolean;
}

export interface TournamentAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'tournament' | 'maintenance' | 'info';
  priority?: 'high' | 'medium' | 'low';
  active: boolean;
  createdBy?: string;
  authorName?: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: string;
}

export interface AppSettings {
  appName: string;
  appTagline: string;
  telegramChannelUrl: string;
  telegramGroupUrl: string;
  whatsappNumber: string;
  supportPhone: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  paymentInstructions: string;
  urgentTickerText: string;
  isUrgentTickerActive: boolean;
  defaultEntryFee: number;
  defaultMatchLength: string;
  defaultExtraTime: boolean;
  defaultPenalties: boolean;
  defaultCondition: string;
  screenshotDeadlineMinutes: number;
  allowPlayerRegistration: boolean;
  maintenanceMode: boolean;
}

export type PaymentMethod = 'bkash' | 'nagad';
export type TransactionType = 'deposit' | 'withdraw' | 'entry_fee' | 'prize_reward' | 'admin_adjustment';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface WalletTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userEfootballId: string;
  type: TransactionType;
  amount: number;
  method?: PaymentMethod;
  senderNumber?: string; // e.g. 017...
  receiverNumber?: string; // e.g. 018...
  transactionId?: string; // TrxID from bKash/Nagad
  status: TransactionStatus;
  note?: string;
  tournamentId?: string;
  tournamentTitle?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

