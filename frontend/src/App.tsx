import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { StartupGreeting, GameStartResponse, AnswerUnlockResponse } from './services/api';
import { WaveGridCanvas } from './components/WaveGridCanvas';
import { LandingView } from './components/LandingView';
import { ChatView } from './components/ChatView';
import { GameModal } from './components/games/GameModal';
import { VictoryUnlockModal } from './components/games/VictoryUnlockModal';
import { ExitModal } from './components/ExitModal';
import { LogOut } from 'lucide-react';
import { sound } from './services/sound';

export const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('sess_init');
  const [startupMessage, setStartupMessage] = useState<string>('');
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');

  // Active game & unlock state (triggered strictly from in-chat challenges)
  const [activeGameData, setActiveGameData] = useState<GameStartResponse | null>(null);
  const [unlockedData, setUnlockedData] = useState<AnswerUnlockResponse | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Initialize session & startup greeting
  useEffect(() => {
    const initStartup = async () => {
      try {
        const greeting: StartupGreeting = await api.getStartupGreeting();
        setSessionId(greeting.session_id);
        setStartupMessage(greeting.message);
      } catch {
        const fallbackId = `sess_${Math.random().toString(36).substring(2, 9)}`;
        setSessionId(fallbackId);
        setStartupMessage("Welcome. Unfortunately, I'm here.");
      }
    };
    initStartup();

    // Browser exit listener (FR-038)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Wait... you're leaving? Was I really that annoying?";
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Launch game triggered exclusively from chat challenges
  const handleLaunchGame = async (gameType: string, _challengeId?: string) => {
    try {
      const res = await api.startGame(sessionId, gameType);
      setActiveGameData(res);
    } catch {
      alert('Could not start game session.');
    }
  };

  const handleGameWon = async () => {
    if (!activeGameData) return;
    const chalId = activeGameData.challenge_id;
    setActiveGameData(null);

    try {
      // Call Answer Unlock API (FR-013, FR-030)
      const res: AnswerUnlockResponse = await api.unlockAnswer(sessionId, chalId);
      setUnlockedData(res);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unlock failed';
      alert(`Answer could not be unlocked: ${errMsg}`);
    }
  };

  const handleRestartGame = async (gameType: string) => {
    try {
      const res = await api.startGame(sessionId, gameType);
      setActiveGameData(res);
    } catch {
      alert('Could not restart game.');
    }
  };

  return (
    <>
      {/* Static Retro Grid Backdrop (Ripples removed) */}
      <WaveGridCanvas />

      <div className="desktop-app-root">
        {/* Floating Quick Exit Trigger Button */}
        <div className="floating-exit-dock">
          <button
            onClick={() => {
              sound.playAngryBuzz();
              setShowExitModal(true);
            }}
            className="pill-btn exit-dock-btn"
            title="Exit Experience"
          >
            <LogOut size={14} /> EXIT
          </button>
        </div>

        {/* View Switcher: Full Desktop Home Page vs Full Desktop Chat */}
        <div className="view-content-wrapper">
          {currentView === 'home' ? (
            <LandingView
              onStartChat={() => setCurrentView('chat')}
              startupMessage={startupMessage}
            />
          ) : (
            <ChatView
              sessionId={sessionId}
              onLaunchGame={handleLaunchGame}
              onBackToLanding={() => setCurrentView('home')}
            />
          )}
        </div>

        {/* In-Chat Challenge Game Modal */}
        {activeGameData && (
          <GameModal
            sessionId={sessionId}
            gameData={activeGameData}
            onClose={() => setActiveGameData(null)}
            onWin={handleGameWon}
            onRestart={handleRestartGame}
          />
        )}

        {/* Answer Unlock Celebration Modal */}
        {unlockedData && (
          <VictoryUnlockModal
            unlockData={unlockedData}
            onClose={() => setUnlockedData(null)}
          />
        )}

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <ExitModal
            onStay={() => setShowExitModal(false)}
            onExit={() => {
              setShowExitModal(false);
              window.location.href = 'https://google.com';
            }}
          />
        )}
      </div>
    </>
  );
};

export default App;
