import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ListRenderItem, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';
import { getConversation, sendMessage } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Message, MessagesStackParamList } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<MessagesStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { conversationId, match } = route.params;
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const data = await getConversation(conversationId);
      if (data.success) setMessages(data.conversation.messages);
    } catch {
      /* silent fail */
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    const optimistic: Message = {
      id: `local_${Date.now()}`,
      senderId: user?.id ?? 'user_demo',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setSending(true);
    try {
      await sendMessage(conversationId, text);
    } catch {
      /* optimistic message stays */
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg: Message) => msg.senderId === (user?.id ?? 'user_demo');

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const mine = isMyMessage(item);
    return (
      <View style={[styles.messageRow, mine ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>{item.text}</Text>
          <Text style={styles.timeText}>
            {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileTrigger}
          onPress={() => navigation.navigate('MatchProfile', { profile: match })}
          activeOpacity={0.8}
        >
          <Image source={{ uri: match.photo }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{match.name}, {match.age}</Text>
            <Text style={styles.headerSub}>{match.city} · {match.distance}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  backBtn: { padding: 4 },
  profileTrigger: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12 },
  messagesList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: 8 },
  messageRow: { marginBottom: 6 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: BORDER_RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.cardBorder },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMine: { color: '#fff' },
  textTheirs: { color: COLORS.textPrimary },
  timeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  input: { flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.textPrimary, fontSize: 15, maxHeight: 120, borderWidth: 1, borderColor: COLORS.cardBorder },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.cardBorder },
});
