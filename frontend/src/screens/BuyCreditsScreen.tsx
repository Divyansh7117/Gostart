import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS, CONTENT_MAX_WIDTH } from '../theme';
import { initiatePayment, confirmPayment } from '../services/api';
import { useApp } from '../context/AppContext';
import CrimsonGlow from '../components/CrimsonGlow';

type Props = { navigation: any };

const BENEFITS = [
  'One match revealed at a time',
  'Credits never expire',
  'Carry forward to next reset',
] as const;

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
        Alert.alert('Payment Successful!', '5 credits have been added to your account.', [
          { text: 'Great!', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Payment Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Buy Credits</Text>
          <Text style={styles.subtitle}>One-time · Carry forward forever</Text>
        </View>
      </View>

      {/* Card + button grouped and centered vertically */}
      <View style={styles.centerGroup}>
        <View style={styles.packageCard}>
          {/* Decorative background coin */}
          <Image
            source={require('../../assets/icons/boycreditsbg.png')}
            style={styles.bgCoin}
            resizeMode="contain"
          />

          {/* Price row: ₹ icon + amount */}
          <View style={styles.priceRow}>
            <View style={styles.rupeeIcon}>
              <Text style={styles.rupeeSymbol}>₹</Text>
            </View>
            <Text style={styles.price}>2,000</Text>
          </View>

          <Text style={styles.creditsLabel}>5 Credits</Text>

          {/* 5 overlapping coins */}
          <View style={styles.coinsRow}>
            <Image source={require('../../assets/icons/5coins.png')} style={styles.coinsImage} resizeMode="contain" />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Benefits */}
          <View style={styles.benefitsWrap}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Image source={require('../../assets/icons/greentick.png')} style={styles.tickIcon} resizeMode="contain" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* One Time note */}
          <Text style={styles.oneTimeNote}>One Time | No Subscription</Text>
        </View>

        {/* Button sits just below the card */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.buyBtn} onPress={handleBuyCredits} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyBtnText}>Buy 5 Credits</Text>}
          </TouchableOpacity>
          <View style={styles.razorpayRow}>
            <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />
            <Text style={styles.razorpayText}>Secure payment via Razorpay</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const COPPER = '#B48E6F';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    height: 58,
    marginBottom: 49,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  headerTextWrap: { flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  subtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  centerGroup: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: 24,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  packageCard: {
    backgroundColor: 'rgba(180, 142, 111, 0.04)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 29,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(180, 142, 111, 0.22)',
    shadowColor: '#B48E6F',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 24,
    shadowOpacity: 0.18,
    elevation: 6,
  },


  bgCoin: {
    position: 'absolute',
    bottom: -20,
    right: -30,
    width: 260,
    height: 260,
    opacity: 0.72,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  rupeeIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  rupeeSymbol: {
    color: COPPER,
    fontSize: 56,
    fontFamily: FONTS.displayBold,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  price: {
    color: 'rgba(180, 142, 111, 1)',
    fontSize: 56,
    fontFamily: FONTS.displayBold,
    lineHeight: 56,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },

  creditsLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginTop: 8,
    marginBottom: 16,
  },

  coinsRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  coinsImage: {
    width: 140,
    height: 42,
  },

  divider: {
    width: '100%',
    height: 0.5,
    backgroundColor: 'rgba(180, 142, 111, 0.48)',
    borderRadius: 4,
    marginBottom: 24,
  },

  benefitsWrap: {
    alignSelf: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickIcon: {
    width: 24,
    height: 24,
  },
  benefitText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },

  oneTimeNote: {
    color: '#767676',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 0,
    paddingTop: 30,
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  razorpayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  razorpayText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
