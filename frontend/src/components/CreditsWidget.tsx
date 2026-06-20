import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme';
import { useApp } from '../context/AppContext';

interface CreditsWidgetProps {
  onPress?: () => void;
}

export default function CreditsWidget({ onPress }: CreditsWidgetProps) {
  const { credits } = useApp();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchWrap}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/icons/credits coin.png')}
          style={styles.coinIcon}
          resizeMode="contain"
        />
        <View style={styles.textBlock}>
          <Text style={styles.label}>Credits Left</Text>
          <Text style={styles.count}>{credits}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#B8B8B8" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchWrap: {
    borderRadius: 12,
    // no fixed width — sizes to content
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(180, 142, 111, 0.16)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
    gap: 4,
  },
  coinIcon: {
    width: 36,
    height: 36,
  },
  textBlock: {
    alignItems: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
    lineHeight: 13,
  },
  count: {
    color: 'rgba(180, 142, 111, 1)',
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    lineHeight: 20,
  },
});
