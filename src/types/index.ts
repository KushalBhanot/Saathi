export type Subject = 'Math' | 'Science' | 'English';

export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ModelQuality = 'fast' | 'smart' | 'expert';

export type Language =
  | 'English'
  | 'Hindi'
  | 'Spanish'
  | 'Swahili'
  | 'French'
  | 'Bengali';

export type MessageRole = 'user' | 'assistant';

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  pending?: boolean;
  thinking?: string;
  actualModel?: string;
  usedFallback?: boolean;
  quiz?: QuizQuestion[]; // populated when this message has a quiz attached
  quizAnswers?: Record<number, number>; // questionIndex -> chosen option index
}

export interface QueuedQuestion {
  id: string;
  subject: Subject;
  grade: Grade;
  question: string;
  timestamp: number;
  historySnapshot: import('../services/gemmaService').GemmaMessage[];
}

export interface ProgressEntry {
  subject: Subject;
  topicsAsked: string[];
  messageCount: number;
  lastActive: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalDays: number;
}

export type RootStackParamList = {
  SubjectPicker: undefined;
  Chat: {
    subject: Subject;
    grade: Grade;
    model: ModelQuality;
    language: Language;
  };
};
