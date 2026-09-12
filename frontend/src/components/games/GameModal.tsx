import React, { useState } from 'react';
import type { GameStartResponse } from '../../services/api';
import { VadakkunokkiAvatar } from '../VadakkunokkiAvatar';
import { TicTacToeGame } from './TicTacToeGame';
import { BubbleShooterGame } from './BubbleShooterGame';
import { SpeedMathGame } from './SpeedMathGame';
import { ScienceQuizGame } from './ScienceQuizGame';
import { X, RotateCcw, Trophy, Frown, Lock } from 'lucide-react';
import { sound } from '../../services/sound';

interface GameModalProps {
  sessionId: string;
  gameData: GameStartResponse;
  onClose: () => void;
  onWin: () => void;
  onRestart: (gameType: string) => void;
}

export const GameModal: React.FC<GameModalProps> = ({
  sessionId,
  gameData,
  onClose,
  onWin,
  onRestart
}) => {
  const [outcome, setOutcome] = useState<'PLAYING' | 'WON' | 'FAILED'>('PLAYING');
  const [failReason, setFailReason] = useState<string>('');

  const isAngry = Boolean(gameData.game_state?.is_angry);

  const handleWin = () => {
    setOutcome('WON');
    sound.playVictory();
    setTimeout(() => {
      onWin();
    }, 1200);
  };

  const handleFail = (msg: string) => {
    setOutcome('FAILED');
    setFailReason(msg);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="mac-window"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Mac Titlebar */}
        <div className="mac-titlebar">
          <div className="traffic-dots">
            <button
              onClick={() => {
                sound.playBlip();
                onClose();
              }}
              className="traffic-dot dot-red"
              style={{ cursor: 'pointer', border: 'none' }}
              title="Close"
            />
            <div className="traffic-dot dot-yellow" />
            <div className="traffic-dot dot-green" />
          </div>
          <div className="window-url-bar">
            <Lock size={12} color="#6b7280" />
            <span>vadakkunokki / game</span>
          </div>
          <button
            onClick={() => {
              sound.playBlip();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Commentary bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: isAngry ? '#fee2e2' : '#f5f3fa',
              border: '2px solid #1e1b2e',
              borderRadius: 16,
              padding: '10px 14px',
              marginBottom: 16
            }}
          >
            <VadakkunokkiAvatar
              mood={outcome === 'WON' ? 'sad' : isAngry ? 'angry' : 'sarcastic'}
              characterState={outcome === 'WON' ? 'DEFEATED' : isAngry ? 'ANGRY' : 'TAUNTING'}
              size={50}
              interactive={false}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Fredoka',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: isAngry ? '#b91c1c' : '#1e1b2e'
                }}
              >
                VADAKKUNOKKI {isAngry ? '🔥 [ANGRY MODE]' : ''}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#1e1b2e', fontStyle: 'italic', marginTop: 2 }}>
                {outcome === 'WON'
                  ? 'No way... you actually conquered my challenge!'
                  : outcome === 'FAILED'
                  ? `HA! ${failReason || 'You lost! Try again if you dare.'}`
                  : `"${gameData.taunt}"`}
              </div>
            </div>
          </div>

          {/* Active Game Component */}
          {outcome === 'PLAYING' && (
            <div>
              {gameData.game === 'tic_tac_toe' && (
                <TicTacToeGame
                  sessionId={sessionId}
                  challengeId={gameData.challenge_id}
                  isAngry={isAngry}
                  onWin={handleWin}
                  onFail={handleFail}
                />
              )}
              {gameData.game === 'bubble_shooter' && (
                <BubbleShooterGame
                  sessionId={sessionId}
                  challengeId={gameData.challenge_id}
                  targetScore={gameData.target_score || (isAngry ? 800 : 500)}
                  timeLimit={gameData.time_limit || (isAngry ? 30 : 45)}
                  isAngry={isAngry}
                  onWin={handleWin}
                  onFail={handleFail}
                />
              )}
              {gameData.game === 'speed_math' && (
                <SpeedMathGame
                  sessionId={sessionId}
                  challengeId={gameData.challenge_id}
                  initialProblem={
                    gameData.game_state.first_problem as {
                      problem_id: string;
                      display: string;
                      expected_answer: number;
                      difficulty: number;
                    }
                  }
                  targetCount={gameData.target_score || (isAngry ? 8 : 4)}
                  isAngry={isAngry}
                  onWin={handleWin}
                  onFail={handleFail}
                />
              )}
              {gameData.game === 'science_quiz' && (
                <ScienceQuizGame
                  sessionId={sessionId}
                  challengeId={gameData.challenge_id}
                  questions={
                    gameData.game_state.questions as Array<{
                      question: string;
                      options: string[];
                    }>
                  }
                  isAngry={isAngry}
                  onWin={handleWin}
                  onFail={handleFail}
                />
              )}
            </div>
          )}

          {/* Won State Celebration */}
          {outcome === 'WON' && (
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <Trophy size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
              <h3 className="bubbly-title-3d" style={{ fontSize: '1.8rem', color: '#16a34a', marginBottom: 8 }}>
                CHALLENGE CLEARED!
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#1e1b2e', fontWeight: 600, marginBottom: 20 }}>
                Highscore achieved! Preparing your verified Gemini answer...
              </p>
              <div
                style={{
                  padding: 12,
                  background: '#f0fdf4',
                  border: '2.5px solid #16a34a',
                  borderRadius: 14,
                  fontFamily: 'Fredoka',
                  fontSize: '0.9rem',
                  color: '#15803d',
                  fontWeight: 700
                }}
              >
                ACCESS GRANTED — REVEALING WISDOM
              </div>
            </div>
          )}

          {/* Failed State Screen */}
          {outcome === 'FAILED' && (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <Frown size={44} color="#ef4444" style={{ margin: '0 auto 14px' }} />
              <h3 className="bubbly-title-3d" style={{ fontSize: '1.6rem', color: '#ef4444', marginBottom: 8 }}>
                CHALLENGE FAILED!
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: 22, lineHeight: 1.4 }}>
                {failReason || "Vadakkunokki's answer remains locked behind the highscore vault!"}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    sound.playMove();
                    setOutcome('PLAYING');
                    onRestart(gameData.game);
                  }}
                  className="pill-btn pill-btn-blue"
                  style={{ fontSize: '0.85rem', padding: '10px 20px' }}
                >
                  <RotateCcw size={16} /> RETRY
                </button>
                <button
                  onClick={() => {
                    sound.playBlip();
                    onClose();
                  }}
                  className="pill-btn"
                  style={{ fontSize: '0.85rem', padding: '10px 20px' }}
                >
                  RETURN TO CHAT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
