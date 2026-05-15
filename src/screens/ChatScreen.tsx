import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleMarkdown } from '../components/SimpleMarkdown';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { GemmaMessage, askGemma } from '../services/gemmaService';
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

const CHAT_HISTORY_KEY = (subject: string) => `edureach:chat:${subject}`;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
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
  const { subject } = route.params;
  const accentColor = SUBJECT_COLORS[subject] ?? '#7C3AED';
  const { isOnline } = useNetworkStatus();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAT_HISTORY_KEY(subject)).then((raw) => {
      if (raw) setMessages(JSON.parse(raw));
    });
    getQueue().then((q) =>
      setQueueLength(q.filter((item) => item.subject === subject).length),
    );
  }, [subject]);

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(CHAT_HISTORY_KEY(subject), JSON.stringify(messages));
    }
  }, [messages, subject]);

  // Flush offline queue when back online
  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      const queue = await getQueue();
      const subjectQueue = queue.filter((q) => q.subject === subject);
      if (subjectQueue.length === 0) return;

      for (const item of subjectQueue) {
        setMessages((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, pending: false } : m)),
        );
        try {
          const currentMessages = messages.filter((m) => !m.pending);
          const history = buildGemmaHistory(currentMessages);
          const answer = await askGemma(subject, history, item.question);
          const assistantMsg: Message = {
            id: `${item.id}-reply`,
            role: 'assistant',
            content: answer,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          await removeFromQueue(item.id);
          setQueueLength((n) => Math.max(0, n - 1));
        } catch (e) {
          console.warn('Failed to flush queued item:', e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY(subject));
    setMessages([]);
  }, [subject]);

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
      await enqueueQuestion(subject, text);
      setQueueLength((n) => n + 1);
      return;
    }

    setIsLoading(true);
    try {
      const history = buildGemmaHistory(messages);
      const answer = await askGemma(subject, history, text);
      const assistantMsg: Message = {
        id: `${Date.now()}-reply`,
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Try again in a moment!",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isOnline, messages, subject]);

  // Set header with online status dot + clear button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? '#10B981' : '#F59E0B' },
            ]}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isOnline, clearHistory]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
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
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.bubbleUser, { backgroundColor: accentColor }]
                : styles.bubbleAssistant,
              item.pending && styles.bubblePending,
            ]}
          >
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
          </View>
        </View>
        {/* Timestamp below bubble */}
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.timestampUser : styles.timestampAssistant,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {!isOnline && <OfflineBanner queueLength={queueLength} />}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
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
              I'll explain it simply, step by step.
            </Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size='small' color={accentColor} />
          <Text style={[styles.typingText, { color: accentColor }]}>
            Thinking...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask a ${subject} question…`}
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

  // Header
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
  },
  clearBtnText: { fontSize: 12, color: '#78716C', fontWeight: '500' },

  // Message layout
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
  bubbleTextUser: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  pendingLabel: { fontSize: 11, color: '#FBBF24', marginTop: 4 },

  // Timestamps
  timestamp: {
    fontSize: 11,
    color: '#A8A29E',
    marginTop: 3,
    marginHorizontal: 4,
  },
  timestampUser: { textAlign: 'right' },
  timestampAssistant: { marginLeft: 40, textAlign: 'left' },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: { fontSize: 13, fontWeight: '500' },

  // Input
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

  // Empty state
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1917' },
  emptySubtitle: { fontSize: 14, color: '#78716C' },
});
