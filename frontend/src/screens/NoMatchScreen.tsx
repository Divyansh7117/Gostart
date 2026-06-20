import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import type { FindMatchStackParamList } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = StackScreenProps<FindMatchStackParamList, 'NoMatch'>;

export default function NoMatchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />
      <View style={styles.content}>
        <Image
          source={require('../../assets/icons/Nomatchsearchicon.png')}
          style={styles.noMatchIcon}
          resizeMode="contain"
        />
        <Text style={styles.title}>No Match Yet</Text>
        <Text style={styles.subtitle}>
          We're still looking.{'\n'}Try adjusting your filters to expand the search.
        </Text>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => navigation.navigate('FindMatch')} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={18} color={COLORS.textPrimary} />
          <Text style={styles.adjustBtnText}>Adjust Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tryAgainBtn} onPress={() => navigation.navigate('FindMatch')} activeOpacity={0.7}>
          <Text style={styles.tryAgainText}>Go back and try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  title: { color: COLORS.textPrimary, fontSize: 30, fontFamily: FONTS.displayBold, marginBottom: SPACING.md, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xl },
  adjustBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, width: '100%', borderWidth: 1, borderColor: COLORS.cardBorder },
  adjustBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  tryAgainBtn: { marginTop: SPACING.lg, paddingVertical: 12 },
  tryAgainText: { color: COLORS.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});
