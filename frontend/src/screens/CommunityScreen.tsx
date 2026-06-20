import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import type { CommunityPost } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

const COMMUNITY_POSTS: CommunityPost[] = [
  { id: '1', type: 'success_story', title: 'We met on Gostart 💛', body: '"We matched in December, went on our first date at a café, and now we\'re planning our first trip together. Gostart really works!"', author: 'Priya & Rohan', emoji: '💑', likes: 247 },
  { id: '2', type: 'tip', title: 'Dating Tip of the Week', body: 'Be specific in your first message. Instead of \'hey\', try referencing something from their profile — it shows you actually read it.', author: 'Gostart Team', emoji: '💡', likes: 89 },
  { id: '3', type: 'success_story', title: '3 months strong! 🎉', body: '"I was sceptical about dating apps but Gostart was different. The verified profiles made me feel safe, and I found Kabir within a week!"', author: 'Meera, Delhi', emoji: '❤️', likes: 312 },
  { id: '4', type: 'tip', title: 'Making your profile shine', body: 'Add your actual personality to your bio — not just your job title. Mention a weird hobby, a favourite book, or a funny opinion. Be real!', author: 'Gostart Team', emoji: '✨', likes: 156 },
];

export default function CommunityScreen() {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(COMMUNITY_POSTS.map((p) => [p.id, p.likes])),
  );
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    if (liked[id]) return; // already liked — no-op
    setLiked((prev) => ({ ...prev, [id]: true }));
    setLikeCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />
      <View>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Stories, tips & love in the making</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {COMMUNITY_POSTS.map((post) => (
          <View key={post.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.emojiCircle, post.type === 'success_story' && styles.emojiCircleStory]}>
                <Text style={styles.emojiText}>{post.emoji}</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardType}>{post.type === 'success_story' ? 'Success Story' : 'Dating Tip'}</Text>
                <Text style={styles.cardAuthor}>{post.author}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardBody}>{post.body}</Text>
            <TouchableOpacity style={styles.likeRow} onPress={() => toggleLike(post.id)} activeOpacity={liked[post.id] ? 1 : 0.7}>
              <Ionicons
                name={liked[post.id] ? 'heart' : 'heart-outline'}
                size={16}
                color={liked[post.id] ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.likeCount, liked[post.id] && { color: COLORS.primary }]}>
                {likeCounts[post.id]}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 30 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold, paddingHorizontal: 24, paddingTop: 0 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 24, marginBottom: 40 },
  scroll: { paddingHorizontal: 24 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.sm },
  emojiCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  emojiCircleStory: { backgroundColor: 'rgba(196, 30, 58, 0.12)' },
  emojiText: { fontSize: 20 },
  cardMeta: { flex: 1 },
  cardType: { color: COLORS.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardAuthor: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  cardBody: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: SPACING.md },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeCount: { color: COLORS.textMuted, fontSize: 13 },
});
