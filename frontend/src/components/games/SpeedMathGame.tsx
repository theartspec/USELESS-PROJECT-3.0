import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { SpeedMathResponse } from '../../services/api';
import { sound } from '../../services/sound';

interface SpeedMathProps {
  sessionId: string;
  challengeId: string;
  initialProblem: {
    problem_id: string;
    display: string;
    expected_answer: number;
    difficulty: number;
  };
  targetCount?: number;
  isAngry?: boolean;
  onWin: () => void;
  onFail: (msg: string) => void;
}

export const SpeedMathGame: React.FC<SpeedMathProps> = ({
  sessionId,
  challengeId,
  initialProblem,
  targetCount = 3,
  isAngry = false,
  onWin,
  onFail
}) => {
  const [currentProblem, setCurrentProblem] = useState(initialProblem);
  const [inputVal, setInputVal] = useState<string>('');
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(isAngry ? 20 : 30);
  const [message, setMessage] = useState<string>(`Solve ${targetCount} arithmetic problems quickly!`);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentProblem]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playDefeat();
          onFail("Time's up! Your mental math was too slow!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFail]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const numAnswer = parseInt(inputVal.trim(), 10);
    if (isNaN(numAnswer)) return;

    setLoading(true);
    sound.playMove();

    try {
      const res: SpeedMathResponse = await api.submitSpeedMathAnswer(
        sessionId,
        challengeId,
        currentProblem.problem_id,
        numAnswer
      );

      setMessage(res.message);
      setCorrectCount(res.correct_count);
      setTimeLeft(res.time_remaining);
      setInputVal('');

      if (res.status === 'WON') {
        sound.playVictory();
        setTimeout(() => onWin(), 600);
      } else if (res.status === 'FAILED') {
        sound.playDefeat();
        setTimeout(() => onFail(res.message), 1000);
      } else if (res.next_problem) {
        if (res.correct) {
          sound.playBlip();
        } else {
          sound.playAngryBuzz();
        }
        setCurrentProblem(res.next_problem);
      }
    } catch {
      setMessage('Error evaluating answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {/* Title */}
      <h2 className="bubbly-title-3d" style={{ fontSize: '1.8rem', letterSpacing: 1 }}>
        SPEED MATH
      </h2>

      {/* Target & Time HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 360 }}>
        <div className="stat-pill" style={{ color: '#16a34a' }}>
          PROGRESS: {correctCount} / {targetCount}
        </div>
        <div className="stat-pill" style={{ color: timeLeft <= 5 ? '#ef4444' : '#2563eb' }}>
          TIME: {timeLeft}s
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Fredoka',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: isAngry ? '#ef4444' : '#1e1b2e',
          textAlign: 'center',
          minHeight: 20
        }}
      >
        {isAngry ? `💀 ANGRY MODE: Solve ${targetCount} problems!` : message}
      </div>

      {/* Math Card Display */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#ffffff',
          border: '3px solid #1e1b2e',
          borderRadius: 20,
          boxShadow: '4px 4px 0px #1e1b2e',
          padding: '28px 20px',
          textAlign: 'center'
        }}
      >
        <div
          className="font-bubble"
          style={{
            fontSize: '2.4rem',
            color: '#1e1b2e',
            marginBottom: 20,
            letterSpacing: 2
          }}
        >
          {currentProblem.display}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <input
            ref={inputRef}
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={loading}
            placeholder="?"
            style={{
              width: 130,
              padding: '10px 14px',
              fontFamily: 'Titan One',
              fontSize: '1.6rem',
              textAlign: 'center',
              border: '2.5px solid #1e1b2e',
              borderRadius: 14,
              boxShadow: '2px 2px 0px #1e1b2e',
              outline: 'none',
              background: '#faf9fd'
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="pill-btn pill-btn-blue"
            style={{ fontSize: '0.9rem', padding: '10px 20px' }}
          >
            SUBMIT
          </button>
        </form>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
        Type the number and press Enter on your keyboard!
      </div>
    </div>
  );
};
