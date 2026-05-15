export type Subject = 'Math' | 'Science' | 'English';

export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  pending?: boolean;
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

export type RootStackParamList = {
  SubjectPicker: undefined;
  Chat: { subject: Subject; grade: Grade };
};
