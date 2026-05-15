import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProgress } from '../services/progressService';
import { ProgressEntry, RootStackParamList, Subject } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SubjectPicker'>;
};

const SUBJECTS: {
  key: Subject;
  emoji: string;
  color: string;
  bg: string;
  desc: string;
}[] = [
  {
    key: 'Math',
    emoji: '➕',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'Numbers, fractions, geometry and more',
  },
  {
    key: 'Science',
    emoji: '🔬',
    color: '#059669',
    bg: '#D1FAE5',
    desc: 'Plants, animals, space, and experiments',
  },
  {
    key: 'English',
    emoji: '📖',
    color: '#D97706',
    bg: '#FEF3C7',
    desc: 'Reading, writing, grammar and vocabulary',
  },
];

export function SubjectPickerScreen({ navigation }: Props) {
  const [progress, setProgress] = useState<Record<
    Subject,
    ProgressEntry
  > | null>(null);

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌍 EduReach</Text>
          <Text style={styles.tagline}>
            Your personal AI tutor — works anywhere
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Choose a subject</Text>

        {SUBJECTS.map((subject) => {
          const count = progress?.[subject.key]?.messageCount ?? 0;
          return (
            <TouchableOpacity
              key={subject.key}
              style={[styles.card, { borderLeftColor: subject.color }]}
              onPress={() =>
                navigation.navigate('Chat', { subject: subject.key })
              }
              activeOpacity={0.85}
            >
              <View style={[styles.emojiBox, { backgroundColor: subject.bg }]}>
                <Text style={styles.emoji}>{subject.emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.subjectName, { color: subject.color }]}>
                  {subject.key}
                </Text>
                <Text style={styles.subjectDesc}>{subject.desc}</Text>
                {count > 0 && (
                  <Text style={styles.questionCount}>
                    {count} question{count !== 1 ? 's' : ''} asked
                  </Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Questions are saved offline and answered when you reconnect
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  scroll: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 36 },
  logo: { fontSize: 28, fontWeight: '700', color: '#1C1917', marginBottom: 6 },
  tagline: { fontSize: 15, color: '#78716C', lineHeight: 22 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A29E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  cardText: { flex: 1 },
  subjectName: { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  subjectDesc: { fontSize: 13, color: '#78716C', lineHeight: 18 },
  questionCount: { fontSize: 12, color: '#A8A29E', marginTop: 4 },
  arrow: { fontSize: 24, color: '#D4D0CB' },
  footer: {
    marginTop: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
  },
  footerText: { fontSize: 13, color: '#15803D', lineHeight: 20 },
});
