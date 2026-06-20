import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { useApp } from '../context/AppContext';
import CreditsWidget from '../components/CreditsWidget';
import SwipeButton from '../components/SwipeButton';
import FiltersBottomSheet from '../components/FiltersBottomSheet';
import CrimsonGlow from '../components/CrimsonGlow';
import type { FindMatchStackParamList } from '../types';

type Props = StackScreenProps<FindMatchStackParamList, 'FindMatch'>;

// Figma frame is 393px wide — scale the bg placement proportionally. Source photo
// is 786×1062 (portrait); we fill the box width but keep the photo's natural ratio
// for height and anchor at the top so the heads are never cropped.
const FIGMA_FRAME_W = 393;
const IMG_NATURAL_RATIO = 1062 / 786;

// Compute bg-image placement from the *current* viewport. Reading this reactively
// (instead of a module-level Dimensions snapshot) keeps the image in the same spot
// across reloads/restarts and on window resize. Width is clamped so it stays
// phone-like on wide desktop browsers.
function useBgImageLayout() {
  const { width, height } = useWindowDimensions();
  const frameW = Math.min(width, 480);
  const scale = frameW / FIGMA_FRAME_W;
  return {
    bgHeight: height * 0.5,
    image: {
      width: 400 * scale,
      height: 400 * scale * IMG_NATURAL_RATIO,
      top: -30 * scale,
      left: 20 * scale,
    },
  };
}

export default function FindMatchScreen({ navigation }: Props) {
  const { credits, filters, refreshCredits } = useApp();
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const hasCredits = credits > 0;
  const bg = useBgImageLayout();

  useFocusEffect(
    useCallback(() => {
      setSwipeKey((k) => k + 1);
      refreshCredits(); // sync true balance so the no-credits state always shows when out
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CrimsonGlow />

      {/* Background image — fixed height, fades to dark */}
      <View style={[styles.bgClip, { height: bg.bgHeight }]}>
        <Image
          source={require('../../assets/icons/Background.png')}
          style={[styles.bgImage, bg.image]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.1)', 'rgba(10,10,10,0.82)', '#0A0A0A']}
          locations={[0, 0.4, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header — logo + brand + credits widget */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/icons/Logomark.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>Gostart</Text>
        </View>
        <CreditsWidget onPress={() => navigation.navigate('BuyCredits')} />
      </View>

      {/* Bottom content — centered on screen */}
      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 42 }]}>
        <View style={styles.centeredContent}>
          <Text style={styles.headline}>Ready to find your{'\n'}match?</Text>

          <View style={styles.verifiedRow}>
            <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
            <Text style={styles.verifiedText}>Verified profiles. Serious Intentions. Real relationships</Text>
          </View>

          <TouchableOpacity style={styles.filtersBtn} onPress={() => setShowFilters(true)} activeOpacity={0.8}>
            <Ionicons name="options-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.filtersBtnText}>Filters</Text>
          </TouchableOpacity>

          <SwipeButton
            key={swipeKey}
            onSwipe={() => { if (hasCredits) setTimeout(() => navigation.navigate('Searching', { filters }), 1500); }}
            disabled={!hasCredits}
            label={hasCredits ? 'Swipe to find someone special' : 'No credits remaining'}
          />

          <View style={styles.creditHint}>
            <Text style={styles.creditHintText}>Uses 1</Text>
            <Image source={require('../../assets/icons/credits coin.png')} style={styles.creditHintCoin} resizeMode="contain" />
            <Text style={styles.creditHintText}>credit</Text>
          </View>

          {!hasCredits && (
            <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate('BuyCredits')} activeOpacity={0.85}>
              <Image source={require('../../assets/icons/credits coin.png')} style={styles.coinIcon} resizeMode="contain" />
              <Text style={styles.buyBtnText}>Buy Credits</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FiltersBottomSheet visible={showFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  bgClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: 36,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONTS.displayBold },
  logo: { width: 42, height: 42 },

  bottomContent: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    gap: 8,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },

  headline: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontFamily: FONTS.displayBold,
    lineHeight: 44,
    marginBottom: 2,
    textAlign: 'center',
  },

  verifiedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  verifiedIcon: { width: 15, height: 15 },
  verifiedText: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },

  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filtersBtnText: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.semiBold },

  creditHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  creditHintCoin: { width: 14, height: 14 },
  creditHintText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 14 },

  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  coinIcon: { width: 18, height: 18 },
  buyBtnText: { color: COLORS.gold, fontSize: 15, fontFamily: FONTS.semiBold },
});
