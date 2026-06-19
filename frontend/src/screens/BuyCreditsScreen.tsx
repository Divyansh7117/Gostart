// Buy Credits screen — mock Razorpay payment flow.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { initiatePayment, confirmPayment } from '../services/api';
import { useApp } from '../context/AppContext';
import type { FindMatchStackParamList } from '../types';

type Props = StackScreenProps<FindMatchStackParamList, 'BuyCredits'>;

const BENEFITS = ['One match revealed at a time', 'Credits never expire', 'Carry forward forever'] as const;

export default function BuyCreditsScreen({ navigation }: Props) {
  const { addCredits } = useApp();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleBuyCredits = async () => {
    setLoading(true);
    try {
      const orderData = await initiatePayment('pack_5');
      const mockPaymentId = `pay_demo_${Date.now()}`;
      const confirmData = await confirmPayment('pack_5', mockPaymentId, orderData.orderId);
      if (confirmData.success) {
        addCredits(5);
        Alert.alert('Payment Successful! 🎉', '5 credits have been added to your account.', [
          { text: 'Start Matching!', onPress: () => navigation.navigate('FindMatch') },
        ]);
      }
    } catch (err) {
      Alert.alert('Payment Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Credits</Text>
        <Text style={styles.subtitle}>One-time · Carry forward forever</Text>
      </View>

      <View style={styles.packageCard}>
        <Text style={styles.price}>₹ 2,000</Text>
        <Text style={styles.creditsLabel}>5 Credits</Text>

        <View style={styles.coinsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.coin}>
              <Ionicons name="heart" size={16} color={COLORS.gold} />
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}

        <Text style={styles.oneTimeNote}>One Time | No Subscription</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuyCredits} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyBtnText}>Buy 5 Credits — ₹2,000</Text>}
        </TouchableOpacity>
        <View style={styles.razorpayRow}>
          <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />
          <Text style={styles.razorpayText}>Secure payment via Razorpay</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  backBtn: { marginBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.displayBold },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  packageCard: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder, flex: 1 },
  price: { color: COLORS.gold, fontSize: 44, fontWeight: '800', marginBottom: 4 },
  creditsLabel: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.lg },
  coinsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg },
  coin: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  divider: { width: '100%', height: 1, backgroundColor: COLORS.cardBorder, marginBottom: SPACING.lg },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginBottom: 14 },
  benefitText: { color: COLORS.textPrimary, fontSize: 14 },
  oneTimeNote: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.md },
  footer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  buyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 18, alignItems: 'center', marginBottom: SPACING.md },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  razorpayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  razorpayText: { color: COLORS.textMuted, fontSize: 12 },
});
