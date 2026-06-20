import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS, CONTENT_MAX_WIDTH } from '../theme';
import { getConversations } from '../services/api';
import type { Conversation, MessagesStackParamList } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<MessagesStackParamList, 'MessagesList'>;

export default function MessagesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch every time the screen is focused so newly started conversations
  // (from a match or the carousel) always appear in the list.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getConversations()
        .then((data) => { if (active && data.success) setConversations(data.conversations); })
        .catch(() => { /* show empty state */ })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, []),
  );

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
    <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={() => navigation.navigate('MatchesCarousel')}
          activeOpacity={0.8}
        >
          <Ionicons name="albums-outline" size={18} color={COLORS.textPrimary} />
          <Text style={styles.galleryBtnText}>Matches</Text>
        </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 0, paddingBottom: 40, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  galleryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  galleryBtnText: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.medium },
  list: { paddingHorizontal: 24, paddingBottom: 140, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
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
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.displayBold, marginTop: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
