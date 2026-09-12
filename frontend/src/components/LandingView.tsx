import React from 'react';
import { VadakkunokkiAvatar } from './VadakkunokkiAvatar';
import { MessageSquare, Sparkles, Flame, Coins, Zap, ShieldAlert, Trophy, Compass } from 'lucide-react';
import { sound } from '../services/sound';

interface LandingViewProps {
  onStartChat: () => void;
  startupMessage: string;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartChat,
  startupMessage
}) => {
  const handleStartChatClick = () => {
    try {
      sound.playVictory();
    } catch {
      // ignore
    }
    onStartChat();
  };

  return (
    <div className="landing-desktop-wrapper">
      {/* Full Desktop Main Window Container */}
      <div className="mac-window landing-desktop-window">
        {/* Desktop Titlebar with Traffic Lights & URL */}
        <div className="mac-titlebar">
          <div className="traffic-dots">
            <div className="traffic-dot dot-red" />
            <div className="traffic-dot dot-yellow" />
            <div className="traffic-dot dot-green" />
          </div>
          <div className="window-url-bar">
            <Compass size={13} color="#6366f1" />
            <span>https://vadakkunokki.ai/home</span>
          </div>
          <div className="desktop-status-pill">
            <span className="live-dot" /> LIVE • GEMINI 2.5 FLASH
          </div>
        </div>

        {/* Global Desktop Navigation Header (No Separate Games Tab) */}
        <header className="app-topbar">
          <div className="brand-header-left">
            <span className="brand-logo-icon">🧭</span>
            <div>
              <div className="brand-title">VADAKKUNOKKI AI</div>
              <div className="brand-subtitle font-malayalam">വടക്കുനോക്കി.ai</div>
            </div>
          </div>

          <nav className="top-tabs" aria-label="Primary Navigation">
            <button className="top-tab-btn active" title="Current Page: Home">
              HOME
            </button>
            <button
              onClick={handleStartChatClick}
              className="top-tab-btn"
              title="Start Chat with Vadakkunokki"
            >
              CHAT / ASK
            </button>
          </nav>

          <div className="header-stats-row">
            <div className="stat-pill streak-pill" title="Current Ragebait Survival Streak">
              <Flame size={14} /> Streak x4
            </div>
            <div className="stat-pill score-pill" title="Patience Score">
              <Coins size={14} /> Score 240
            </div>
          </div>
        </header>

        {/* Desktop Hero Section */}
        <main className="landing-hero-container">
          {/* Left Column: Headline, Taunt, Description & CTA */}
          <div className="hero-content-left">
            <div className="hero-tag-badge">
              <Zap size={14} /> THE INCONVENIENCE IS THE FEATURE
            </div>

            <h1 className="bubbly-title-3d hero-main-heading">
              VADAKKU
              <br />
              NOKKI
            </h1>

            <p className="hero-malayalam-subtitle font-malayalam">
              നിങ്ങൾക്ക് ഉത്തരം വേണമെങ്കിൽ... പണിയെടുത്തു വാങ്ങിക്കോ!
            </p>

            {/* Sarcastic Dialogue Bubble */}
            <div className="sarcastic-speech-card">
              <div className="speech-sender-label">Vadakkunokki says:</div>
              <div className="speech-quote">
                "{startupMessage || 'I know the exact answers to all questions... but whether you deserve to hear it is another story!'}"
              </div>
            </div>

            {/* Descriptive Pitch */}
            <p className="hero-explanation">
              Ask anything in <strong>English, Malayalam, or Manglish</strong>. Powered by{' '}
              <span className="gemini-highlight">Google Gemini 2.5 Flash</span>. Vadakkunokki will challenge your patience with sarcastic ragebaits and in-chat gaming trials before unlocking the certified truth.
            </p>

            {/* Prominent CTA */}
            <div className="hero-cta-group">
              <button
                type="button"
                onClick={handleStartChatClick}
                className="pill-btn pill-btn-blue desktop-cta-btn"
              >
                <MessageSquare size={22} /> START CHATTING NOW
              </button>
              <div className="cta-footnote">
                ⚡ Answers guaranteed after 2–4 turns of interaction or mini-game victory.
              </div>
            </div>
          </div>

          {/* Right Column: Character with Cursor Hovering Response */}
          <div className="hero-character-right">
            {/* Ambient Sticker Decorations */}
            <div className="sticker-spider" aria-hidden="true">
              <div className="spider-thread" />
              <div className="spider-body">
                <span className="spider-eye" />
                <span className="spider-eye" />
              </div>
            </div>

            <div className="sticker-sparkles" aria-hidden="true">
              <Sparkles size={32} color="#f59e0b" fill="#fef08a" />
            </div>

            <div className="sticky-note-sticker hero-sticky-top" aria-hidden="true">
              Sarcasm Core v2.5 ✨
            </div>

            {/* Interactive Avatar Container (Eyes follow mouse on desktop) */}
            <div className="avatar-stage">
              <div className="avatar-pedestal" />
              <VadakkunokkiAvatar
                mood="sarcastic"
                characterState="IDLE"
                size={220}
                interactive={true}
                showPrinterPaper={true}
                screenText="Ask a question... if you dare."
              />
            </div>

            {/* Sub-avatar ticket sticker */}
            <div className="avatar-meta-row">
              <div className="retro-ticket-badge">
                <div className="ticket-title">AI STATUS</div>
                <div>MOOD: SARCASTIC</div>
                <div>API: GEMINI 2.5 FLASH</div>
                <div className="ticket-barcode">||||| ||| |||| |</div>
              </div>
              <div className="avatar-hover-hint">
                <span className="hint-pulse">👁️</span> Hover or move your mouse around me!
              </div>
            </div>
          </div>
        </main>

        {/* Feature Cards Grid (How It Works) */}
        <section className="landing-features-grid" aria-label="How Vadakkunokki Works">
          <div className="feature-card">
            <div className="feature-icon-box box-coral">
              <ShieldAlert size={22} />
            </div>
            <div className="feature-card-content">
              <h3>1. Sarcastic Ragebait</h3>
              <p>Vadakkunokki will interrogate your assumptions, tease you in Malayalam or English, and test your patience.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box box-yellow">
              <Trophy size={22} />
            </div>
            <div className="feature-card-content">
              <h3>2. In-Chat Game Gates</h3>
              <p>When challenged during the conversation, solve Speed Math or beat Tic-Tac-Toe to immediately unlock the answer!</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box box-mint">
              <Sparkles size={22} />
            </div>
            <div className="feature-card-content">
              <h3>3. Gemini 2.5 Flash Truth</h3>
              <p>Every inquiry is backed by real knowledge. Once you survive the challenge or beg properly, the real answer is yours.</p>
            </div>
          </div>
        </section>

        {/* Desktop Footer */}
        <footer className="landing-desktop-footer">
          <div>
            Built with <strong>React + TypeScript + FastAPI</strong> • Powered by{' '}
            <span className="gemini-highlight">Google Gemini 2.5 Flash</span>
          </div>
          <div>© 2026 Vadakkunokki AI (വടക്കുനോക്കി.ai) — All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default LandingView;
