import React, { useState } from 'react';
import { api } from '../../services/api';
import type { ScienceQuizResponse } from '../../services/api';
import { VadakkunokkiAvatar } from '../VadakkunokkiAvatar';
import { sound } from '../../services/sound';
import { Award } from 'lucide-react';

interface ScienceQuizProps {
  sessionId: string;
  challengeId: string;
  questions: Array<{
    question: string;
    options: string[];
  }>;
  isAngry?: boolean;
  onWin: () => void;
  onFail: (msg: string) => void;
}

export const ScienceQuizGame: React.FC<ScienceQuizProps> = ({
  sessionId,
  challengeId,
  questions,
  isAngry = false,
  onWin,
  onFail
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = async (optIdx: number) => {
    if (loading || selectedOption !== null) return;

    setSelectedOption(optIdx);
    setLoading(true);
    sound.playMove();

    try {
      const res: ScienceQuizResponse = await api.submitScienceQuizAnswer(
        sessionId,
        challengeId,
        currentIndex,
        optIdx
      );

      setFeedback(res.message);
      setCorrectCount(res.correct_count);

      if (res.correct) {
        sound.playBlip();
      } else {
        sound.playAngryBuzz();
      }

      setTimeout(() => {
        if (res.status === 'WON') {
          sound.playVictory();
          onWin();
        } else if (res.status === 'FAILED') {
          sound.playDefeat();
          onFail(res.message);
        } else {
          setCurrentIndex(res.current_index);
          setSelectedOption(null);
          setFeedback(null);
          setLoading(false);
        }
      }, 1300);
    } catch {
      setFeedback('Error checking answer.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {/* Title */}
      <h2 className="bubbly-title-3d" style={{ fontSize: '1.8rem', letterSpacing: 1 }}>
        TRIVIA CHALLENGE
      </h2>

      {/* Stats Header Bar (Matches Mockup) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: 440,
          padding: '8px 12px',
          background: '#faf9fd',
          border: '2px solid #1e1b2e',
          borderRadius: 14,
          boxShadow: '2px 2px 0px #1e1b2e'
        }}
      >
        <div className="font-bubble" style={{ fontSize: '0.85rem', color: '#1e1b2e' }}>
          QUESTION {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isAngry ? '#ef4444' : '#f59e0b' }}>
          {isAngry ? 'DIFFICULTY: HARD 💀' : 'DIFFICULTY: MEDIUM ⭐'}
        </div>
      </div>

      {/* Question Card (Matches Mockup) */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          border: '3px solid #1e1b2e',
          borderRadius: 18,
          boxShadow: '4px 4px 0px #1e1b2e',
          padding: '22px 20px',
          textAlign: 'center'
        }}
      >
        <h3
          className="font-bubble"
          style={{
            fontSize: '1.25rem',
            color: '#1e1b2e',
            lineHeight: 1.35,
            marginBottom: 20
          }}
        >
          {currentQ.question}
        </h3>

        {/* 4 3D Pill Button Options (Matches Mockup) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const letters = ['A', 'B', 'C', 'D'];
            const colors = ['#ffffff', '#bfdbfe', '#ffffff', '#bfdbfe'];

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={loading}
                style={{
                  padding: '12px 14px',
                  background: isSelected ? '#fed7aa' : colors[idx % 4],
                  border: '2.5px solid #1e1b2e',
                  borderRadius: 16,
                  boxShadow: '3px 3px 0px #1e1b2e',
                  textAlign: 'left',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'transform 0.08s ease'
                }}
              >
                <span
                  style={{
                    fontFamily: 'Fredoka',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#3b82f6'
                  }}
                >
                  {letters[idx]}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b2e' }}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vadakkunokki Commentary Bar Below (Matches Mockup) */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#f5f3fa',
          border: '2px solid #1e1b2e',
          borderRadius: 14,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '2px 2px 0px #1e1b2e'
        }}
      >
        <VadakkunokkiAvatar
          mood={isAngry ? 'angry' : 'sarcastic'}
          characterState="THINKING"
          size={44}
          interactive={false}
        />
        <div style={{ flex: 1, fontSize: '0.85rem', color: '#1e1b2e', fontStyle: 'italic' }}>
          {feedback || "Vadakkunokki: Answer all 3 questions correctly to earn your answer!"}
        </div>
      </div>

      {/* Bottom Stats (Matches Mockup) */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', width: '100%', maxWidth: 440 }}>
        <div className="stat-pill">
          SCORE {correctCount * 500}
        </div>
        <div className="stat-pill">
          STARE ⭐⭐⭐
        </div>
        <div className="stat-pill" style={{ color: '#ca8a04' }}>
          <Award size={16} /> PASSED: {correctCount}/3
        </div>
      </div>
    </div>
  );
};
