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
  createTournament, 
  generateFixturesForTournament, 
  submitMatchResult, 
  approveMatchResult, 
  rejectMatchResult, 
  calculateLeaderboard, 
  registerUser,
  resetToSeedData 
} from './services/tournamentService';
import { Tournament, MatchFixture, UserProfile, LeaderboardEntry } from './types/tournament';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { FixturesView } from './components/FixturesView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPanel } from './components/AdminPanel';
import { ResultSubmissionModal } from './components/ResultSubmissionModal';
import { AuthModal } from './components/AuthModal';
import { CreateTournamentModal } from './components/CreateTournamentModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { TelegramPhpModal } from './components/TelegramPhpModal';
import { ScreenshotInspectModal } from './components/ScreenshotInspectModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'admin' | 'telegram'>('dashboard');

  // Core Data States
  const [currentUser, setCurrentUserState] = useState<UserProfile>(getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(getUsers());
  const [tournaments, setTournaments] = useState<Tournament[]>(getTournaments());
  const [fixtures, setFixtures] = useState<MatchFixture[]>(getFixtures());
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedFixtureForSubmit, setSelectedFixtureForSubmit] = useState<MatchFixture | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateTourModalOpen, setIsCreateTourModalOpen] = useState(false);
  const [isFirebaseConfigModalOpen, setIsFirebaseConfigModalOpen] = useState(false);
  const [isTelegramScriptModalOpen, setIsTelegramScriptModalOpen] = useState(false);
  const [inspectScreenshot, setInspectScreenshot] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  // Calculate live leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => calculateLeaderboard(selectedTournamentId));

  // Recalculate leaderboard when fixtures or selected tournament changes
  useEffect(() => {
    setLeaderboard(calculateLeaderboard(selectedTournamentId));
  }, [fixtures, selectedTournamentId]);

  // Count pending reviews for admin badge
  const pendingReviewsCount = fixtures.filter(f => f.status === 'submitted').length;

  // Handlers
  const handleJoinTournament = (tournamentId: string) => {
    const updated = joinTournament(tournamentId, currentUser);
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

  const handleGenerateFixtures = (tournamentId: string) => {
    generateFixturesForTournament(tournamentId);
    setFixtures(getFixtures());
    setTournaments(getTournaments());
  };

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentUserState(user);
  };

  const handleRegisterUser = (data: any) => {
    const newUser = registerUser(data);
    setAllUsers(getUsers());
    setCurrentUserState(newUser);
  };

  const handleResetData = () => {
    if (confirm('Reset all tournaments, fixtures, and scores to initial demo data?')) {
      resetToSeedData();
      setCurrentUserState(getCurrentUser());
      setAllUsers(getUsers());
      setTournaments(getTournaments());
      setFixtures(getFixtures());
    }
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
          } else if (tab === 'telegram') {
            setIsTelegramScriptModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
        onOpenTelegramScript={() => setIsTelegramScriptModalOpen(true)}
        pendingReviewsCount={pendingReviewsCount}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 pb-20">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            tournaments={tournaments}
            currentUser={currentUser}
            leaderboard={leaderboard}
            onJoinTournament={handleJoinTournament}
            onNavigateToFixtures={(tourId) => {
              if (tourId) setSelectedTournamentId(tourId);
              setActiveTab('fixtures');
            }}
            onNavigateToSubmit={() => handleOpenSubmit()}
            onOpenCreateModal={() => setIsCreateTourModalOpen(true)}
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

        {activeTab === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            fixtures={fixtures}
            tournaments={tournaments}
            onApproveResult={handleApproveResult}
            onRejectResult={handleRejectResult}
            onOpenCreateTournament={() => setIsCreateTourModalOpen(true)}
            onGenerateFixtures={handleGenerateFixtures}
            onViewScreenshot={handleViewScreenshot}
            onSwitchToAdmin={() => {
              const adminUser = allUsers.find(u => u.role === 'admin') || allUsers[0];
              handleSelectUser(adminUser);
            }}
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

      {/* Player Registration & Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onRegister={handleRegisterUser}
      />

      {/* Admin: Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateTourModalOpen}
        onClose={() => setIsCreateTourModalOpen(false)}
        onCreateTournament={handleCreateTournament}
      />

      {/* Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseConfigModalOpen}
        onClose={() => setIsFirebaseConfigModalOpen(false)}
      />

      {/* Telegram Bot & PHP Script Modal */}
      <TelegramPhpModal
        isOpen={isTelegramScriptModalOpen}
        onClose={() => setIsTelegramScriptModalOpen(false)}
      />

      {/* Screenshot Full Screen Inspector Modal */}
      <ScreenshotInspectModal
        isOpen={inspectScreenshot.open}
        onClose={() => setInspectScreenshot({ open: false, url: '', title: '' })}
        imageUrl={inspectScreenshot.url}
        title={inspectScreenshot.title}
      />

      {/* Offline Status Detector (PWA requirement) */}
      <OfflineIndicator />

    </div>
  );
}
