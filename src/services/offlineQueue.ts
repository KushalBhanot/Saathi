import AsyncStorage from '@react-native-async-storage/async-storage';
import { GemmaMessage } from './gemmaService';
import { Grade, QueuedQuestion, Subject } from '../types';

const QUEUE_KEY = 'edureach:offline_queue';
const MAX_QUEUE_SIZE = 20; // prevent unbounded growth

export async function enqueueQuestion(
  subject: Subject,
  grade: Grade,
  question: string,
  historySnapshot: GemmaMessage[],
): Promise<QueuedQuestion> {
  const entry: QueuedQuestion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    subject,
    grade,
    question,
    timestamp: Date.now(),
    historySnapshot,
  };

  const existing = await getQueue();

  // Edge case: cap queue size to prevent unbounded growth
  if (existing.length >= MAX_QUEUE_SIZE) {
    console.warn('Offline queue full — dropping oldest item');
    existing.shift();
  }

  // Edge case: dedup by question content to prevent duplicate answers on double-flush
  const isDuplicate = existing.some(
    (q) => q.subject === subject && q.question === question,
  );
  if (isDuplicate) return entry;

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, entry]));
  return entry;
}

export async function getQueue(): Promise<QueuedQuestion[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const existing = await getQueue();
  const updated = existing.filter((q) => q.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
