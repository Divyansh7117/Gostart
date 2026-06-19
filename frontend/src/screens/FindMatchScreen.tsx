import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { useApp } from '../context/AppContext';
import CreditsWidget from '../components/CreditsWidget';
import SwipeButton from '../components/SwipeButton';
import FiltersBottomSheet from '../components/FiltersBottomSheet';
import type { FindMatchStackParamList } from '../types';

type Props = StackScreenProps<FindMatchStackParamList, 'FindMatch'>;

export default function FindMatchScreen({ navigation }: Props) {
  const { credits, filters } = useApp();
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  const hasCredits = credits > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Full-screen background from Figma assets */}
      <ImageBackground
        source={require('../../assets/icons/Background.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Gradient darkens bottom half so text is always readable */}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.55)', '#0A0A0A']}
          locations={[0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Header — logo + credits */}
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <Image source={require('../../assets/icons/Logomark.png')} style={styles.logo} resizeMode="contain" />
        <CreditsWidget onPress={() => navigation.navigate('BuyCredits')} />
      </View>

      {/* Bottom content anchored to bottom */}
      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 114 }]}>
        <Text style={styles.headline}>Ready to find your{'\n'}match?</Text>

        <View style={styles.verifiedRow}>
          <Image source={require('../../assets/icons/verified.png')} style={styles.verifiedIcon} resizeMode="contain" />
          <Text style={styles.verifiedText}>Verified profiles. Serious Intentions. Real relationships</Text>
        </View>

        <TouchableOpacity style={styles.filtersBtn} onPress={() => setShowFilters(true)} activeOpacity={0.8}>
          <Image source={require('../../assets/icons/slider.png')} style={styles.sliderIcon} resizeMode="contain" />
          <Text style={styles.filtersBtnText}>Filters</Text>
        </TouchableOpacity>

        <SwipeButton
          onSwipe={() => navigation.navigate('Searching', { filters })}
          disabled={!hasCredits}
          label={hasCredits ? 'Swipe to find someone special' : 'No credits remaining'}
        />

        <View style={styles.creditHint}>
          <View style={styles.dot} />
          <Text style={styles.creditHintText}>Uses 1 credit per conversation started</Text>
        </View>

        {!hasCredits && (
          <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate('BuyCredits')} activeOpacity={0.85}>
            <Image source={require('../../assets/icons/credits coin.png')} style={styles.coinIcon} resizeMode="contain" />
            <Text style={styles.buyBtnText}>Buy Credits</Text>
          </TouchableOpacity>
        )}
      </View>

      <FiltersBottomSheet visible={showFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg },
  logo: { width: 36, height: 36 },
  bottomContent: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SPACING.lg, gap: SPACING.md },
  headline: { color: COLORS.textPrimary, fontSize: 34, fontFamily: FONTS.displayBold, lineHeight: 44 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedIcon: { width: 15, height: 15 },
  verifiedText: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
  filtersBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BORDER_RADIUS.full, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.cardBorder },
  sliderIcon: { width: 18, height: 18 },
  filtersBtnText: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.semiBold },
  creditHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  creditHintText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: BORDER_RADIUS.full, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  coinIcon: { width: 18, height: 18 },
  buyBtnText: { color: COLORS.gold, fontSize: 15, fontFamily: FONTS.semiBold },
});
