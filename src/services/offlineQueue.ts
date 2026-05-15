import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedQuestion, Subject } from '../types';

const QUEUE_KEY = 'edureach:offline_queue';

export async function enqueueQuestion(
  subject: Subject,
  question: string,
): Promise<QueuedQuestion> {
  const entry: QueuedQuestion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    subject,
    question,
    timestamp: Date.now(),
  };

  const existing = await getQueue();
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
