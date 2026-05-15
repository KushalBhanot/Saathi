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

const SUBJECT_COLORS: Record<string, string> = {
  Math: '#7C3AED',
  Science: '#059669',
  English: '#D97706',
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
  const accentColor = SUBJECT_COLORS[subject] ?? '#7C3AED';
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
      const subjectQueue = queue.filter(
        (q) => q.subject === subject && q.grade === grade,
      );
      if (!subjectQueue.length) return;
      for (const item of subjectQueue) {
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
    Alert.alert('Clear chat?', 'This will delete all messages in this chat.', [
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
      const history = buildGemmaHistory(messages);
      const parsed = await askGemma(
        subject,
        grade,
        language,
        model,
        history,
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
          timestamp: Date.now(),
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
              trackColor={{ false: '#E7E5E4', true: accentColor + '80' }}
              thumbColor={deepThinking ? accentColor : '#A8A29E'}
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
    accentColor,
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
      const historySnapshot = buildGemmaHistory(messages);
      await enqueueQuestion(subject, grade, text, historySnapshot);
      setQueueLength((n) => n + 1);
      return;
    }

    setIsLoading(true);
    try {
      const history = buildGemmaHistory(messages);
      const parsed = await askGemma(
        subject,
        grade,
        language,
        model,
        history,
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
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content:
            "Sorry, I couldn't connect right now. Try again in a moment!",
          timestamp: Date.now(),
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
            <View style={[styles.avatar, { backgroundColor: accentColor }]}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          )}
          <TouchableWithoutFeedback
            onLongPress={() => copyToClipboard(item.content, item.id)}
          >
            <View
              style={[
                styles.bubble,
                isUser
                  ? [styles.bubbleUser, { backgroundColor: accentColor }]
                  : styles.bubbleAssistant,
                item.pending && styles.bubblePending,
                isCopied && styles.bubbleCopied,
              ]}
            >
              {/* Deep thinking accordion */}
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
              <Text style={[styles.reExplainText, { color: accentColor }]}>
                ↺ Explain differently
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {!isOnline && <OfflineBanner queueLength={queueLength} />}

      {/* Deep thinking banner */}
      {deepThinking && isGemmaModel && (
        <View
          style={[
            styles.deepThinkingBanner,
            { backgroundColor: accentColor + '15' },
          ]}
        >
          <Text style={[styles.deepThinkingText, { color: accentColor }]}>
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
              <Text style={styles.emptyEmoji}>👋</Text>
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
            <ActivityIndicator size='small' color={accentColor} />
            <Text style={[styles.typingText, { color: accentColor }]}>
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
            placeholderTextColor='#A8A29E'
            multiline
            maxLength={400}
            returnKeyType='send'
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: accentColor },
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF9' },
  list: { padding: 16, paddingBottom: 8, gap: 4 },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  headerBadge: { fontSize: 16 },
  thinkingToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  thinkingLabel: { fontSize: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 2 },
  statusText: { fontSize: 12, fontWeight: '600' },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
    marginLeft: 2,
  },
  clearBtnText: { fontSize: 12, color: '#78716C', fontWeight: '500' },

  deepThinkingBanner: { paddingHorizontal: 16, paddingVertical: 8 },
  deepThinkingText: { fontSize: 12, fontWeight: '500' },

  messageGroup: { marginBottom: 8 },
  messageGroupUser: { alignItems: 'flex-end' },
  messageGroupAssistant: { alignItems: 'flex-start' },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubblePending: { opacity: 0.65 },
  bubbleCopied: { opacity: 0.75 },
  bubbleTextUser: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  pendingLabel: { fontSize: 11, color: '#FBBF24', marginTop: 4 },
  copiedLabel: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '600',
  },

  // Deep thinking accordion
  thinkingHeader: {
    paddingVertical: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDEC',
  },
  thinkingHeaderText: {
    fontSize: 12,
    color: '#A8A29E',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  thinkingBody: {
    backgroundColor: '#FAFAF9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  thinkingBodyText: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  belowBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
    paddingHorizontal: 4,
  },
  belowBubbleUser: { justifyContent: 'flex-end' },
  belowBubbleAssistant: { marginLeft: 40 },

  timestamp: { fontSize: 11, color: '#A8A29E' },
  reExplainBtn: { paddingVertical: 2 },
  reExplainText: { fontSize: 12, fontWeight: '600' },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: { fontSize: 13, fontWeight: '500' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    backgroundColor: '#FAFAF9',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1917',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1917' },
  emptySubtitle: { fontSize: 13, color: '#A8A29E' },
});
