import React from 'react';
import type { AnswerUnlockResponse } from '../../services/api';
import { VadakkunokkiAvatar } from '../VadakkunokkiAvatar';
import { Sparkles, CheckCircle2, Trophy } from 'lucide-react';
import { sound } from '../../services/sound';

interface VictoryUnlockProps {
  unlockData: AnswerUnlockResponse;
  onClose: () => void;
}

export const VictoryUnlockModal: React.FC<VictoryUnlockProps> = ({
  unlockData,
  onClose
}) => {
  return (
    <div className="modal-backdrop">
      <div
        className="mac-window"
        style={{
          maxWidth: 620,
          width: '100%',
          padding: 24,
          background: '#ffffff',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2.5px solid #1e1b2e',
            paddingBottom: 14,
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={26} color="#f59e0b" />
            <h2 className="font-bubble" style={{ fontSize: '1.4rem', color: '#1e1b2e' }}>
              HIGHSCORE ACHIEVED! ANSWER UNLOCKED!
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playBlip();
              onClose();
            }}
            className="traffic-dot dot-red"
            style={{ cursor: 'pointer', border: 'none' }}
            title="Close"
          />
        </div>

        {/* Character Reaction Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#fef08a',
            border: '2.5px solid #1e1b2e',
            borderRadius: 18,
            boxShadow: '3px 3px 0px #1e1b2e',
            padding: '12px 16px',
            marginBottom: 20
          }}
        >
          <VadakkunokkiAvatar
            mood={unlockData.mood || 'sarcastic'}
            characterState="DEFEATED"
            size={70}
            interactive={false}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'Fredoka',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#1e1b2e',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sparkles size={16} color="#e11d48" /> VADAKKUNOKKI CONCEDES:
            </div>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#1e1b2e',
                fontStyle: 'italic',
                fontWeight: 600,
                marginTop: 4
              }}
            >
              "{unlockData.personality_message || "Fine! You achieved the target score. Here is your well-deserved answer:"}"
            </p>
          </div>
        </div>

        {/* Original Question Preserved */}
        <div
          style={{
            background: '#dbeafe',
            border: '2px dashed #2563eb',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 18
          }}
        >
          <div
            style={{
              fontFamily: 'Fredoka',
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#1d4ed8',
              marginBottom: 4
            }}
          >
            YOUR ORIGINAL QUESTION:
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b2e' }}>
            "{unlockData.original_question}"
          </div>
        </div>

        {/* Factual Gemini Answer */}
        <div
          style={{
            background: '#ffffff',
            border: '3px solid #10b981',
            borderRadius: 18,
            boxShadow: '4px 4px 0px #10b981',
            padding: 20,
            marginBottom: 22
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: 8
            }}
          >
            <CheckCircle2 size={20} color="#10b981" />
            <span
              style={{
                fontFamily: 'Fredoka',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#047857'
              }}
            >
              VERIFIED ANSWER (POWERED BY GEMINI)
            </span>
          </div>
          <div
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.6,
              color: '#1e1b2e',
              whiteSpace: 'pre-line'
            }}
          >
            {unlockData.actual_answer}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              sound.playVictory();
              onClose();
            }}
            className="pill-btn pill-btn-blue"
            style={{ width: '100%', padding: '12px 24px', fontSize: '0.95rem' }}
          >
            CONTINUE CHATTING WITH VADAKKUNOKKI
          </button>
        </div>
      </div>
    </div>
  );
};
