import React from 'react';

/**
 * Clean, static retro grid backdrop.
 * All ripples, shockwaves, and physics distortions have been removed.
 * Character-based hover reactions are handled exclusively by VadakkunokkiAvatar.
 */
export const WaveGridCanvas: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: '#ebe7f6',
        backgroundImage: `
          linear-gradient(rgba(180, 172, 212, 0.35) 1px, transparent 1px),
          linear-gradient(90deg, rgba(180, 172, 212, 0.35) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px'
      }}
    />
  );
};

export default WaveGridCanvas;
