import React, { useState } from 'react';
import { api } from '../../services/api';
import type { TicTacToeMoveResponse } from '../../services/api';
import { sound } from '../../services/sound';
import { RotateCcw } from 'lucide-react';

interface TicTacToeProps {
  sessionId: string;
  challengeId: string;
  isAngry?: boolean;
  onWin: () => void;
  onFail: (msg: string) => void;
}

export const TicTacToeGame: React.FC<TicTacToeProps> = ({
  sessionId,
  challengeId,
  isAngry = false,
  onWin,
  onFail
}) => {
  const [board, setBoard] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);
  const [userScore, setUserScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('YOUR TURN');

  const handleCellClick = async (r: number, c: number) => {
    if (board[r][c] !== '' || loading) return;

    sound.playMove();
    setLoading(true);

    try {
      const res: TicTacToeMoveResponse = await api.submitTicTacToeMove(sessionId, challengeId, r, c);
      setBoard(res.board);
      setStatusMessage(res.message);

      if (res.status === 'PLAYER_WIN') {
        setUserScore(prev => prev + 1);
        sound.playVictory();
        setTimeout(() => onWin(), 900);
      } else if (res.status === 'AI_WIN') {
        setAiScore(prev => prev + 1);
        sound.playDefeat();
        setTimeout(() => onFail(res.message), 1200);
      } else if (res.status === 'DRAW') {
        sound.playDefeat();
        setTimeout(() => onFail(res.message), 1200);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Move error';
      setStatusMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setBoard([
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
    setStatusMessage('YOUR TURN');
    sound.playMove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {/* Title */}
      <h2 className="bubbly-title-3d" style={{ fontSize: '2rem', letterSpacing: 2 }}>
        TIC-TAC-TOE
      </h2>

      {/* Score Header (YOU: X vs AI: Y) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 360, padding: '0 8px' }}>
        <div className="font-bubble" style={{ fontSize: '1.2rem', color: '#3b82f6' }}>
          YOU: {userScore}
        </div>
        <div className="font-bubble" style={{ fontSize: '1.2rem', color: '#ef4444' }}>
          AI: {aiScore}
        </div>
      </div>

      {/* Difficulty Sticky Note */}
      <div style={{ alignSelf: 'flex-start', marginLeft: 20 }}>
        <div
          className="sticky-note"
          style={{ background: isAngry ? '#fecaca' : '#fef08a' }}
        >
          {isAngry ? 'Difficulty: Hard 💀' : 'Difficulty: Normal ✨'}
        </div>
      </div>

      {/* 3x3 Blocky Board (Matches Mockup 3) */}
      <div
        style={{
          background: '#bfdbfe',
          padding: 14,
          borderRadius: 20,
          border: '3px solid #1e1b2e',
          boxShadow: '4px 4px 0px #1e1b2e'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 85px)',
            gridTemplateRows: 'repeat(3, 85px)',
            gap: 8
          }}
        >
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleCellClick(rIdx, cIdx)}
                disabled={loading || cell !== ''}
                style={{
                  width: 85,
                  height: 85,
                  background: '#ffffff',
                  border: '2.5px solid #1e1b2e',
                  borderRadius: 16,
                  boxShadow: '2px 2px 0px #1e1b2e',
                  cursor: cell === '' && !loading ? 'pointer' : 'default',
                  fontFamily: 'Titan One',
                  fontSize: '2.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cell === 'X' ? '#fb7185' : '#f59e0b',
                  transition: 'transform 0.08s ease'
                }}
              >
                {cell === 'X' ? (
                  <span style={{ color: '#fb7185' }}>✕</span>
                ) : cell === 'O' ? (
                  <span style={{ color: '#ec4899' }}>◯</span>
                ) : (
                  ''
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="font-bubble"
        style={{
          fontSize: '1rem',
          color: '#1e1b2e',
          letterSpacing: 1,
          marginTop: 4,
          minHeight: 24
        }}
      >
        {statusMessage}
      </div>

      {/* Bottom Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        <button onClick={handleRestart} className="pill-btn pill-btn-blue" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
          <RotateCcw size={16} /> Restart Game
        </button>
        <button onClick={handleRestart} className="pill-btn pill-btn-yellow" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
          New opponent
        </button>
      </div>
    </div>
  );
};
