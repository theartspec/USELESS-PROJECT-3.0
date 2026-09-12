import React, { useState } from 'react';
import { VadakkunokkiAvatar } from './VadakkunokkiAvatar';
import { sound } from '../services/sound';

interface ExitModalProps {
  onStay: () => void;
  onExit: () => void;
}

export const ExitModal: React.FC<ExitModalProps> = ({ onStay, onExit }) => {
  const [hoverTarget, setHoverTarget] = useState<'none' | 'stay' | 'exit'>('none');

  // Dynamic emotional expressions based on cursor hover
  let characterState = 'SAD';
  let characterMood = 'sad';
  let speechText = "Wait... you're seriously leaving me here? You haven't unlocked all my answers yet!";

  if (hoverTarget === 'exit') {
    characterState = 'CRYING';
    characterMood = 'sad';
    speechText = "NOOO! Don't leave me alone in this 8-bit void! I promise I won't ragebait you as much!";
  } else if (hoverTarget === 'stay') {
    characterState = 'HAPPY';
    characterMood = 'happy';
    speechText = "YES! I knew you couldn't resist my challenges! Let's keep playing!";
  }

  return (
    <div className="modal-backdrop">
      <div
        className="mac-window"
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 24,
          textAlign: 'center',
          background: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Living Avatar that actively tracks mouse cursor */}
        <div style={{ margin: '8px 0 16px' }}>
          <VadakkunokkiAvatar
            mood={characterMood}
            characterState={characterState}
            size={140}
            interactive={true}
          />
        </div>

        <h3
          className="font-bubble"
          style={{ fontSize: '1.4rem', color: '#1e1b2e', marginBottom: 8 }}
        >
          {hoverTarget === 'exit'
            ? "WAIT... DON'T GO!"
            : hoverTarget === 'stay'
            ? 'GREAT CHOICE!'
            : "WAIT... YOU'RE LEAVING?!"}
        </h3>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#4b5563',
            lineHeight: 1.5,
            marginBottom: 24,
            minHeight: 48,
            fontStyle: 'italic',
            fontWeight: 600
          }}
        >
          "{speechText}"
        </p>

        {/* Buttons with reactive hover listeners */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* I'll Stay Button */}
          <button
            onMouseEnter={() => {
              setHoverTarget('stay');
              sound.playBlip();
            }}
            onMouseLeave={() => setHoverTarget('none')}
            onClick={() => {
              sound.playVictory();
              onStay();
            }}
            className="pill-btn pill-btn-blue"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            I'LL STAY & PLAY
          </button>

          {/* Leave Anyway Button */}
          <button
            onMouseEnter={() => {
              setHoverTarget('exit');
              sound.playAngryBuzz();
            }}
            onMouseLeave={() => setHoverTarget('none')}
            onClick={() => {
              sound.playMove();
              onExit();
            }}
            className="pill-btn"
            style={{
              background: '#fecdd3',
              color: '#9f1239',
              padding: '12px 24px',
              fontSize: '0.95rem'
            }}
          >
            LEAVE ANYWAY
          </button>
        </div>
      </div>
    </div>
  );
};
