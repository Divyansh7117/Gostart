// Swipe-to-search button — matches the Figma exactly.
// Two states:
//   IDLE:   dark bg, red >>> circle on LEFT, label text to the right
//   SWIPED: full crimson bg, "Finding match..." centered, >>> circle on RIGHT
//
// The bg "fills" with crimson as you drag (Animated.Value interpolation).

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  PanResponderInstance,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../theme';

interface SwipeButtonProps {
  onSwipe?: () => void;
  disabled?: boolean;
  label?: string;
}

const THUMB_SIZE = 56;
const BAR_HEIGHT = 64;
const MAX_BAR_WIDTH = 400;

export default function SwipeButton({
  onSwipe,
  disabled = false,
  label = 'Swipe to find someone special',
}: SwipeButtonProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width - 48, MAX_BAR_WIDTH);
  const maxSwipe = barWidth - THUMB_SIZE - 8;

  // Keep a ref to the latest onSwipe/disabled so the PanResponder (created once)
  // always calls the current callback and sees the current disabled state.
  const onSwipeRef = useRef(onSwipe);
  const disabledRef = useRef(disabled);
  onSwipeRef.current = onSwipe;
  disabledRef.current = disabled;

  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,

      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(0, Math.min(g.dx, maxSwipe)));
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx > maxSwipe * 0.8) {
          // Snapped far enough → commit the swipe
          Animated.spring(translateX, {
            toValue: maxSwipe,
            useNativeDriver: true,
          }).start(() => {
            setIsSwiped(true);
            onSwipeRef.current?.();
          });
        } else {
          // Not far enough → spring back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  // Label fades out as the thumb slides right
  const labelOpacity = translateX.interpolate({
    inputRange: [0, maxSwipe * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Bar background fills with crimson as you drag
  const bgColor = translateX.interpolate({
    inputRange: [0, maxSwipe],
    outputRange: ['#1A1A1A', '#7B0D1E'],
    extrapolate: 'clamp',
  });

  const ArrowGroup = () => (
    <>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
      <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} style={{ marginLeft: -8 }} />
      <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} style={{ marginLeft: -8 }} />
    </>
  );

  // ── SWIPED state ────────────────────────────────────────────────────────────
  if (isSwiped) {
    return (
      <View style={[styles.container, styles.containerSwiped, { maxWidth: barWidth }]}>
        <Text style={styles.findingLabel}>Finding match...</Text>
        <View style={[styles.thumb, styles.thumbRight]}>
          <ArrowGroup />
        </View>
      </View>
    );
  }

  // ── IDLE state ──────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.container,
        disabled && styles.disabled,
        { backgroundColor: bgColor, maxWidth: barWidth },
      ]}
    >
      <Animated.Text style={[styles.label, { opacity: labelOpacity }]}>
        {label}
      </Animated.Text>

      <Animated.View
        style={[styles.thumb, styles.thumbLeft, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <ArrowGroup />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center' as const,
    height: BAR_HEIGHT,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    position: 'relative',
  },
  containerSwiped: {
    backgroundColor: '#7B0D1E',
    borderColor: '#7B0D1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    position: 'absolute',
    left: THUMB_SIZE + 16,
  },
  findingLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    paddingLeft: 12,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLeft: { position: 'absolute', left: 4 },
  thumbRight: { marginRight: 4, flexShrink: 0 },
});
