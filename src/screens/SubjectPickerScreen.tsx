import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MODEL_CONFIG, LANGUAGE_CONFIG } from '../services/gemmaService';
import { getProgress } from '../services/progressService';
import {
  Grade,
  Language,
  ModelQuality,
  ProgressEntry,
  RootStackParamList,
  Subject,
} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SubjectPicker'>;
};

const ACCENT = '#4338CA';

const SUBJECTS: {
  key: Subject;
  emoji: string;
  ghostEmoji: string;
  color: string;
  bg: string;
  textColor: string;
  desc: string;
}[] = [
  {
    key: 'Math',
    emoji: '➕',
    ghostEmoji: '🔢',
    color: '#7C3AED',
    bg: '#EDE9FE',
    textColor: '#5B21B6',
    desc: 'Numbers, fractions & geometry',
  },
  {
    key: 'Science',
    emoji: '🔬',
    ghostEmoji: '🚀',
    color: '#059669',
    bg: '#ECFDF5',
    textColor: '#065F46',
    desc: 'Plants, animals, space & experiments',
  },
  {
    key: 'English',
    emoji: '📖',
    ghostEmoji: '✍️',
    color: '#D97706',
    bg: '#FFFBEB',
    textColor: '#92400E',
    desc: 'Reading, writing & vocabulary',
  },
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as Grade[];
const LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];
const MODELS = Object.keys(MODEL_CONFIG) as ModelQuality[];

const HEADER_DECO = [
  { emoji: '📚', top: 14, right: 18, size: 36, opacity: 0.38, rotate: '12deg' },
  { emoji: '✏️', top: 60, right: 72, size: 26, opacity: 0.28, rotate: '-8deg' },
  { emoji: '🔭', top: 10, right: 106, size: 30, opacity: 0.26, rotate: '5deg' },
  { emoji: '🧮', top: 86, right: 18, size: 28, opacity: 0.3, rotate: '-12deg' },
  { emoji: '🎓', top: 50, right: 150, size: 28, opacity: 0.22, rotate: '8deg' },
  { emoji: '⭐', top: 100, right: 90, size: 22, opacity: 0.36, rotate: '0deg' },
  { emoji: '🌈', top: 90, right: 152, size: 24, opacity: 0.2, rotate: '-5deg' },
];

