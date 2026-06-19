import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';
import { getConversations } from '../services/api';
import type { Conversation, MessagesStackParamList } from '../types';

type Props = StackScreenProps<MessagesStackParamList, 'MessagesList'>;

export default function MessagesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      if (data.success) setConversations(data.conversations);
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  };

  const formatTime = (timestamp: string): string => {
    const diffHours = Math.floor((Date.now() - new Date(timestamp).getTime()) / 3_600_000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const renderConversation: ListRenderItem<Conversation> = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id, match: item.profile as any })}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.profile.photo }} style={styles.avatar} />
        {item.profile.verified && (
          <View style={styles.verifiedDot}>
            <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
          </View>
        )}
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.profileName}>{item.profile.name}, {item.profile.age}</Text>
          <Text style={styles.timestamp}>{item.lastMessage ? formatTime(item.lastMessage.timestamp) : ''}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage?.text ?? 'Say hello 👋'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={50} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Find your match to start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 140 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  verifiedDot: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.background, borderRadius: 8, padding: 1 },
  verifiedIcon: { width: 12, height: 12 },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  profileName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  timestamp: { color: COLORS.textMuted, fontSize: 12 },
  lastMessage: { color: COLORS.textSecondary, fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginTop: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
