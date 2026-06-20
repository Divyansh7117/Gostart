// Match results — the search surfaces up to 3 matches. Browse them with the
// in-card arrows (or ← / → keys on web); each switch cross-fades + slides in.
// New connections cost 1 credit; reconnecting with someone you've already
// talked to is free and jumps straight back into the chat.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
  Image, Modal, Alert, StatusBar, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { startConversation } from '../services/api';
import { useApp } from '../context/AppContext';
import type { FindMatchStackParamList } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<FindMatchStackParamList, 'MatchRevealed'>;

export default function MatchRevealedScreen({ navigation, route }: Props) {
  const { matches } = route.params;
  const { deductCredit, credits } = useApp();
  const insets = useSafeAreaInsets();
  const { height: winHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const count = matches.length;
  const match = matches[index];

  // Transition animation — fade + directional slide on each match switch
  const anim = useRef(new Animated.Value(1)).current;
  const dirRef = useRef(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [index]);

  const slideX = anim.interpolate({ inputRange: [0, 1], outputRange: [dirRef.current * 60, 0] });

  const goPrev = useCallback(() => { dirRef.current = -1; setIndex((i) => (i - 1 + count) % count); }, [count]);
  const goNext = useCallback(() => { dirRef.current = 1; setIndex((i) => (i + 1) % count); }, [count]);

  // Web: arrow-key navigation between matches
  useEffect(() => {
    if (Platform.OS !== 'web' || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, count]);

  // Reconnecting is free — go straight in. New connection → confirm (1 credit).
  const handlePrimary = () => {
    if (match.alreadyConnected) {
      openChat();
      return;
    }
    if (credits < 1) {
      Alert.alert('Not enough credits', 'You need at least 1 credit to start a conversation.', [
        { text: 'Buy Credits', onPress: () => navigation.navigate('BuyCredits') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setShowConfirmModal(true);
  };

  const openChat = async () => {
    setLoading(true);
    try {
      const data = await startConversation(match.id);
      if (data.success) {
        if (!data.alreadyConnected) deductCredit();
        setShowConfirmModal(false);
        navigation.getParent()?.navigate('MessagesTab', {
          screen: 'Chat',
          params: { conversationId: data.conversationId, match },
        });
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { height: winHeight, paddingTop: insets.top + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CrimsonGlow />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
        {/* Hero — blurred photo + Logomark + title */}
        <View style={styles.heroArea}>
          <Animated.Image
            source={{ uri: match.photo }}
            style={[styles.heroImage, { opacity: anim }]}
            resizeMode="cover"
            blurRadius={20}
          />
          <LinearGradient
            colors={['rgba(10,10,10,0.3)', 'rgba(10,10,10,0.6)', '#0A0A0A']}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={[styles.backBtn, { top: SPACING.sm }]}
            onPress={() => navigation.navigate('FindMatch')}
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
            <Text style={styles.heroTitle}>{count > 1 ? 'Your Matches' : 'Your Match'}</Text>
            {count > 1 && <Text style={styles.heroSub}>Browse and choose who to talk to</Text>}
          </View>
        </View>

        {/* Details card — animated on each switch */}
        <Animated.View style={[styles.detailsCard, { opacity: anim, transform: [{ translateX: slideX }] }]}>
          {/* In-card arrows for switching matches */}
          {count > 1 && (
            <View style={styles.switchRow}>
              <TouchableOpacity style={styles.switchBtn} onPress={goPrev} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={styles.dotsRow}>
                {matches.map((m, i) => (
                  <TouchableOpacity key={m.id} onPress={() => { dirRef.current = i > index ? 1 : -1; setIndex(i); }} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
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
            <Text style={styles.name}>{match.name}, {match.age}</Text>
            {match.verified && (
              <View style={styles.verifiedBadge}>
                <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {match.alreadyConnected && (
            <View style={styles.connectedPill}>
              <Ionicons name="chatbubble-ellipses" size={13} color={COLORS.gold} />
              <Text style={styles.connectedText}>You've talked before</Text>
            </View>
          )}

          <Text style={styles.location}>{match.city} · {match.height} · {match.religion}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>
              {match.distance} · {match.profession}{match.college ? `, ${match.college}` : ''}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.aboutText}>{match.about}</Text>

          <View style={styles.tagsRow}>
            {match.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {[
            { key: 'Weekend vibe', value: match.weekendVibe },
            { key: 'First date idea', value: match.firstDateIdea },
            { key: 'Love language', value: match.loveLanguage },
          ].map(({ key, value }, i) => (
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

      {/* Primary action — flex footer; always visible, bio scrolls above it */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.startConvBtn} onPress={handlePrimary} activeOpacity={0.85}>
          <Ionicons name={match.alreadyConnected ? 'chatbubble' : 'heart'} size={18} color="#fff" />
          <Text style={styles.startConvBtnText}>
            {match.alreadyConnected ? 'Continue Conversation' : 'Start Conversation'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.creditNote}>
          {match.alreadyConnected ? 'Free · you already matched' : 'Uses 1 credit'}
        </Text>
      </View>

      <Modal transparent visible={showConfirmModal} animationType="fade">
        <BlurView intensity={30} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={styles.modalProfileRow}>
              <Image source={{ uri: match.photo }} style={styles.modalAvatar} />
              <View>
                <Text style={styles.modalName}>{match.name}, {match.age}</Text>
                <Text style={styles.modalCity}>{match.city} · {match.distance}</Text>
              </View>
            </View>

            <Text style={styles.modalText}>
              Starting this conversation uses{' '}
              <Text style={styles.creditHighlight}>1 credit</Text>
              . You'll both be connected in chat.
            </Text>

            <TouchableOpacity style={styles.confirmBtn} onPress={openChat} disabled={loading}>
              <Text style={styles.confirmBtnText}>{loading ? 'Connecting...' : 'Yes, Start Conversation'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowConfirmModal(false)} disabled={loading}>
              <Text style={styles.cancelModalText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, overflow: 'hidden' },
  scroll: { flex: 1 },
  heroArea: { height: 320, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', left: SPACING.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  counterPill: { position: 'absolute', right: SPACING.md, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, zIndex: 10 },
  counterText: { color: '#fff', fontSize: 12, fontFamily: FONTS.medium },
  heroCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 8 },
  heroLogo: { width: 80, height: 80 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 38, fontFamily: FONTS.displayBold, letterSpacing: 0.5 },
  heroSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: -2 },

  detailsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: -20,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
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
  startConvBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 17,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, shadowOpacity: 0.5, elevation: 8,
  },
  startConvBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold, letterSpacing: 0.3 },
  creditNote: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  modalProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: SPACING.lg },
  modalAvatar: { width: 52, height: 52, borderRadius: 26 },
  modalName: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  modalCity: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  modalText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: SPACING.lg },
  creditHighlight: { color: COLORS.textPrimary, fontWeight: '700' },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 17, alignItems: 'center', marginBottom: 12 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelModalText: { color: COLORS.textSecondary, fontSize: 15 },
});
