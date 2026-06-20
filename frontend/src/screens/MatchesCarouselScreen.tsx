// Matched-profiles carousel — browse everyone you've matched with, one at a
// time, navigating with on-screen arrows or (on web) the ← / → arrow keys.
// Tap "Message" to jump straight into that conversation.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
  StatusBar, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { getMyMatches } from '../services/api';
import type { MessagesStackParamList, MatchSummary } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<MessagesStackParamList, 'MatchesCarousel'>;

export default function MatchesCarouselScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getMyMatches()
        .then((data) => {
          if (!active) return;
          if (data.success) {
            setMatches(data.matches);
            setIndex((i) => Math.min(i, Math.max(0, data.matches.length - 1)));
          }
        })
        .catch(() => { /* show empty state */ })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, []),
  );

  const count = matches.length;
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  // Web: arrow-key navigation
  useEffect(() => {
    if (Platform.OS !== 'web' || count === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, count]);

  const current = matches[index];

  const openChat = () => {
    if (!current) return;
    navigation.navigate('Chat', { conversationId: current.conversationId, match: current.profile });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Your Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : count === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="heart-dislike-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Find a match and start a conversation — they'll show up here.</Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.findBtnText}>Back to Messages</Text>
          </TouchableOpacity>
        </View>
      ) : current ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
          >
            {/* Photo hero */}
            <View style={styles.heroArea}>
              <Image source={{ uri: current.profile.photo }} style={styles.heroImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,10,0.2)', '#0A0A0A']}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Edge arrows */}
              {count > 1 && (
                <>
                  <TouchableOpacity style={[styles.arrow, styles.arrowLeft]} onPress={goPrev} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={goNext} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={26} color="#fff" />
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.counterPill}>
                <Text style={styles.counterText}>{index + 1} / {count}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{current.profile.name}, {current.profile.age}</Text>
                {current.profile.verified && (
                  <View style={styles.verifiedBadge}>
                    <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              <Text style={styles.location}>
                {current.profile.city} · {current.profile.height} · {current.profile.religion}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>
                  {current.profile.distance} · {current.profile.profession}
                  {current.profile.college ? `, ${current.profile.college}` : ''}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.aboutText}>{current.profile.about}</Text>

              {current.profile.tags?.length > 0 && (
                <View style={styles.tagsRow}>
                  {current.profile.tags.map((tag) => (
                    <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                  ))}
                </View>
              )}

              {[
                { key: 'Weekend vibe', value: current.profile.weekendVibe },
                { key: 'First date idea', value: current.profile.firstDateIdea },
                { key: 'Love language', value: current.profile.loveLanguage },
              ].filter((r) => r.value).map(({ key, value }, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.lifestyleRow}>
                    <Text style={styles.lifestyleKey}>{key}</Text>
                    <Text style={styles.lifestyleValue}>{value}</Text>
                  </View>
                </React.Fragment>
              ))}

              {/* Dots */}
              {count > 1 && (
                <View style={styles.dotsRow}>
                  {matches.map((m, i) => (
                    <TouchableOpacity key={m.conversationId} onPress={() => setIndex(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <View style={[styles.navDot, i === index && styles.navDotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky footer with the message CTA */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
            <TouchableOpacity style={styles.messageBtn} onPress={openChat} activeOpacity={0.85}>
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.messageBtnText}>Message {current.profile.name}</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && count > 1 && (
              <Text style={styles.hint}>Use ← → arrow keys to browse</Text>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.displayBold },

  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl, gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.displayBold, marginTop: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  findBtn: { marginTop: 12, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, paddingHorizontal: 28 },
  findBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.semiBold },

  heroArea: { height: 380, position: 'relative', marginHorizontal: SPACING.md, marginTop: SPACING.sm, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  arrow: { position: 'absolute', top: '45%', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
  counterPill: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  counterText: { color: '#fff', fontSize: 12, fontFamily: FONTS.medium },

  details: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: COLORS.textPrimary, fontSize: 26, fontFamily: FONTS.displayBold },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(180,142,111,0.16)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(180,142,111,0.4)' },
  verifiedIcon: { width: 14, height: 14 },
  verifiedText: { color: '#B48E6F', fontSize: 12, fontWeight: '500' },
  location: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.lg },
  metaText: { color: COLORS.textSecondary, fontSize: 13 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  aboutText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: SPACING.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  tag: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.cardBorder },
  tagText: { color: COLORS.textPrimary, fontSize: 13 },
  lifestyleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  lifestyleKey: { color: COLORS.textSecondary, fontSize: 14 },
  lifestyleValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: SPACING.lg },
  navDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.cardBorder },
  navDotActive: { backgroundColor: COLORS.primary, width: 20 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  messageBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 16 },
  messageBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold },
  hint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
