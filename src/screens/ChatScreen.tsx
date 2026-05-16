import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleMarkdown } from '../components/SimpleMarkdown';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  GemmaMessage,
  MODEL_CONFIG,
  LANGUAGE_CONFIG,
  QuotaExceededError,
  askGemma,
} from '../services/gemmaService';
import {
  enqueueQuestion,
  getQueue,
  removeFromQueue,
} from '../services/offlineQueue';
import { recordQuestion } from '../services/progressService';
import { Message, RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

// Design tokens — mirrors SubjectPickerScreen
const BG = '#F4F4FA';
const INDIGO = '#6366F1';
const INDIGO_DK = '#4338CA';
const SURFACE = '#EEEEF8';
const TEXT_HI = '#0F0F1A';
const TEXT_LO = '#9898B8';

const MODEL_LABEL: Record<string, string> = {
  'gemini-2.5-flash': '⚡ Fast',
  'gemma-4-26b-a4b-it': '🧠 Smart',
  'gemma-4-31b-it': '🏆 Expert',
};

const CHAT_HISTORY_KEY = (subject: string, grade: number) =>
  `edureach:chat:${subject}:grade${grade}`;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours(),
    m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function buildGemmaHistory(messages: Message[]): GemmaMessage[] {
  return messages
    .filter((m) => !m.pending)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
}

export function ChatScreen({ navigation, route }: Props) {
  const { subject, grade, model, language } = route.params;
  const { isOnline } = useNetworkStatus();
  const storageKey = CHAT_HISTORY_KEY(subject, grade);
  const isGemmaModel = MODEL_CONFIG[model].isGemma;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deepThinking, setDeepThinking] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<
    Record<string, boolean>
  >({});
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) setMessages(JSON.parse(raw));
    });
    getQueue().then((q) =>
      setQueueLength(q.filter((i) => i.subject === subject).length),
    );
  }, [storageKey, subject]);

  useEffect(() => {
    if (messages.length > 0)
      AsyncStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      const queue = await getQueue();
      const sq = queue.filter(
        (q) => q.subject === subject && q.grade === grade,
      );
      if (!sq.length) return;
      for (const item of sq) {
        setMessages((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, pending: false } : m)),
        );
        try {
          const parsed = await askGemma(
            subject,
            grade,
            language,
            model,
            item.historySnapshot,
            item.question,
          );
          setMessages((prev) => [
            ...prev,
            {
              id: item.id + '-reply',
              role: 'assistant',
              content: parsed.answer,
              thinking: parsed.thinking ?? undefined,
              actualModel: parsed.actualModel,
              usedFallback: parsed.usedFallback,
              timestamp: Date.now(),
            },
          ]);
          await removeFromQueue(item.id);
          setQueueLength((n) => Math.max(0, n - 1));
        } catch (e) {
          console.warn('Flush failed:', e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const clearHistory = useCallback(async () => {
    Alert.alert('Clear chat?', 'All messages in this chat will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(storageKey);
          setMessages([]);
        },
      },
    ]);
  }, [storageKey]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    Clipboard.setString(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const explainDifferently = useCallback(async () => {
    if (isLoading || !isOnline) return;
    setIsLoading(true);
    try {
      const parsed = await askGemma(
        subject,
        grade,
        language,
        model,
        buildGemmaHistory(messages),
        'Please explain that differently using a different example or analogy.',
        deepThinking,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + '-re',
          role: 'assistant',
          content: parsed.answer,
          thinking: parsed.thinking ?? undefined,
          actualModel: parsed.actualModel,
          usedFallback: parsed.usedFallback,
          timestamp: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          timestamp: Date.now(),
          content:
            e instanceof QuotaExceededError
              ? "You've reached today's free AI limit. Come back tomorrow and keep learning! 🌙"
              : "Sorry, I couldn't connect right now. Try again in a moment!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    isOnline,
    messages,
    subject,
    grade,
    language,
    model,
    deepThinking,
  ]);

  useEffect(() => {
    navigation.setOptions({
      title: `G${grade} · ${subject}`,
      headerStyle: { backgroundColor: BG },
      headerShadowVisible: false,
      headerTintColor: TEXT_HI,
      headerTitleStyle: { fontWeight: '800', color: TEXT_HI },
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.headerBadge}>
            {MODEL_CONFIG[model].emoji}
            {LANGUAGE_CONFIG[language].flag}
          </Text>
          {isGemmaModel && (
            <Switch
              value={deepThinking}
              onValueChange={setDeepThinking}
              trackColor={{ false: SURFACE, true: INDIGO + '80' }}
              thumbColor={deepThinking ? INDIGO : TEXT_LO}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
            ]}
          />
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation,
    isOnline,
    clearHistory,
    grade,
    subject,
    model,
    language,
    deepThinking,
    isGemmaModel,
  ]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      pending: !isOnline,
    };
    setMessages((prev) => [...prev, userMsg]);
    await recordQuestion(subject, text);

    if (!isOnline) {
      await enqueueQuestion(subject, grade, text, buildGemmaHistory(messages));
      setQueueLength((n) => n + 1);
      return;
    }

    setIsLoading(true);
    try {
      const parsed = await askGemma(
        subject,
        grade,
        language,
        model,
        buildGemmaHistory(messages),
        text,
        deepThinking,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          role: 'assistant',
          content: parsed.answer,
          thinking: parsed.thinking ?? undefined,
          actualModel: parsed.actualModel,
          usedFallback: parsed.usedFallback,
          timestamp: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          timestamp: Date.now(),
          content:
            e instanceof QuotaExceededError
              ? "You've reached today's free AI limit. Come back tomorrow and keep learning! 🌙"
              : "Sorry, I couldn't connect right now. Try again in a moment!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    isOnline,
    messages,
    subject,
    grade,
    language,
    model,
    deepThinking,
  ]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isCopied = copiedId === item.id;
    const isLastAssistant =
      !isUser && messages.slice(index + 1).every((m) => m.role === 'user');
    const isThinkingExpanded = expandedThinking[item.id] ?? false;

    return (
      <View
        style={[
          styles.messageGroup,
          isUser ? styles.messageGroupUser : styles.messageGroupAssistant,
        ]}
      >
        <View
          style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
        >
          {!isUser && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          )}
          <TouchableWithoutFeedback
            onLongPress={() => copyToClipboard(item.content, item.id)}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant,
                item.pending && styles.bubblePending,
                isCopied && styles.bubbleCopied,
              ]}
            >
              {item.thinking && (
                <TouchableOpacity
                  onPress={() =>
                    setExpandedThinking((prev) => ({
                      ...prev,
                      [item.id]: !isThinkingExpanded,
                    }))
                  }
                  style={styles.thinkingHeader}
                >
                  <Text style={styles.thinkingHeaderText}>
                    {isThinkingExpanded ? '▾' : '▸'} Thinking process...
                  </Text>
                </TouchableOpacity>
              )}
              {item.actualModel && (
                <View
                  style={[
                    styles.modelBadge,
                    item.usedFallback && styles.modelBadgeFallback,
                  ]}
                >
                  <Text
                    style={[
                      styles.modelBadgeText,
                      item.usedFallback && styles.modelBadgeTextFallback,
                    ]}
                  >
                    {MODEL_LABEL[item.actualModel] ?? item.actualModel}
                    {item.usedFallback ? ' (Expert unavailable)' : ''}
                  </Text>
                </View>
              )}
              {item.thinking && isThinkingExpanded && (
                <View style={styles.thinkingBody}>
                  <Text style={styles.thinkingBodyText}>{item.thinking}</Text>
                </View>
              )}
              {isUser ? (
                <Text style={styles.bubbleTextUser}>{item.content}</Text>
              ) : (
                <SimpleMarkdown>{item.content}</SimpleMarkdown>
              )}
              {item.pending && (
                <Text style={styles.pendingLabel}>
                  ⏳ Queued — will send when online
                </Text>
              )}
              {isCopied && <Text style={styles.copiedLabel}>✓ Copied</Text>}
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View
          style={[
            styles.belowBubble,
            isUser ? styles.belowBubbleUser : styles.belowBubbleAssistant,
          ]}
        >
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          {isLastAssistant && !item.pending && (
            <TouchableOpacity
              onPress={explainDifferently}
              style={styles.reExplainBtn}
            >
              <Text style={styles.reExplainText}>↺ Explain differently</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {!isOnline && <OfflineBanner queueLength={queueLength} />}

      {deepThinking && isGemmaModel && (
        <View style={styles.deepThinkingBanner}>
          <Text style={styles.deepThinkingText}>
            🧩 Deep Thinking ON — tap ▸ on any response to see reasoning
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps='handled'
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>👋</Text>
              </View>
              <Text style={styles.emptyTitle}>
                Ask me anything about {subject}!
              </Text>
              <Text style={styles.emptySubtitle}>
                Grade {grade} · {MODEL_CONFIG[model].emoji}{' '}
                {MODEL_CONFIG[model].label} · {LANGUAGE_CONFIG[language].flag}{' '}
                {language}
              </Text>
            </View>
          }
        />

        {isLoading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size='small' color={INDIGO} />
            <Text style={styles.typingText}>
              {deepThinking ? 'Thinking deeply...' : 'Thinking...'}
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask a Grade ${grade} ${subject} question…`}
            placeholderTextColor={TEXT_LO}
            multiline
            maxLength={400}
            returnKeyType='send'
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const INDIGO_BG = '#EEF2FF';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  list: { padding: 16, paddingBottom: 8, gap: 4 },

  // Header
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  headerBadge: { fontSize: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 2 },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: SURFACE,
    borderRadius: 8,
    marginLeft: 2,
  },
  clearBtnText: { fontSize: 12, color: TEXT_LO, fontWeight: '600' },

  // Deep thinking banner
  deepThinkingBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: INDIGO_BG ?? '#EEF2FF',
  },
  deepThinkingText: { fontSize: 12, fontWeight: '600', color: INDIGO_DK },

  // Message layout
  messageGroup: { marginBottom: 8 },
  messageGroupUser: { alignItems: 'flex-end' },
  messageGroupAssistant: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },

  // Avatar
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: INDIGO,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    shadowColor: INDIGO,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bubblePending: { opacity: 0.6 },
  bubbleCopied: { opacity: 0.75 },
  bubbleTextUser: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  pendingLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  copiedLabel: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '600',
  },

  // Thinking accordion
  thinkingHeader: {
    paddingVertical: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF8',
  },
  thinkingHeaderText: {
    fontSize: 12,
    color: TEXT_LO,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  thinkingBody: {
    backgroundColor: BG,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  thinkingBodyText: {
    fontSize: 12,
    color: TEXT_LO,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Model badge
  modelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SURFACE,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
  },
  modelBadgeFallback: { backgroundColor: '#FEF3C7' },
  modelBadgeText: { fontSize: 11, color: TEXT_LO, fontWeight: '600' },
  modelBadgeTextFallback: { color: '#92400E' },

  // Below bubble
  belowBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
    paddingHorizontal: 4,
  },
  belowBubbleUser: { justifyContent: 'flex-end' },
  belowBubbleAssistant: { marginLeft: 40 },
  timestamp: { fontSize: 11, color: TEXT_LO },
  reExplainBtn: { paddingVertical: 2 },
  reExplainText: { fontSize: 12, fontWeight: '600', color: INDIGO },

  // Typing
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: { fontSize: 13, fontWeight: '500', color: INDIGO },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEF0',
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_HI,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Empty state
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: TEXT_HI },
  emptySubtitle: { fontSize: 13, color: TEXT_LO },
});
