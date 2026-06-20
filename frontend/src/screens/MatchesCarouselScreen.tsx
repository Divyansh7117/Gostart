// "Your Matches" — the same browse-and-choose carousel the home-screen swipe
// leads to, but populated with people you've already matched with. Navigate with
// the in-card arrows (or ← / → keys on web); the pinned button continues the chat.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Image, ActivityIndicator, StatusBar, Platform, useWindowDimensions,
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
  const { height: winHeight } = useWindowDimensions();
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
  const current = matches[index];

  // Transition animation — fade + directional slide on each switch
  const anim = useRef(new Animated.Value(1)).current;
  const dirRef = useRef(0);
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [index]);
  const slideX = anim.interpolate({ inputRange: [0, 1], outputRange: [dirRef.current * 60, 0] });

  const goPrev = useCallback(() => { dirRef.current = -1; setIndex((i) => (i - 1 + count) % count); }, [count]);
  const goNext = useCallback(() => { dirRef.current = 1; setIndex((i) => (i + 1) % count); }, [count]);

  useEffect(() => {
    if (Platform.OS !== 'web' || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, count]);

  const openChat = () => {
    if (!current) return;
    navigation.navigate('Chat', { conversationId: current.conversationId, match: current.profile });
  };

  const goBackToList = () => navigation.reset({ index: 0, routes: [{ name: 'MessagesList' }] });

  // Loading / empty states
  if (loading || count === 0) {
    return (
      <View style={[styles.container, { height: winHeight, paddingTop: insets.top + 24 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <CrimsonGlow />
        <View style={[styles.topBar, { paddingTop: 14 }]}>
          <TouchableOpacity onPress={goBackToList} style={styles.topBackBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerFill}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="heart-dislike-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>Find a match and start a conversation — they'll show up here.</Text>
              <TouchableOpacity style={styles.findBtn} onPress={goBackToList} activeOpacity={0.85}>
                <Text style={styles.findBtnText}>Back to Messages</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  const p = current.profile;

  return (
    <View style={[styles.container, { height: winHeight, paddingTop: insets.top + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CrimsonGlow />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
        {/* Hero */}
        <View style={styles.heroArea}>
          <Animated.Image source={{ uri: p.photo }} style={[styles.heroImage, { opacity: anim }]} resizeMode="cover" blurRadius={20} />
          <LinearGradient
            colors={['rgba(10,10,10,0.3)', 'rgba(10,10,10,0.6)', '#0A0A0A']}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={[styles.backBtn, { top: SPACING.sm }]}
            onPress={goBackToList}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {count > 1 && (
            <View style={[styles.counterPill, { top: SPACING.sm }]}>
              <Text style={styles.counterText}>{index + 1} of {count} matches</Text>
            </View>
          )}

          <View style={styles.heroCenter}>
            <Image source={require('../../assets/icons/Logomark.png')} style={styles.heroLogo} resizeMode="contain" />
            <Text style={styles.heroTitle}>Your Matches</Text>
            <Text style={styles.heroSub}>Browse and choose who to talk to</Text>
          </View>
        </View>

        {/* Details card */}
        <Animated.View style={[styles.detailsCard, { opacity: anim, transform: [{ translateX: slideX }] }]}>
          {count > 1 && (
            <View style={styles.switchRow}>
              <TouchableOpacity style={styles.switchBtn} onPress={goPrev} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={styles.dotsRow}>
                {matches.map((m, i) => (
                  <TouchableOpacity key={m.conversationId} onPress={() => { dirRef.current = i > index ? 1 : -1; setIndex(i); }} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <View style={[styles.dot, i === index && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.switchBtn} onPress={goNext} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.nameRow}>
            <Text style={styles.name}>{p.name}, {p.age}</Text>
            {p.verified && (
              <View style={styles.verifiedBadge}>
                <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.connectedPill}>
            <Ionicons name="chatbubble-ellipses" size={13} color={COLORS.gold} />
            <Text style={styles.connectedText}>You've matched</Text>
          </View>

          <Text style={styles.location}>{p.city} · {p.height} · {p.religion}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{p.distance} · {p.profession}{p.college ? `, ${p.college}` : ''}</Text>
          </View>

          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.aboutText}>{p.about}</Text>

          {p.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {p.tags.map((tag) => (<View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>))}
            </View>
          )}

          {[
            { key: 'Weekend vibe', value: p.weekendVibe },
            { key: 'First date idea', value: p.firstDateIdea },
            { key: 'Love language', value: p.loveLanguage },
          ].filter((r) => r.value).map(({ key, value }, i) => (
            <React.Fragment key={key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.lifestyleRow}>
                <Text style={styles.lifestyleKey}>{key}</Text>
                <Text style={styles.lifestyleValue}>{value}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Pinned action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.startConvBtn} onPress={openChat} activeOpacity={0.85}>
          <Ionicons name="chatbubble" size={18} color="#fff" />
          <Text style={styles.startConvBtnText}>Continue Conversation</Text>
        </TouchableOpacity>
        <Text style={styles.creditNote}>Free · you already matched</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, overflow: 'hidden' },
  scroll: { flex: 1 },

  topBar: { paddingHorizontal: SPACING.lg },
  topBackBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl, gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.displayBold, marginTop: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  findBtn: { marginTop: 12, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, paddingHorizontal: 28 },
  findBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.semiBold },

  heroArea: { height: 320, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', left: SPACING.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  counterPill: { position: 'absolute', right: SPACING.md, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, zIndex: 10 },
  counterText: { color: '#fff', fontSize: 12, fontFamily: FONTS.medium },
  heroCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 8 },
  heroLogo: { width: 80, height: 80 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 38, fontFamily: FONTS.displayBold, letterSpacing: 0.5 },
  heroSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: -2 },

  detailsCard: { backgroundColor: COLORS.card, marginHorizontal: SPACING.md, marginTop: -20, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  switchBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.cardBorder },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },

  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: COLORS.textPrimary, fontSize: 26, fontFamily: FONTS.displayBold },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(180,142,111,0.16)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(180,142,111,0.4)' },
  verifiedIcon: { width: 14, height: 14 },
  verifiedText: { color: '#B48E6F', fontSize: 12, fontWeight: '500' },
  connectedPill: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 5, backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  connectedText: { color: COLORS.gold, fontSize: 12, fontWeight: '500' },
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

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  startConvBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 17 },
  startConvBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  creditNote: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
