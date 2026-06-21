// swipe-to-search button — background fills crimson as you drag right
// PanResponder ref trick so stale closures don't capture old onSwipe/disabled values

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

  // store latest props in refs so PanResponder (created once) always sees fresh values
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
          // dragged far enough — commit and fire the callback
          Animated.spring(translateX, {
            toValue: maxSwipe,
            useNativeDriver: true,
          }).start(() => {
            setIsSwiped(true);
            onSwipeRef.current?.();
          });
        } else {
          // not far enough — spring back to idle
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  // label fades out as the thumb moves right
  const labelOpacity = translateX.interpolate({
    inputRange: [0, maxSwipe * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // background color interpolates from dark to crimson
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
