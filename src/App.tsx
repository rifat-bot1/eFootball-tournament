/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getTournaments, 
  getFixtures, 
  getCurrentUser, 
  getUsers, 
  setCurrentUser, 
  joinTournament, 
  leaveTournament,
  updateTournamentBanner,
  updateTournament,
  deleteTournament,
  createTournament, 
  generateFixturesForTournament, 
  submitMatchResult, 
  approveMatchResult, 
  rejectMatchResult, 
  calculateLeaderboard, 
  registerUser,
  clearCurrentUserSession,
  getOrCreateUserProfileForAuth,
  isUserAdmin,
  concludeTournament,
  updateUserProfile,
  adminAddPlayerToTournament,
  adminOverrideMatchResult,
  adminUpdateUser,
  adminDeleteUser,
  subscribeToTournaments,
  subscribeToFixtures,
  subscribeToUsers
} from './services/tournamentService';
import { onFirebaseAuthStateChanged, logOut } from './services/firebase';
import { Tournament, MatchFixture, UserProfile, LeaderboardEntry, AppSettings, WalletTransaction } from './types/tournament';
import { getAppSettings, subscribeToAppSettings } from './services/settingsService';
import { subscribeToTransactions } from './services/walletService';
import { Radio } from 'lucide-react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { FixturesView } from './components/FixturesView';
import { LeaderboardView } from './components/LeaderboardView';
import { TournamentHistoryView } from './components/TournamentHistoryView';
import { RulesView } from './components/RulesView';
import { AdminPanel } from './components/AdminPanel';
import { ResultSubmissionModal } from './components/ResultSubmissionModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateTournamentModal } from './components/CreateTournamentModal';
import { ScreenshotInspectModal } from './components/ScreenshotInspectModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TournamentLiveNoticeFeedModal } from './components/TournamentLiveNoticeFeedModal';
import { UserWalletModal } from './components/UserWalletModal';
import { AdminUsersModal } from './components/AdminUsersModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'history' | 'rules' | 'admin'>('dashboard');

  // Core Data States
  const [currentUser, setCurrentUserState] = useState<UserProfile>(getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(getUsers());
  const [tournaments, setTournaments] = useState<Tournament[]>(getTournaments());
  const [fixtures, setFixtures] = useState<MatchFixture[]>(getFixtures());
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());

  // Subscribe to live app settings
  useEffect(() => {
    const unsub = subscribeToAppSettings(setAppSettings);
    return () => unsub();
  }, []);

  // Real-time Firestore sync subscriptions for Tournaments, Fixtures, and Users across all devices
  useEffect(() => {
    const unsubTournaments = subscribeToTournaments((updatedTournaments) => {
      setTournaments(updatedTournaments);
      setSelectedTournamentId((prev) => {
        if (!prev && updatedTournaments.length > 0) return updatedTournaments[0].id;
        if (prev && !updatedTournaments.some(t => t.id === prev) && updatedTournaments.length > 0) {
          return updatedTournaments[0].id;
        }
        return prev;
      });
    });

    const unsubFixtures = subscribeToFixtures(setFixtures);
    const unsubUsers = subscribeToUsers(setAllUsers);

    return () => {
      unsubTournaments();
      unsubFixtures();
      unsubUsers();
    };
  }, []);

  // Transactions state & live Firestore subscription
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  useEffect(() => {
    const unsubTx = subscribeToTransactions(setAllTransactions);
    return () => unsubTx();
  }, []);

  // Pending transactions count for admin notice badge
  const pendingTransactionsCount = allTransactions.filter(t => t.status === 'pending').length;

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedFixtureForSubmit, setSelectedFixtureForSubmit] = useState<MatchFixture | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isNoticeFeedModalOpen, setIsNoticeFeedModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateTourModalOpen, setIsCreateTourModalOpen] = useState(false);
  const [inspectScreenshot, setInspectScreenshot] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  // Sync currentUser with allUsers whenever balance or profile details change
  useEffect(() => {
    const freshUser = allUsers.find(u => u.id === currentUser.id);
    if (freshUser && (freshUser.balance !== currentUser.balance || freshUser.role !== currentUser.role)) {
      setCurrentUserState(freshUser);
    }
  }, [allUsers, currentUser.id, currentUser.balance, currentUser.role]);

  // Calculate live leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => calculateLeaderboard(selectedTournamentId));

  // Recalculate leaderboard when fixtures or selected tournament changes
  useEffect(() => {
    setLeaderboard(calculateLeaderboard(selectedTournamentId));
  }, [fixtures, selectedTournamentId]);

  // Security guard: If non-admin user is on 'admin' tab, redirect to 'dashboard'
  useEffect(() => {
    if (activeTab === 'admin' && !isUserAdmin(currentUser)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser]);

  // Listen to persistent Firebase Auth state and keep user session permanently saved
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((fbUser) => {
      if (fbUser && fbUser.email) {
        const userProfile = getOrCreateUserProfileForAuth(
          fbUser.email,
          fbUser.displayName || undefined,
          fbUser.photoURL || undefined
        );
        setCurrentUserState(userProfile);
        setAllUsers(getUsers());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    clearCurrentUserSession();
    try {
      await logOut();
    } catch (e) {}
    const defaultUser = getCurrentUser();
    setCurrentUserState(defaultUser);
    setActiveTab('dashboard');
    setIsProfileModalOpen(false);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  // Count pending reviews for admin badge
  const pendingReviewsCount = fixtures.filter(f => f.status === 'submitted').length;

  // Handlers
  const handleJoinTournament = async (tournamentId: string, customDetails?: any) => {
    const res = await joinTournament(tournamentId, currentUser, customDetails);
    setTournaments(getTournaments());
    setCurrentUserState(getCurrentUser());
    setAllUsers(getUsers());
    return res;
  };

  const handleLeaveTournament = (tournamentId: string) => {
    leaveTournament(tournamentId, currentUser.id);
    setTournaments(getTournaments());
  };

  const handleUpdateTournamentBanner = (tournamentId: string, bannerUrl: string) => {
    updateTournamentBanner(tournamentId, bannerUrl);
    setTournaments(getTournaments());
  };

  const handleOpenSubmit = (fixture?: MatchFixture) => {
    setSelectedFixtureForSubmit(fixture || null);
    setIsSubmitModalOpen(true);
  };

  const handleSubmitResult = async (
    fixtureId: string,
    data: {
      player1Score: number;
      player2Score: number;
      screenshotUrlOrBase64: string;
      notes?: string;
    }
  ) => {
    await submitMatchResult(fixtureId, data);
    setFixtures(getFixtures());
  };

  const handleApproveResult = async (fixtureId: string) => {
    const res = await approveMatchResult(fixtureId, currentUser.name);
    setFixtures(getFixtures());
    return res;
  };

  const handleRejectResult = (fixtureId: string, reason: string) => {
    rejectMatchResult(fixtureId, currentUser.name, reason);
    setFixtures(getFixtures());
  };

  const handleCreateTournament = async (data: any) => {
    const newTour = await createTournament(data);
    setTournaments(getTournaments());
    setSelectedTournamentId(newTour.id);
  };

  const handleGenerateFixtures = (tournamentId: string): { success: boolean; error?: string; count?: number } => {
    try {
      const generated = generateFixturesForTournament(tournamentId);
      setFixtures(getFixtures());
      setTournaments(getTournaments());
      return { success: true, count: generated.length };
    } catch (err: any) {
      console.warn('Failed to generate fixtures:', err);
      return { success: false, error: err?.message || 'Failed to generate fixtures' };
    }
  };

  const handleAdminAddPlayer = (tournamentId: string, name?: string) => {
    try {
      adminAddPlayerToTournament(tournamentId, name);
      setTournaments(getTournaments());
      setAllUsers(getUsers());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to add player' };
    }
  };

  const handleConcludeTournament = (tournamentId: string) => {
    concludeTournament(tournamentId);
    setTournaments(getTournaments());
  };

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    setAllUsers(getUsers());
  };

  const handleRegisterUser = (data: any) => {
    const newUser = registerUser(data);
    setAllUsers(getUsers());
    setCurrentUserState(newUser);
  };

  const handleUpdateProfile = (updatedData: Partial<UserProfile>) => {
    const updated = updateUserProfile(currentUser.id, updatedData);
    setCurrentUserState(updated);
    setAllUsers(getUsers());
    setFixtures(getFixtures());
  };

  const handleUpdateTournament = (tournamentId: string, updates: Partial<Tournament>) => {
    updateTournament(tournamentId, updates);
    setTournaments(getTournaments());
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    await deleteTournament(tournamentId);
    const updated = getTournaments();
    setTournaments(updated);
    setFixtures(getFixtures());
    setSelectedTournamentId(prev => {
      if (prev === tournamentId) {
        return updated[0]?.id || '';
      }
      return prev;
    });
  };

  const handleOverrideMatchResult = (
    fixtureId: string,
    p1Score: number,
    p2Score: number,
    winnerId?: string,
    notes?: string
  ) => {
    adminOverrideMatchResult(fixtureId, p1Score, p2Score, winnerId, notes);
    setFixtures(getFixtures());
  };

  const handleAdminUpdateUser = (userId: string, updates: Partial<UserProfile>) => {
    const updated = adminUpdateUser(userId, updates);
    setAllUsers(getUsers());
    if (currentUser.id === userId) {
      setCurrentUserState(updated);
    }
  };

  const handleAdminDeleteUser = (userId: string) => {
    adminDeleteUser(userId);
    setAllUsers(getUsers());
  };

  const handleViewScreenshot = (url: string, title: string) => {
    setInspectScreenshot({ open: true, url, title });
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans pitch-grid selection:bg-[#00ff87]/30 selection:text-[#00ff87]">
      
      {/* Header with Navigation and Profile Info */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'submit') {
            handleOpenSubmit();
          } else if (tab === 'admin') {
            if (isUserAdmin(currentUser)) {
              setActiveTab('admin');
            } else {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }
          } else {
            setActiveTab(tab);
          }
        }}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNoticeFeed={() => setIsNoticeFeedModalOpen(true)}
        onOpenWallet={() => {
          setWalletInitialTab('deposit');
          setIsWalletModalOpen(true);
        }}
        onOpenAdminUsers={() => setIsAdminUsersModalOpen(true)}
        pendingTransactionsCount={pendingTransactionsCount}
        pendingReviewsCount={pendingReviewsCount}
        onLogout={handleLogout}
      />

      {/* Urgent Live Marquee Ticker (Managed by Admin) */}
      {appSettings.isUrgentTickerActive && appSettings.urgentTickerText && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-950 to-rose-950/90 border-b border-rose-500/30 px-3 py-1.5 text-xs text-rose-200 shadow-inner">
          <div className="mx-auto max-w-7xl flex items-center gap-2.5 overflow-hidden">
            <span className="flex items-center gap-1 rounded bg-rose-500/25 px-2 py-0.5 text-[10px] font-black uppercase text-rose-300 border border-rose-500/40 shrink-0 animate-pulse">
              <Radio className="w-3 h-3 text-rose-400" />
              LIVE TICKER
            </span>
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <span className="font-semibold text-rose-100 text-xs tracking-wide">
                {appSettings.urgentTickerText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container with generous bottom safe area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-2.5 sm:px-6 py-3 sm:py-6 pb-[max(calc(env(safe-area-inset-bottom,0px)+120px),130px)] sm:pb-24">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            tournaments={tournaments}
            currentUser={currentUser}
            leaderboard={leaderboard}
            fixtures={fixtures}
            onOpenWallet={() => {
              setWalletInitialTab('deposit');
              setIsWalletModalOpen(true);
            }}
            onJoinTournament={handleJoinTournament}
            onLeaveTournament={handleLeaveTournament}
            onUpdateTournamentBanner={handleUpdateTournamentBanner}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onNavigateToFixtures={(tourId) => {
              if (tourId) setSelectedTournamentId(tourId);
              setActiveTab('fixtures');
            }}
            onNavigateToSubmit={(fix) => handleOpenSubmit(fix)}
            onOpenCreateModal={() => setIsCreateTourModalOpen(true)}
            onNavigateToRules={() => setActiveTab('rules')}
            onNavigateToHistory={() => setActiveTab('history')}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesView
            fixtures={fixtures}
            tournaments={tournaments}
            selectedTournamentId={selectedTournamentId}
            onSelectTournamentId={setSelectedTournamentId}
            currentUser={currentUser}
            onSubmitResult={(fix) => handleOpenSubmit(fix)}
            onViewScreenshot={handleViewScreenshot}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            leaderboard={leaderboard}
            tournaments={tournaments}
            selectedTournamentId={selectedTournamentId}
            onSelectTournamentId={setSelectedTournamentId}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'history' && (
          <TournamentHistoryView
            tournaments={tournaments}
            fixtures={fixtures}
            currentUser={currentUser}
            onViewScreenshot={handleViewScreenshot}
            onNavigateToFixtures={(tourId) => {
              if (tourId) setSelectedTournamentId(tourId);
              setActiveTab('fixtures');
            }}
          />
        )}

        {activeTab === 'rules' && (
          <RulesView
            onNavigateToSubmit={() => handleOpenSubmit()}
            onNavigateToFixtures={() => setActiveTab('fixtures')}
          />
        )}

        {activeTab === 'admin' && isUserAdmin(currentUser) && (
          <AdminPanel
            currentUser={currentUser}
            fixtures={fixtures}
            tournaments={tournaments}
            allUsers={allUsers}
            onApproveResult={handleApproveResult}
            onRejectResult={handleRejectResult}
            onOpenCreateTournament={() => setIsCreateTourModalOpen(true)}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onGenerateFixtures={handleGenerateFixtures}
            onConcludeTournament={handleConcludeTournament}
            onViewScreenshot={handleViewScreenshot}
            onSwitchToAdmin={() => setIsAuthModalOpen(true)}
            onAdminAddPlayer={handleAdminAddPlayer}
            onOverrideMatchResult={handleOverrideMatchResult}
            onAdminUpdateUser={handleAdminUpdateUser}
            onAdminDeleteUser={handleAdminDeleteUser}
          />
        )}

      </main>

      {/* Result Submission Modal (Crucial screenshot upload & score submission) */}
      <ResultSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        fixtures={fixtures}
        selectedFixture={selectedFixtureForSubmit}
        currentUser={currentUser}
        onSubmitResult={handleSubmitResult}
      />

      {/* Player Profile Details & Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        fixtures={fixtures}
        onUpdateProfile={handleUpdateProfile}
        onOpenAuth={() => {
          setIsProfileModalOpen(false);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Player Registration & Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onRegister={handleRegisterUser}
        onLogout={handleLogout}
      />

      {/* Tournament Live Notice & Urgent Feed Modal */}
      <TournamentLiveNoticeFeedModal
        isOpen={isNoticeFeedModalOpen}
        onClose={() => setIsNoticeFeedModalOpen(false)}
        currentUser={currentUser}
        onNavigateToFixtures={() => {
          setIsNoticeFeedModalOpen(false);
          setActiveTab('fixtures');
        }}
        onNavigateToRules={() => {
          setIsNoticeFeedModalOpen(false);
          setActiveTab('rules');
        }}
        onNavigateToDashboard={() => {
          setIsNoticeFeedModalOpen(false);
          setActiveTab('dashboard');
        }}
      />

      {/* Admin: Create Tournament Modal */}
      {isUserAdmin(currentUser) && (
        <CreateTournamentModal
          isOpen={isCreateTourModalOpen}
          onClose={() => setIsCreateTourModalOpen(false)}
          onCreateTournament={handleCreateTournament}
        />
      )}

      {/* Screenshot Full Screen Inspector Modal */}
      <ScreenshotInspectModal
        isOpen={inspectScreenshot.open}
        onClose={() => setInspectScreenshot({ open: false, url: '', title: '' })}
        imageUrl={inspectScreenshot.url}
        title={inspectScreenshot.title}
      />

      {/* User Wallet Modal (Balance, Deposit via bKash/Nagad 01621833825, Withdraw, Trx History) */}
      <UserWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentUser={currentUser}
        initialTab={walletInitialTab}
      />

      {/* Admin Users & Transaction Verification Modal (Admin Only) */}
      {isUserAdmin(currentUser) && (
        <AdminUsersModal
          isOpen={isAdminUsersModalOpen}
          onClose={() => setIsAdminUsersModalOpen(false)}
          allUsers={allUsers}
          currentUser={currentUser}
          onUpdateUser={handleAdminUpdateUser}
        />
      )}

      {/* Offline Status Detector (PWA requirement) */}
      <OfflineIndicator />

    </div>
  );
}
