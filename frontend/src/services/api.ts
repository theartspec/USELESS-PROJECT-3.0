const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

export interface ChatResponse {
  type: 'answer' | 'ragebait' | 'ask_back' | 'refusal' | 'game' | 'action' | 'silent' | 'error';
  mood: string;
  message?: string | null;
  action?: string | null;
  game?: string | null;
  challenge_id?: string | null;
  target_score?: number | null;
  target_condition?: string | null;
  time_limit?: number | null;
  character_state?: string;
  metadata?: Record<string, unknown>;
}

export interface StartupGreeting {
  session_id: string;
  mood: string;
  message: string;
  character_state: string;
}

export interface GameStartResponse {
  challenge_id: string;
  game: string;
  target_score?: number | null;
  target_condition?: string | null;
  time_limit?: number | null;
  status: string;
  game_state: Record<string, unknown>;
  instructions: string;
  taunt: string;
}

export interface GameValidationResponse {
  status: 'WON' | 'FAILED' | 'ACTIVE';
  answer_unlocked: boolean;
  score?: number;
  message: string;
  character_state: string;
}

export interface TicTacToeMoveResponse {
  board: string[][];
  status: 'ONGOING' | 'PLAYER_WIN' | 'AI_WIN' | 'DRAW';
  challenge_won: boolean;
  message: string;
  character_state: string;
}

export interface SpeedMathResponse {
  correct: boolean;
  correct_count: number;
  target_count: number;
  time_remaining: number;
  next_problem?: {
    problem_id: string;
    display: string;
    expected_answer: number;
    difficulty: number;
  } | null;
  status: 'ACTIVE' | 'WON' | 'FAILED';
  answer_unlocked: boolean;
  message: string;
}

export interface ScienceQuizResponse {
  correct: boolean;
  correct_count: number;
  total_questions: number;
  current_index: number;
  status: 'ACTIVE' | 'WON' | 'FAILED';
  answer_unlocked: boolean;
  message: string;
}

export interface AnswerUnlockResponse {
  personality_message: string;
  actual_answer: string;
  mood: string;
  original_question: string;
  character_state: string;
}

export const api = {
  async getStartupGreeting(): Promise<StartupGreeting> {
    const res = await fetch(`${API_BASE}/chat/startup`);
    if (!res.ok) throw new Error('Failed to load startup greeting');
    return res.json();
  },

  async sendChatMessage(sessionId: string, message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(err.detail || 'Chat request failed');
    }
    return res.json();
  },

  async startGame(sessionId: string, game?: string): Promise<GameStartResponse> {
    const res = await fetch(`${API_BASE}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, game })
    });
    if (!res.ok) throw new Error('Failed to start game challenge');
    return res.json();
  },

  async submitGameResult(sessionId: string, challengeId: string, score: number, clientWon: boolean): Promise<GameValidationResponse> {
    const res = await fetch(`${API_BASE}/game/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        challenge_id: challengeId,
        score,
        client_won: clientWon
      })
    });
    if (!res.ok) throw new Error('Validation failed');
    return res.json();
  },

  async submitTicTacToeMove(sessionId: string, challengeId: string, row: number, col: number): Promise<TicTacToeMoveResponse> {
    const res = await fetch(`${API_BASE}/game/ttt-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        challenge_id: challengeId,
        row,
        col
      })
    });
    if (!res.ok) throw new Error('Failed to submit move');
    return res.json();
  },

  async submitSpeedMathAnswer(sessionId: string, challengeId: string, problemId: string, answer: number): Promise<SpeedMathResponse> {
    const res = await fetch(`${API_BASE}/game/speed-math/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        challenge_id: challengeId,
        problem_id: problemId,
        answer
      })
    });
    if (!res.ok) throw new Error('Failed to submit math answer');
    return res.json();
  },

  async submitScienceQuizAnswer(sessionId: string, challengeId: string, questionIndex: number, selectedOption: number): Promise<ScienceQuizResponse> {
    const res = await fetch(`${API_BASE}/game/science-quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        challenge_id: challengeId,
        question_index: questionIndex,
        selected_option: selectedOption
      })
    });
    if (!res.ok) throw new Error('Failed to submit quiz answer');
    return res.json();
  },

  async unlockAnswer(sessionId: string, challengeId: string): Promise<AnswerUnlockResponse> {
    const res = await fetch(`${API_BASE}/challenge/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        challenge_id: challengeId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Answer is locked!' }));
      throw new Error(err.detail || 'Could not unlock answer');
    }
    return res.json();
  }
};
