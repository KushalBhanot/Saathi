import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressEntry, Subject } from '../types';

const PROGRESS_KEY = 'edureach:progress';

export async function getProgress(): Promise<Record<Subject, ProgressEntry>> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export async function recordQuestion(
  subject: Subject,
  question: string,
): Promise<void> {
  const progress = await getProgress();
  const entry = progress[subject];

  // Keep the last 20 unique topic snippets (first 40 chars of each question)
  const snippet = question.slice(0, 40);
  const topics = [snippet, ...entry.topicsAsked].slice(0, 20);

  progress[subject] = {
    ...entry,
    topicsAsked: topics,
    messageCount: entry.messageCount + 1,
    lastActive: Date.now(),
  };

  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function defaultProgress(): Record<Subject, ProgressEntry> {
  const subjects: Subject[] = ['Math', 'Science', 'English'];
  return Object.fromEntries(
    subjects.map((s) => [
      s,
      { subject: s, topicsAsked: [], messageCount: 0, lastActive: 0 },
    ]),
  ) as unknown as Record<Subject, ProgressEntry>;
}