export function SubjectPickerScreen({ navigation }: Props) {
  const [selectedGrade, setSelectedGrade] = useState<Grade>(5);
  const [selectedModel, setSelectedModel] = useState<ModelQuality>('fast');
  const [selectedLang, setSelectedLang] = useState<Language>('English');
  const [progress, setProgress] = useState<Record<
    Subject,
    ProgressEntry
  > | null>(null);

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  const handleSubjectPress = (subject: Subject) => {
    navigation.navigate('Chat', {
      subject,
      grade: selectedGrade,
      model: selectedModel,
      language: selectedLang,
    });
  };

  return (
    // SafeAreaView uses ACCENT so status bar area matches the indigo header on iOS
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {/* ── Indigo header ── */}
        <View style={styles.header}>
          {HEADER_DECO.map((d, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                top: d.top,
                right: d.right,
                fontSize: d.size,
                opacity: d.opacity,
                transform: [{ rotate: d.rotate }],
              }}
            >
              {d.emoji}
            </Text>
          ))}
          <Text style={styles.globe}>🌍</Text>
          <Text style={styles.appName}>EduReach</Text>
          <Text style={styles.tagline}>
            Your personal AI tutor{'\n'}works anywhere, even offline ✨
          </Text>
        </View>

        {/* ── White card pulls up over header ── */}
        <View style={styles.card}>
          {/* Grade */}
          <Text style={styles.sectionLabel}>Your Grade</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gradeRow}
          >
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradePill,
                  selectedGrade === g && styles.gradePillActive,
                ]}
                onPress={() => setSelectedGrade(g)}
              >
                <Text
                  style={[
                    styles.gradePillText,
                    selectedGrade === g && styles.gradePillTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Language */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langRow}
          >
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langPill,
                  selectedLang === lang && styles.langPillActive,
                ]}
                onPress={() => setSelectedLang(lang)}
              >
                <Text style={styles.langFlag}>
                  {LANGUAGE_CONFIG[lang].flag}
                </Text>
                <Text
                  style={[
                    styles.langText,
                    selectedLang === lang && styles.langTextActive,
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tutor speed */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
            Tutor Speed
          </Text>
          <View style={styles.modelRow}>
            {MODELS.map((m) => {
              const cfg = MODEL_CONFIG[m];
              const sel = selectedModel === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modelCard, sel && styles.modelCardActive]}
                  onPress={() => setSelectedModel(m)}
                >
                  <Text style={styles.modelEmoji}>{cfg.emoji}</Text>
                  <Text
                    style={[styles.modelLabel, sel && styles.modelLabelActive]}
                  >
                    {cfg.label}
                  </Text>
                  <Text style={styles.modelDesc}>{cfg.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subject heading */}
          <View style={styles.subjectHeading}>
            <Text style={styles.subjectHeadingTitle}>Choose a Subject</Text>
            <Text style={styles.subjectHeadingHint}>tap to start →</Text>
          </View>

          {/* Subject cards */}
          {SUBJECTS.map((s) => {
            const count = progress?.[s.key]?.messageCount ?? 0;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.subjectCard, { backgroundColor: s.bg }]}
                onPress={() => handleSubjectPress(s.key)}
                activeOpacity={0.82}
              >
                <Text style={styles.subjectGhost}>{s.ghostEmoji}</Text>
                <View
                  style={[styles.subjectIconBox, { backgroundColor: s.color }]}
                >
                  <Text style={styles.subjectIconEmoji}>{s.emoji}</Text>
                </View>
                <View style={styles.subjectBody}>
                  <Text style={[styles.subjectName, { color: s.textColor }]}>
                    {s.key}
                  </Text>
                  <Text style={styles.subjectDesc}>{s.desc}</Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.progressTag,
                        { backgroundColor: s.color + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.progressTagText, { color: s.color }]}
                      >
                        🔥 {count} question{count !== 1 ? 's' : ''} asked
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subjectArrow, { color: s.color }]}>›</Text>
              </TouchableOpacity>
            );
          })}

          {/* Footer tip */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Questions save offline and answer when you reconnect
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SafeAreaView is ACCENT so the status bar area matches the indigo header
  safe: { flex: 1, backgroundColor: ACCENT },
  // ScrollView itself has white background below the card
  scroll: { backgroundColor: '#FAFAF9' },
  scrollContent: { paddingBottom: 32 },

  // Indigo header — no absolute positioned slab needed anymore
  header: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 56,
    minHeight: 190,
  },
  globe: { fontSize: 46, marginBottom: 4 },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },

  // White card — overflow hidden clips the rounded corners properly on iOS
  card: {
    backgroundColor: '#FAFAF9',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    padding: 24,
    paddingBottom: 12,
    overflow: 'hidden',
    // Shadow for the card lift effect
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Grade pills
  gradeRow: { gap: 8, paddingRight: 8 },
  gradePill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradePillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  gradePillText: { fontSize: 16, fontWeight: '700', color: '#78716C' },
  gradePillTextActive: { color: '#FFFFFF' },

  // Language pills
  langRow: { gap: 8, paddingRight: 8 },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#F5F5F4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langPillActive: { backgroundColor: '#EEF2FF', borderColor: ACCENT },
  langFlag: { fontSize: 18 },
  langText: { fontSize: 13, fontWeight: '600', color: '#78716C' },
  langTextActive: { color: ACCENT },

  // Model cards
  modelRow: { flexDirection: 'row', gap: 10 },
  modelCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelCardActive: { backgroundColor: '#EEF2FF', borderColor: ACCENT },
  modelEmoji: { fontSize: 22, marginBottom: 4 },
  modelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 2,
  },
  modelLabelActive: { color: ACCENT },
  modelDesc: {
    fontSize: 10,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Subject heading
  subjectHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 16,
  },
  subjectHeadingTitle: { fontSize: 20, fontWeight: '800', color: '#1C1917' },
  subjectHeadingHint: { fontSize: 13, color: '#A8A29E', fontWeight: '500' },

  // Subject cards
  subjectCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    minHeight: 114,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  subjectGhost: {
    position: 'absolute',
    right: -10,
    bottom: -14,
    fontSize: 88,
    opacity: 0.11,
  },
  subjectIconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  subjectIconEmoji: { fontSize: 28 },
  subjectBody: { flex: 1 },
  subjectName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  subjectDesc: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
    marginBottom: 6,
  },
  progressTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressTagText: { fontSize: 11, fontWeight: '700' },
  subjectArrow: { fontSize: 32, fontWeight: '300', marginRight: 2 },

  // Footer
  footer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#15803D',
    lineHeight: 20,
    textAlign: 'center',
  },
});
