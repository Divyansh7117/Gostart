import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Modal, Alert, StatusBar,
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
  const { match } = route.params;
  const { deductCredit, credits } = useApp();
  const insets = useSafeAreaInsets();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartConversation = () => {
    if (credits < 1) {
      Alert.alert('Not enough credits', 'You need at least 1 credit to start a conversation.', [
        { text: 'Buy Credits', onPress: () => navigation.navigate('BuyCredits') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const data = await startConversation(match.id);
      if (data.success) {
        deductCredit();
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CrimsonGlow />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
        {/* Hero — blurred photo + Logomark + "Your Match" */}
        <View style={styles.heroArea}>
          <Image source={{ uri: match.photo }} style={styles.heroImage} resizeMode="cover" blurRadius={20} />
          <LinearGradient
            colors={['rgba(10,10,10,0.3)', 'rgba(10,10,10,0.6)', '#0A0A0A']}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + SPACING.sm }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroCenter}>
            <Image source={require('../../assets/icons/Logomark.png')} style={styles.heroLogo} resizeMode="contain" />
            <Text style={styles.heroTitle}>Your Match</Text>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{match.name}, {match.age}</Text>
            {match.verified && (
              <View style={styles.verifiedBadge}>
                <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

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

          <TouchableOpacity style={styles.startConvBtn} onPress={handleStartConversation}>
            <Text style={styles.startConvBtnText}>Start Conversation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notNowBtn} onPress={() => navigation.navigate('FindMatch')}>
            <Text style={styles.notNowText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  heroArea: { height: 320, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', left: SPACING.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  heroCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 8 },
  heroLogo: { width: 80, height: 80 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 38, fontFamily: FONTS.displayBold, letterSpacing: 0.5 },

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
  lifestyleValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.cardBorder },
  startConvBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 17, alignItems: 'center', marginTop: SPACING.xl },
  startConvBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notNowBtn: { alignItems: 'center', paddingVertical: 14 },
  notNowText: { color: COLORS.textSecondary, fontSize: 15 },
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
