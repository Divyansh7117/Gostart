// Searching screen — animated loading state while backend finds a match.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../theme';
import { startSearch, pollSearch } from '../services/api';
import type { FindMatchStackParamList } from '../types';

type Props = StackScreenProps<FindMatchStackParamList, 'Searching'>;

export default function SearchingScreen({ navigation, route }: Props) {
  const { filters } = route.params;
  const insets = useSafeAreaInsets();
  const [, setStatus] = useState<'searching' | 'found' | 'not_found'>('searching');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startAnimations();
    initiateSearch();
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, []);

  const startAnimations = () => {
    Animated.timing(progressAnim, { toValue: 1, duration: 4000, useNativeDriver: false }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ).start();
  };

  const initiateSearch = async () => {
    try {
      const data = await startSearch(filters);
      if (data.success) {
        pollInterval.current = setInterval(() => pollForResult(data.searchId), 1000);
      }
    } catch {
      setTimeout(() => navigation.replace('NoMatch'), 4000);
    }
  };

  const pollForResult = async (id: string) => {
    try {
      const data = await pollSearch(id);
      if (data.status === 'found' && data.match) {
        clearInterval(pollInterval.current!);
        setStatus('found');
        setTimeout(() => navigation.replace('MatchRevealed', { match: data.match! }), 500);
      } else if (data.status === 'not_found') {
        clearInterval(pollInterval.current!);
        setStatus('not_found');
        setTimeout(() => navigation.replace('NoMatch'), 500);
      }
    } catch {
      clearInterval(pollInterval.current!);
      navigation.replace('NoMatch');
    }
  };

  const spinInterpolate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '65%'] });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.centerContent}>
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.spinRing, { transform: [{ rotate: spinInterpolate }] }]} />
          <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="heart" size={40} color={COLORS.gold} />
          </Animated.View>
        </View>

        <Text style={styles.title}>Searching for your{'\n'}match...</Text>
        <Text style={styles.subtitle}>
          Finding the best match for you.{'\n'}We'll notify you as soon as one's found.
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <View style={styles.bottomNote}>
        <Ionicons name="information-circle-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.bottomNoteText}>No credits are deducted during search</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'space-between' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
  logoWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  spinRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2.5, borderColor: 'transparent', borderTopColor: COLORS.primary, borderRightColor: COLORS.primary },
  logoCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(201,168,76,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.25)' },
  title: { color: COLORS.textPrimary, fontSize: 30, fontFamily: FONTS.displayBold, textAlign: 'center', lineHeight: 40, marginBottom: SPACING.md },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  progressTrack: { width: '65%', height: 3, backgroundColor: COLORS.card, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  bottomNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, paddingVertical: 13, paddingHorizontal: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  bottomNoteText: { color: COLORS.textSecondary, fontSize: 13 },
});
