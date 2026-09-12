import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../services/sound';

interface AvatarProps {
  mood: string;
  characterState: string;
  size?: number;
  interactive?: boolean;
  showPrinterPaper?: boolean;
  screenText?: string;
}

export const VadakkunokkiAvatar: React.FC<AvatarProps> = ({
  mood,
  characterState,
  size = 180,
  interactive = true,
  showPrinterPaper = false,
  screenText = 'An AI that thinks with you'
}) => {
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for pupil movement (FR-034)
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const maxOffset = 6;
      if (dist > 0) {
        setPupilOffset({
          x: Math.max(-maxOffset, Math.min(maxOffset, (deltaX / dist) * maxOffset)),
          y: Math.max(-maxOffset, Math.min(maxOffset, (deltaY / dist) * maxOffset))
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  let activeState = characterState.toUpperCase();
  if (isHovered && activeState === 'IDLE') {
    activeState = 'TAUNTING';
  }

  // Scale ratio
  const scale = size / 180;

  return (
    <div
      ref={avatarRef}
      onMouseEnter={() => {
        setIsHovered(true);
        sound.playBlip();
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        userSelect: 'none'
      }}
    >
      {/* Top Antenna */}
      <div style={{ position: 'relative', width: 20, height: 16, marginBottom: -2 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 8, width: 3, height: 10, background: '#1e1b2e' }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 5,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: activeState === 'ANGRY' ? '#ef4444' : '#38bdf8',
            border: '2px solid #1e1b2e'
          }}
        />
      </div>

      {/* Main CRT Robot Body */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Main Blue Curved Monitor */}
        <div
          style={{
            width: 170,
            height: 125,
            background: '#8ec5f0',
            border: '3.5px solid #1e1b2e',
            borderRadius: '24px 24px 18px 18px',
            boxShadow: '4px 4px 0px #1e1b2e',
            padding: '10px 12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          {/* Inner Dark Screen Face */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: activeState === 'ANGRY' ? '#3b1828' : '#231e3d',
              border: '2.5px solid #1e1b2e',
              borderRadius: 14,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {/* Screen Text or Face Elements */}
            {screenText && showPrinterPaper ? (
              <div
                style={{
                  fontFamily: 'Fredoka',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  textAlign: 'center',
                  padding: '0 8px',
                  lineHeight: 1.3
                }}
              >
                {screenText}
              </div>
            ) : (
              <>
                {/* Eyebrows */}
                <div style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 14,
                      height: 3,
                      background: '#ffffff',
                      borderRadius: 2,
                      transform:
                        activeState === 'ANGRY'
                          ? 'rotate(20deg)'
                          : activeState === 'SAD' || activeState === 'CRYING'
                          ? 'rotate(-20deg)'
                          : 'none'
                    }}
                  />
                  <div
                    style={{
                      width: 14,
                      height: 3,
                      background: '#ffffff',
                      borderRadius: 2,
                      transform:
                        activeState === 'ANGRY'
                          ? 'rotate(-20deg)'
                          : activeState === 'SAD' || activeState === 'CRYING'
                          ? 'rotate(20deg)'
                          : 'none'
                    }}
                  />
                </div>

                {/* Animated Eyes with Pupil Tracking */}
                <div style={{ display: 'flex', gap: 22, marginBottom: 6 }}>
                  {/* Left Eye */}
                  <div
                    style={{
                      width: 18,
                      height: activeState === 'ANGRY' ? 8 : activeState === 'CRYING' ? 12 : 18,
                      background: '#ffffff',
                      borderRadius: '50%',
                      border: '2px solid #1e1b2e',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        background: '#1e1b2e',
                        borderRadius: '50%',
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                        transition: 'transform 0.05s ease-out'
                      }}
                    />
                  </div>

                  {/* Right Eye */}
                  <div
                    style={{
                      width: 18,
                      height: activeState === 'ANGRY' ? 8 : activeState === 'CRYING' ? 12 : 18,
                      background: '#ffffff',
                      borderRadius: '50%',
                      border: '2px solid #1e1b2e',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        background: '#1e1b2e',
                        borderRadius: '50%',
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                        transition: 'transform 0.05s ease-out'
                      }}
                    />
                  </div>
                </div>

                {/* Mouth */}
                <div>
                  {activeState === 'HAPPY' || activeState === 'VICTORY' ? (
                    <div
                      style={{
                        width: 20,
                        height: 9,
                        background: '#f43f5e',
                        borderRadius: '0 0 12px 12px',
                        border: '1.5px solid #ffffff'
                      }}
                    />
                  ) : activeState === 'TAUNTING' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 16, height: 4, background: '#ffffff', borderRadius: 2 }} />
                      <div
                        style={{
                          width: 8,
                          height: 6,
                          background: '#f43f5e',
                          borderRadius: '0 0 6px 6px',
                          marginTop: -1
                        }}
                      />
                    </div>
                  ) : activeState === 'SAD' || activeState === 'CRYING' || activeState === 'DEFEATED' ? (
                    <div
                      style={{
                        width: 18,
                        height: 6,
                        borderTop: '3px solid #ffffff',
                        borderRadius: '10px 10px 0 0'
                      }}
                    />
                  ) : activeState === 'ANGRY' ? (
                    <div
                      style={{
                        width: 16,
                        height: 5,
                        background: '#ef4444',
                        border: '1.5px solid #ffffff'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 14,
                        height: 3,
                        background: '#ffffff',
                        borderRadius: 2
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side Camera Lens (from mockup) */}
        <div
          style={{
            position: 'absolute',
            right: -16,
            top: 36,
            width: 22,
            height: 48,
            background: '#64748b',
            border: '3px solid #1e1b2e',
            borderRadius: '0 10px 10px 0',
            boxShadow: '2px 2px 0px #1e1b2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: 8,
              height: 24,
              background: '#38bdf8',
              borderRadius: '0 4px 4px 0',
              border: '1.5px solid #1e1b2e'
            }}
          />
        </div>
      </div>

      {/* Printer Paper Receipt Output (from mockup) */}
      {showPrinterPaper && (
        <div
          style={{
            marginTop: -6,
            width: 110,
            background: '#ffffff',
            border: '2px solid #1e1b2e',
            boxShadow: '2px 2px 0px #1e1b2e',
            padding: '6px 8px',
            borderRadius: '0 0 4px 4px',
            fontFamily: 'VT323',
            fontSize: '0.82rem',
            lineHeight: 1.1,
            color: '#1e1b2e',
            textAlign: 'center',
            zIndex: 3
          }}
        >
          <div>VADAKKUNOKKI</div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>STATUS: ONLINE</div>
          <div
            style={{
              height: 8,
              background: 'repeating-linear-gradient(90deg, #1e1b2e 0, #1e1b2e 2px, transparent 2px, transparent 3px)',
              marginTop: 4
            }}
          />
        </div>
      )}

      {/* Mood Badge */}
      {!showPrinterPaper && (
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontFamily: 'Fredoka',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '2px 10px',
              borderRadius: 12,
              background: '#93c5fd',
              color: '#1e1b2e',
              border: '1.5px solid #1e1b2e',
              boxShadow: '1.5px 1.5px 0px #1e1b2e',
              textTransform: 'uppercase'
            }}
          >
            {mood}
          </span>
        </div>
      )}
    </div>
  );
};
