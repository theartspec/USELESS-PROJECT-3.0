import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { ChatResponse } from '../services/api';
import { VadakkunokkiAvatar } from './VadakkunokkiAvatar';
import { Compass, Gamepad2, Send, Home, Flame, Coins, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { sound } from '../services/sound';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  type: string;
  mood?: string;
  text?: string | null;
  game?: string | null;
  challenge_id?: string | null;
  target_score?: number | null;
  time_limit?: number | null;
}

interface ChatViewProps {
  sessionId: string;
  onLaunchGame: (gameType: string, challengeId: string) => void;
  onBackToLanding: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  sessionId,
  onLaunchGame,
  onBackToLanding
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      type: 'greeting',
      mood: 'sarcastic',
      text: "I know the answer to any question you could ever ask. But whether you deserve to hear it is another story. Go ahead, ask!"
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMood, setCurrentMood] = useState<string>('sarcastic');
  const [characterState, setCharacterState] = useState<string>('IDLE');
  const [streakCount, setStreakCount] = useState<number>(4);
  const [coinsScore, setCoinsScore] = useState<number>(240);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Angry input deletion animation (FR-035)
  const animateInputDeletion = (originalText: string) => {
    let current = originalText;
    sound.playAngryBuzz();
    const interval = setInterval(() => {
      if (current.length > 0) {
        current = current.slice(0, -1);
        setInputText(current);
        sound.playMove();
      } else {
        clearInterval(interval);
      }
    }, 45);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || loading) return;

    sound.playBlip();

    const userMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      type: 'question',
      text: clean
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setCharacterState('THINKING');

    try {
      const res: ChatResponse = await api.sendChatMessage(sessionId, clean);
      setCurrentMood(res.mood);
      setCharacterState(res.character_state || 'IDLE');

      if (res.action === 'delete_input') {
        setInputText(clean);
        setTimeout(() => animateInputDeletion(clean), 300);
      }

      const assistantMsg: MessageItem = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        type: res.type,
        mood: res.mood,
        text: res.message,
        game: res.game,
        challenge_id: res.challenge_id,
        target_score: res.target_score,
        time_limit: res.time_limit
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (res.type === 'game') {
        sound.playVictory();
      } else if (res.type === 'answer') {
        sound.playVictory();
        setStreakCount(prev => prev + 1);
        setCoinsScore(prev => prev + 100);
      } else if (res.type === 'ragebait' || res.type === 'refusal') {
        sound.playAngryBuzz();
      } else {
        sound.playBlip();
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Server error occurred.';
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          type: 'error',
          mood: 'chaotic',
          text: `Uh oh. ${errText}`
        }
      ]);
      setCharacterState('CONFUSED');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-desktop-wrapper">
      {/* Desktop Mac Window Frame */}
      <div className="mac-window chat-desktop-window">
        {/* Titlebar with Traffic Lights & URL */}
        <div className="mac-titlebar">
          <div className="traffic-dots">
            <div className="traffic-dot dot-red" />
            <div className="traffic-dot dot-yellow" />
            <div className="traffic-dot dot-green" />
          </div>
          <div className="window-url-bar">
            <Compass size={13} color="#6366f1" />
            <span>https://vadakkunokki.ai/chat</span>
          </div>
          <div className="desktop-status-pill">
            <span className="live-dot" /> ACTIVE SESSION
          </div>
        </div>

        {/* Desktop Header Navigation (No Separate Games Tab) */}
        <header className="app-topbar">
          <div className="brand-header-left">
            <span className="brand-logo-icon">🧭</span>
            <div>
              <div className="brand-title">VADAKKUNOKKI AI</div>
              <div className="brand-subtitle font-malayalam">വടക്കുനോക്കി.ai</div>
            </div>
          </div>

          <nav className="top-tabs" aria-label="Primary Navigation">
            <button
              onClick={onBackToLanding}
              className="top-tab-btn"
              title="Return to Home Page"
            >
              <Home size={14} style={{ display: 'inline', marginRight: 4 }} /> HOME
            </button>
            <button className="top-tab-btn active" title="Current Page: Chat">
              CHAT / ASK
            </button>
          </nav>

          <div className="header-stats-row">
            <div className="stat-pill streak-pill" title="Ragebait Survival Streak">
              <Flame size={14} /> Streak x{streakCount}
            </div>
            <div className="stat-pill score-pill" title="Earned Coins">
              <Coins size={14} /> Score {coinsScore}
            </div>
          </div>
        </header>

        {/* Character Status Bar */}
        <div className="chat-character-status-bar">
          <div className="char-status-info">
            <div className="char-status-avatar-wrap">
              <VadakkunokkiAvatar
                mood={currentMood}
                characterState={characterState}
                size={40}
                interactive={false}
              />
            </div>
            <div>
              <div className="char-name-title">Vadakkunokki AI (വടക്കുനോക്കി)</div>
              <div className="char-mood-indicator">
                Current Mood: <strong style={{ textTransform: 'uppercase' }}>{currentMood}</strong> • State: <span>{characterState}</span>
              </div>
            </div>
          </div>

          <div className="game-redirect-hint">
            💡 <em>Games are unlocked only when Vadakkunokki challenges you in chat!</em>
          </div>
        </div>

        {/* Desktop Message Stream Area */}
        <div className="chat-messages-container">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-message-row ${msg.sender === 'user' ? 'row-user' : 'row-assistant'}`}
            >
              <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-assistant'} ${msg.type === 'game' ? 'bubble-game-challenge' : ''}`}>
                {/* Message Header */}
                <div className="bubble-header">
                  <span className="bubble-sender-name">
                    {msg.sender === 'user' ? 'You' : 'Vadakkunokki'}
                  </span>
                  {msg.type === 'answer' && (
                    <span className="badge-verified-answer">
                      <CheckCircle2 size={13} /> GEMINI VERIFIED ANSWER
                    </span>
                  )}
                  {msg.type === 'game' && (
                    <span className="badge-game-challenge">
                      <Gamepad2 size={13} /> IN-CHAT CHALLENGE GATE
                    </span>
                  )}
                  {msg.type === 'ragebait' && (
                    <span className="badge-ragebait">
                      <ShieldAlert size={13} /> RAGEBAIT TEST
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="bubble-text">
                  {msg.text || '...'}
                </div>

                {/* In-Chat Game Challenge Redirection Card */}
                {msg.type === 'game' && msg.game && msg.challenge_id && (
                  <div className="in-chat-game-card">
                    <div className="game-card-header">
                      <Gamepad2 size={18} color="#eab308" />
                      <strong>Vadakkunokki has locked your answer behind a game!</strong>
                    </div>
                    <p className="game-card-desc">
                      Game: <strong>{
                        msg.game === 'speed_math' ? 'Speed Math Rage (3 Questions)' :
                        msg.game === 'bubble_shooter' ? 'Bubble Shooter' :
                        msg.game === 'science_quiz' ? 'Science Quiz (3 Questions)' :
                        msg.game === 'tic_tac_toe' ? 'Tic-Tac-Toe' :
                        'Arcade Challenge'
                      }</strong>
                      <br />
                      Win this challenge to compel Vadakkunokki to deliver the full truth.
                    </p>
                    <button
                      type="button"
                      onClick={() => onLaunchGame(msg.game!, msg.challenge_id!)}
                      className="pill-btn pill-btn-yellow game-launch-btn"
                    >
                      <Gamepad2 size={18} /> PLAY CHALLENGE TO UNLOCK ANSWER
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-loading-indicator">
              <RefreshCw size={16} className="spinner-icon" />
              <span>Vadakkunokki is evaluating your inquiry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Retro Arcade Chat Console (Bottom Input) */}
        <div className="chat-input-area">
          <div className="arcade-console">
            <div className="console-button-row">
              <div className="console-dots-group">
                <div className="arcade-btn-circle btn-c-mint" />
                <div className="arcade-btn-circle btn-c-blue" />
              </div>
              <div className="console-nameplate">VADAKKUNOKKI CONSOLE</div>
              <div className="console-dots-group">
                <div className="arcade-btn-circle btn-c-yellow" />
                <div className="arcade-btn-circle btn-c-coral" />
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="console-input-dock">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Vadakkunokki anything in English, Malayalam, or Manglish..."
                className="console-textarea"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="console-send-btn"
                title="Send Message (Enter)"
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
