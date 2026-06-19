import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONTS } from '../theme';
import { useApp } from '../context/AppContext';

interface CreditsWidgetProps {
  onPress?: () => void;
}

export default function CreditsWidget({ onPress }: CreditsWidgetProps) {
  const { credits } = useApp();
  const isLow = credits === 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, isLow && styles.containerLow]}
      activeOpacity={0.8}
    >
      <View style={styles.coinCircle}>
        <Image
          source={require('../../assets/icons/credits coin.png')}
          style={styles.coinIcon}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.label}>Credits Left</Text>
        <Text style={[styles.count, isLow && styles.countLow]}>{credits}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  containerLow: { borderColor: COLORS.error },
  coinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinIcon: { width: 16, height: 16 },
  textBlock: { marginRight: 4 },
  label: { color: COLORS.textSecondary, fontSize: 10, fontFamily: FONTS.medium },
  count: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.bold,
    lineHeight: 22,
  },
  countLow: { color: COLORS.error },
});
