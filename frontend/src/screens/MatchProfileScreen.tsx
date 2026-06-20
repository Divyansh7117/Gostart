import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { getProfile } from '../services/api';
import type { MessagesStackParamList, Profile } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<MessagesStackParamList, 'MatchProfile'>;

export default function MatchProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  // The profile passed in may be partial (e.g. opened from the messages list),
  // so fetch the full record by id to fill in the bio, tags and lifestyle.
  const [profile, setProfile] = useState<Profile>(route.params.profile);

  useEffect(() => {
    let active = true;
    getProfile(route.params.profile.id)
      .then((data) => { if (active && data.success) setProfile(data.profile); })
      .catch(() => { /* keep the partial profile we already have */ });
    return () => { active = false; };
  }, [route.params.profile.id]);

  const ageValue = profile.age ? `${profile.age}` : '';
  const locationValue = profile.city;
  const aboutText = profile.about?.trim() || 'No bio yet.';
  const detailRows = [
    { key: 'Weekend vibe', value: profile.weekendVibe || 'Not set' },
    { key: 'First date idea', value: profile.firstDateIdea || 'Not set' },
    { key: 'Love language', value: profile.loveLanguage || 'Not set' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />

      <View style={styles.heroWrap}>
        <Image source={{ uri: profile.photo }} style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)', '#0A0A0A']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContent, { paddingTop: 18 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.brandMark}>
            <Image source={require('../../assets/icons/Logomark.png')} style={styles.brandIcon} resizeMode="contain" />
          </View>
          <Text style={styles.heroTitle}>Your Match</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {ageValue}</Text>
            {profile.verified && (
              <View style={styles.verifiedPill}>
                <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.meta}>
            {[locationValue, profile.height, profile.religion].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.location}>
            {[profile.distance, profile.profession].filter(Boolean).join(' · ')}
          </Text>

          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.about}>{aboutText}</Text>

          {(profile.tags?.length ?? 0) > 0 && (
            <View style={styles.chipRow}>
              {profile.tags.map((chip) => (
                <View key={chip} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.detailRows}>
            {detailRows.map((row) => (
              <View key={row.key} style={styles.detailRow}>
                <Text style={styles.detailKey}>{row.key}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroWrap: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%', opacity: 0.65 },
  heroContent: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  backBtn: { position: 'absolute', left: SPACING.md, top: 4 },
  brandMark: { marginTop: 52, marginBottom: 10 },
  brandIcon: { width: 34, height: 34 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 34, fontFamily: FONTS.displayBold },
  sheet: { paddingHorizontal: SPACING.md, marginTop: -20 },
  card: { backgroundColor: '#141414', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.lg, minHeight: 420 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  name: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.displayBold },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(201,168,76,0.5)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(201,168,76,0.08)' },
  verifiedIcon: { width: 12, height: 12 },
  verifiedText: { color: COLORS.gold, fontSize: 12, fontFamily: FONTS.medium },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  location: { color: '#B24A4A', fontSize: 13, marginTop: 12 },
  sectionLabel: { color: '#666', fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginTop: 18, marginBottom: 10 },
  about: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  chip: { backgroundColor: '#1C1C1C', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#262626' },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.medium },
  detailRows: { marginTop: 18, gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailKey: { color: COLORS.textMuted, fontSize: 13 },
  detailValue: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.medium },
});
