import React, { useRef, useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface BubbleShooterProps {
  sessionId: string;
  challengeId: string;
  targetScore?: number;
  timeLimit?: number;
  isAngry?: boolean;
  onWin: () => void;
  onFail: (msg: string) => void;
}

interface Bubble {
  x: number;
  y: number;
  color: string;
  active: boolean;
}

const COLORS = ['#fb7185', '#38bdf8', '#facc15', '#4ade80', '#c084fc'];

export const BubbleShooterGame: React.FC<BubbleShooterProps> = ({
  sessionId,
  challengeId,
  targetScore = 200,
  timeLimit = 30,
  isAngry: _isAngry = false,
  onWin,
  onFail
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const bubblesRef = useRef<Bubble[]>([]);
  const shooterRef = useRef<{
    angle: number;
    currentColor: string;
    bullet: { x: number; y: number; vx: number; vy: number; color: string; active: boolean } | null;
  }>({
    angle: -Math.PI / 2,
    currentColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    bullet: null
  });

  const width = 340;
  const height = 400;
  const radius = 17;

  // Initialize bubbles
  const resetBoard = useCallback(() => {
    const bubbles: Bubble[] = [];
    const rows = 4;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (radius * 2 + 4) + radius + 12;
        const y = r * (radius * 2 + 4) + radius + 14;
        bubbles.push({
          x,
          y,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          active: true
        });
      }
    }
    bubblesRef.current = bubbles;
    setScore(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
  }, [timeLimit]);

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  const handleEndGame = useCallback(async (finalScore: number) => {
    setGameOver(true);
    try {
      const res = await api.submitGameResult(sessionId, challengeId, finalScore, finalScore >= targetScore);
      if (res.status === 'WON') {
        sound.playVictory();
        onWin();
      } else {
        sound.playDefeat();
        onFail(res.message);
      }
    } catch {
      onFail('Verification error. Try again.');
    }
  }, [sessionId, challengeId, targetScore, onWin, onFail]);

  // Timer
  useEffect(() => {
    if (gameOver || isPaused) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndGame(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, isPaused, score, handleEndGame]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Cream background
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, width, height);

      // Active bubbles
      bubblesRef.current.forEach(b => {
        if (!b.active) return;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = '#1e1b2e';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Shiny glint
        ctx.beginPath();
        ctx.arc(b.x - radius * 0.35, b.y - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      });

      // Flying bullet
      const shooter = shooterRef.current;
      if (shooter.bullet && shooter.bullet.active) {
        shooter.bullet.x += shooter.bullet.vx;
        shooter.bullet.y += shooter.bullet.vy;

        if (shooter.bullet.x - radius <= 0 || shooter.bullet.x + radius >= width) {
          shooter.bullet.vx *= -1;
        }

        ctx.beginPath();
        ctx.arc(shooter.bullet.x, shooter.bullet.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = shooter.bullet.color;
        ctx.fill();
        ctx.strokeStyle = '#1e1b2e';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        let hit = false;
        if (shooter.bullet.y - radius <= 0) {
          hit = true;
        } else {
          for (const b of bubblesRef.current) {
            if (!b.active) continue;
            const dx = shooter.bullet.x - b.x;
            const dy = shooter.bullet.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < radius * 2) {
              hit = true;
              break;
            }
          }
        }

        if (hit) {
          const newBubble: Bubble = {
            x: shooter.bullet.x,
            y: shooter.bullet.y,
            color: shooter.bullet.color,
            active: true
          };

          const matchingNeighbors: Bubble[] = [];
          bubblesRef.current.forEach(b => {
            if (!b.active) return;
            const dx = newBubble.x - b.x;
            const dy = newBubble.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < radius * 2.8 && b.color === newBubble.color) {
              matchingNeighbors.push(b);
            }
          });

          if (matchingNeighbors.length >= 1) {
            sound.playBubblePop();
            matchingNeighbors.forEach(m => (m.active = false));
            const points = (matchingNeighbors.length + 1) * 60;
            setScore(prev => {
              const next = prev + points;
              if (next >= targetScore && !gameOver) {
                setTimeout(() => handleEndGame(next), 300);
              }
              return next;
            });
          } else {
            bubblesRef.current.push(newBubble);
          }

          shooter.bullet = null;
          shooter.currentColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }

      // Bottom cannon (Matches Mockup 4)
      const cannonX = width / 2;
      const cannonY = height - 28;

      ctx.save();
      ctx.translate(cannonX, cannonY);
      ctx.rotate(shooter.angle);

      // Cannon barrel
      ctx.fillStyle = '#60a5fa';
      ctx.strokeStyle = '#1e1b2e';
      ctx.lineWidth = 3;
      ctx.fillRect(-12, -38, 24, 38);
      ctx.strokeRect(-12, -38, 24, 38);
      ctx.restore();

      // Cannon base
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, radius + 2, 0, Math.PI * 2);
      ctx.fillStyle = shooter.currentColor;
      ctx.fill();
      ctx.strokeStyle = '#1e1b2e';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (!gameOver && !isPaused) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cannonX = width / 2;
      const cannonY = height - 28;
      const angle = Math.atan2(mouseY - cannonY, mouseX - cannonX);
      if (angle < -0.2 && angle > -Math.PI + 0.2) {
        shooterRef.current.angle = angle;
      }
    };

    const handleClick = () => {
      if (gameOver || isPaused || shooterRef.current.bullet) return;
      sound.playMove();
      const speed = 12;
      const angle = shooterRef.current.angle;
      shooterRef.current.bullet = {
        x: width / 2,
        y: height - 28,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: shooterRef.current.currentColor,
        active: true
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameOver, isPaused, targetScore, handleEndGame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      {/* Header Banner (Matches Mockup 4) */}
      <div style={{ textAlign: 'center' }}>
        <div className="font-bubble" style={{ fontSize: '0.85rem', color: '#1e1b2e' }}>
          VADAKKUNOKKI BUBBLES
        </div>
        <h2 className="bubbly-title-3d" style={{ fontSize: '1.8rem', letterSpacing: 1 }}>
          BUBBLE SHOOTER
        </h2>
      </div>

      {/* Target Badge */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', width: '100%', maxWidth: 340 }}>
        <div className="stat-pill" style={{ color: '#ca8a04' }}>
          🎯 TARGET: {targetScore} PTS
        </div>
        <div className="stat-pill" style={{ color: timeLeft <= 5 ? '#ef4444' : '#2563eb' }}>
          ⏱️ TIME: {timeLeft}s
        </div>
      </div>

      {/* Bubble Canvas Frame */}
      <div
        style={{
          border: '3.5px solid #1e1b2e',
          borderRadius: 18,
          boxShadow: '4px 4px 0px #1e1b2e',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ cursor: 'crosshair', display: 'block' }}
        />
        {/* Bottom stats row inside frame (Matches Mockup) */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '2.5px solid #1e1b2e',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="font-bubble" style={{ fontSize: '0.9rem', color: '#1e1b2e' }}>
            SCORE: {score}
          </div>
          <div className="font-bubble" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            STAGE: 01
          </div>
        </div>
      </div>

      {/* Bottom Buttons (Matches Mockup) */}
      <div style={{ display: 'flex', gap: 14 }}>
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="pill-btn pill-btn-blue"
          style={{ fontSize: '0.85rem', padding: '10px 22px' }}
        >
          {isPaused ? 'Resume' : 'Pause Match'}
        </button>
        <button
          onClick={resetBoard}
          className="pill-btn pill-btn-yellow"
          style={{ fontSize: '0.85rem', padding: '10px 22px' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
};
