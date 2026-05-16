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

// Design tokens
const BG = '#F4F4FA';
const SURFACE = '#EEEEF8';
const CARD = '#FFFFFF';
const INDIGO = '#6366F1';
const INDIGO_DK = '#4338CA';
const INDIGO_BG = '#EEF2FF';
const TEXT_HI = '#0F0F1A';
const TEXT_LO = '#9898B8';
const BORDER = '#EEEEF0';

const SUBJECTS: {
  key: Subject;
  emoji: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  desc: string;
}[] = [
  {
    key: 'Math',
    emoji: '➕',
    iconBg: '#EEF2FF',
    badgeBg: '#EEF2FF',
    badgeText: INDIGO_DK,
    desc: 'Numbers, fractions & geometry',
  },
  {
    key: 'Science',
    emoji: '🔬',
    iconBg: '#ECFDF5',
    badgeBg: '#ECFDF5',
    badgeText: '#065F46',
    desc: 'Plants, animals, space & experiments',
  },
  {
    key: 'English',
    emoji: '📖',
    iconBg: '#FFF7ED',
    badgeBg: '#FFF7ED',
    badgeText: '#9A3412',
    desc: 'Reading, writing & vocabulary',
  },
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as Grade[];
const LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];
const MODELS = Object.keys(MODEL_CONFIG) as ModelQuality[];

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

  const go = (subject: Subject) =>
    navigation.navigate('Chat', {
      subject,
      grade: selectedGrade,
      model: selectedModel,
      language: selectedLang,
    });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Brand + hero */}
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>EduReach</Text>
          </View>
          <Text style={styles.heading}>
            Learn <Text style={styles.headingAccent}>anything,</Text>
            {'\n'}anywhere.
          </Text>
          <Text style={styles.sub}>
            Grades 1–10 · 6 languages · works even offline ✦
          </Text>
        </View>

        {/* Grade */}
        <Text style={styles.sectionLabel}>Your Grade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.gradePill,
                selectedGrade === g && styles.gradePillOn,
              ]}
              onPress={() => setSelectedGrade(g)}
            >
              <Text
                style={[
                  styles.gradePillText,
                  selectedGrade === g && styles.gradePillTextOn,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Language */}
        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Language</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.langPill,
                selectedLang === lang && styles.langPillOn,
              ]}
              onPress={() => setSelectedLang(lang)}
            >
              <Text style={styles.langFlag}>{LANGUAGE_CONFIG[lang].flag}</Text>
              <Text
                style={[
                  styles.langText,
                  selectedLang === lang && styles.langTextOn,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tutor speed */}
        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>
          Tutor Speed
        </Text>
        <View style={styles.modelRow}>
          {MODELS.map((m) => {
            const cfg = MODEL_CONFIG[m];
            const on = selectedModel === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modelCard, on && styles.modelCardOn]}
                onPress={() => setSelectedModel(m)}
              >
                <Text style={styles.modelEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.modelLabel, on && styles.modelLabelOn]}>
                  {cfg.label}
                </Text>
                <Text style={styles.modelDesc}>{cfg.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject heading */}
        <View style={styles.subjectHeadRow}>
          <Text style={styles.subjectHeadTitle}>Choose a Subject</Text>
          <Text style={styles.subjectHeadHint}>tap to start →</Text>
        </View>

        {/* Subject cards */}
        {SUBJECTS.map((s) => {
          const count = progress?.[s.key]?.messageCount ?? 0;
          return (
            <TouchableOpacity
              key={s.key}
              style={styles.subjectCard}
              onPress={() => go(s.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.subjectIcon, { backgroundColor: s.iconBg }]}>
                <Text style={styles.subjectEmoji}>{s.emoji}</Text>
              </View>
              <View style={styles.subjectBody}>
                <Text style={styles.subjectName}>{s.key}</Text>
                <Text style={styles.subjectDesc}>{s.desc}</Text>
                {count > 0 && (
                  <View style={[styles.badge, { backgroundColor: s.badgeBg }]}>
                    <Text style={[styles.badgeText, { color: s.badgeText }]}>
                      🔥 {count} question{count !== 1 ? 's' : ''} asked
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.subjectArrow}>›</Text>
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Questions save offline and answer when you reconnect
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },

  // Hero
  hero: { paddingTop: 10, paddingBottom: 24 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: INDIGO },
  brandName: {
    fontSize: 11,
    fontWeight: '800',
    color: INDIGO,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT_HI,
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 8,
  },
  headingAccent: { color: INDIGO },
  sub: { fontSize: 13, color: TEXT_LO, lineHeight: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TEXT_LO,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  pillRow: { gap: 8, paddingRight: 4 },

  // Grade
  gradePill: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gradePillOn: { backgroundColor: INDIGO_BG, borderColor: INDIGO },
  gradePillText: { fontSize: 15, fontWeight: '700', color: TEXT_LO },
  gradePillTextOn: { color: INDIGO_DK },

  // Language
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langPillOn: { backgroundColor: INDIGO_BG, borderColor: INDIGO },
  langFlag: { fontSize: 18 },
  langText: { fontSize: 13, fontWeight: '600', color: TEXT_LO },
  langTextOn: { color: INDIGO_DK },

  // Model
  modelRow: { flexDirection: 'row', gap: 10 },
  modelCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modelCardOn: { backgroundColor: INDIGO_BG, borderColor: INDIGO },
  modelEmoji: { fontSize: 22, marginBottom: 4 },
  modelLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_HI,
    marginBottom: 2,
  },
  modelLabelOn: { color: INDIGO_DK },
  modelDesc: {
    fontSize: 10,
    color: TEXT_LO,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Subject heading
  subjectHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
  },
  subjectHeadTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TEXT_HI,
    letterSpacing: -0.3,
  },
  subjectHeadHint: { fontSize: 13, color: TEXT_LO, fontWeight: '500' },

  // Subject cards
  subjectCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INDIGO,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  subjectIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectEmoji: { fontSize: 26 },
  subjectBody: { flex: 1 },
  subjectName: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_HI,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subjectDesc: {
    fontSize: 12,
    color: TEXT_LO,
    lineHeight: 17,
    marginBottom: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  subjectArrow: { fontSize: 26, color: '#D4D0F0', marginRight: 2 },

  // Footer
  footer: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  footerText: {
    fontSize: 13,
    color: TEXT_LO,
    lineHeight: 20,
    textAlign: 'center',
  },
});
