export type Subject = 'Math' | 'Science' | 'English';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  pending?: boolean; // true when queued offline, awaiting send
}

export interface QueuedQuestion {
  id: string;
  subject: Subject;
  question: string;
  timestamp: number;
}

export interface ProgressEntry {
  subject: Subject;
  topicsAsked: string[];
  messageCount: number;
  lastActive: number;
}

export type RootStackParamList = {
  SubjectPicker: undefined;
  Chat: { subject: Subject };
};
