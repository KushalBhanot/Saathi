import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakData } from '../types';

const STREAK_KEY = 'edureach:streak';

function todayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function getStreak(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw)
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        totalDays: 0,
      };
    return JSON.parse(raw) as StreakData;
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalDays: 0,
    };
  }
}

/**
 * Call this whenever the student asks a question.
 * Returns the updated streak data.
 */
export async function recordActivity(): Promise<StreakData> {
  const streak = await getStreak();
  const today = todayString();

  // Already recorded today — no change
  if (streak.lastActiveDate === today) return streak;

  const isConsecutive = streak.lastActiveDate === yesterdayString();

  const updated: StreakData = {
    currentStreak: isConsecutive ? streak.currentStreak + 1 : 1,
    longestStreak: Math.max(
      streak.longestStreak,
      isConsecutive ? streak.currentStreak + 1 : 1,
    ),
    lastActiveDate: today,
    totalDays: streak.totalDays + 1,
  };

  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}
