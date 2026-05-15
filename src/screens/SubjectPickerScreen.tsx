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

const GRADE_GROUPS = [
  { label: 'Primary', grades: [1, 2, 3, 4] as Grade[] },
  { label: 'Middle', grades: [5, 6, 7, 8] as Grade[] },
  { label: 'High', grades: [9, 10] as Grade[] },
];

const LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];
const MODELS = Object.keys(MODEL_CONFIG) as ModelQuality[];

export function SubjectPickerScreen({ navigation }: Props) {
  const [selectedGrade, setSelectedGrade] = useState<Grade>(5);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelQuality>('fast');
  const [selectedLang, setSelectedLang] = useState<Language>('English');
  const [progress, setProgress] = useState<Record<
    Subject,
    ProgressEntry
  > | null>(null);

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  const handleStart = () => {
    if (!selectedSubject) return;
    navigation.navigate('Chat', {
      subject: selectedSubject,
      grade: selectedGrade,
      model: selectedModel,
      language: selectedLang,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌍 EduReach</Text>
          <Text style={styles.tagline}>
            Your personal AI tutor — works anywhere
          </Text>
        </View>

        {/* Grade */}
        <Text style={styles.sectionLabel}>Select your grade</Text>
        <View style={styles.gradeContainer}>
          {GRADE_GROUPS.map((group) => (
            <View key={group.label} style={styles.gradeGroup}>
              <Text style={styles.gradeGroupLabel}>{group.label}</Text>
              <View style={styles.gradeRow}>
                {group.grades.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gradeBtn,
                      selectedGrade === g && styles.gradeBtnSelected,
                    ]}
                    onPress={() => setSelectedGrade(g)}
                  >
                    <Text
                      style={[
                        styles.gradeBtnText,
                        selectedGrade === g && styles.gradeBtnTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>Language</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.langScroll}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.langBtn,
                selectedLang === lang && styles.langBtnSelected,
              ]}
              onPress={() => setSelectedLang(lang)}
            >
              <Text style={styles.langFlag}>{LANGUAGE_CONFIG[lang].flag}</Text>
              <Text
                style={[
                  styles.langText,
                  selectedLang === lang && styles.langTextSelected,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Model */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          Tutor quality
        </Text>
        <View style={styles.modelRow}>
          {MODELS.map((m) => {
            const cfg = MODEL_CONFIG[m];
            const selected = selectedModel === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modelBtn, selected && styles.modelBtnSelected]}
                onPress={() => setSelectedModel(m)}
              >
                <Text style={styles.modelEmoji}>{cfg.emoji}</Text>
                <Text
                  style={[
                    styles.modelLabel,
                    selected && styles.modelLabelSelected,
                  ]}
                >
                  {cfg.label}
                </Text>
                <Text style={styles.modelDesc}>{cfg.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          Choose a subject
        </Text>
        {SUBJECTS.map((subject) => {
          const count = progress?.[subject.key]?.messageCount ?? 0;
          const isSelected = selectedSubject === subject.key;
          return (
            <TouchableOpacity
              key={subject.key}
              style={[
                styles.card,
                { borderLeftColor: subject.color },
                isSelected && { backgroundColor: subject.bg },
              ]}
              onPress={() => setSelectedSubject(subject.key)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.emojiBox,
                  { backgroundColor: isSelected ? '#fff' : subject.bg },
                ]}
              >
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
              {isSelected && (
                <Text style={[styles.checkmark, { color: subject.color }]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Start */}
        <TouchableOpacity
          style={[styles.startBtn, !selectedSubject && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!selectedSubject}
        >
          <Text style={styles.startBtnText}>
            {selectedSubject
              ? `Start Grade ${selectedGrade} ${selectedSubject} →`
              : 'Select a subject to start'}
          </Text>
        </TouchableOpacity>

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
  header: { marginBottom: 28 },
  logo: { fontSize: 28, fontWeight: '700', color: '#1C1917', marginBottom: 6 },
  tagline: { fontSize: 15, color: '#78716C', lineHeight: 22 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A29E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Grade
  gradeContainer: { marginBottom: 28, gap: 12 },
  gradeGroup: { gap: 8 },
  gradeGroupLabel: { fontSize: 12, color: '#78716C', fontWeight: '500' },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F4',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gradeBtnSelected: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  gradeBtnText: { fontSize: 15, fontWeight: '600', color: '#78716C' },
  gradeBtnTextSelected: { color: '#FFFFFF' },

  // Language
  langScroll: { marginBottom: 4 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langBtnSelected: { backgroundColor: '#EEF2FF', borderColor: '#7C3AED' },
  langFlag: { fontSize: 18 },
  langText: { fontSize: 13, fontWeight: '500', color: '#78716C' },
  langTextSelected: { color: '#7C3AED', fontWeight: '700' },

  // Model
  modelRow: { flexDirection: 'row', gap: 10 },
  modelBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modelBtnSelected: { backgroundColor: '#FAFAF9', borderColor: '#1C1917' },
  modelEmoji: { fontSize: 22, marginBottom: 4 },
  modelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 2,
  },
  modelLabelSelected: { color: '#1C1917' },
  modelDesc: {
    fontSize: 10,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Subjects
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
  checkmark: { fontSize: 22, fontWeight: '700' },

  // Start button
  startBtn: {
    backgroundColor: '#1C1917',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  startBtnDisabled: { backgroundColor: '#D4D0CB' },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  footer: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16 },
  footerText: { fontSize: 13, color: '#15803D', lineHeight: 20 },
});
