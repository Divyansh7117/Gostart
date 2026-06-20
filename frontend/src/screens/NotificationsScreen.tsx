import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NotifSetting {
  key: string;
  icon: IoniconName;
  label: string;
  description: string;
}

const SETTINGS: NotifSetting[] = [
  { key: 'matches', icon: 'heart', label: 'New Matches', description: 'Get notified when you find a match' },
  { key: 'messages', icon: 'chatbubble', label: 'Messages', description: 'Receive alerts for new messages' },
  { key: 'credits', icon: 'wallet', label: 'Credit Updates', description: 'Low credit balance alerts' },
  { key: 'community', icon: 'people', label: 'Community', description: 'New stories and tips from the community' },
  { key: 'promo', icon: 'gift', label: 'Promotions', description: 'Special offers and discounts' },
];

export default function NotificationsScreen({ navigation }: any) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    matches: true,
    messages: true,
    credits: true,
    community: false,
    promo: false,
  });

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 49 }}>
        <Text style={styles.sectionHeader}>Push Notifications</Text>
        <View style={styles.card}>
          {SETTINGS.map((s, i) => (
            <View key={s.key} style={[styles.row, i === SETTINGS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${COLORS.primary}18` }]}>
                <Ionicons name={s.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={styles.desc}>{s.description}</Text>
              </View>
              <Switch
                value={toggles[s.key]}
                onValueChange={() => toggle(s.key)}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Email Notifications</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${COLORS.gold}18` }]}>
              <Ionicons name="mail" size={18} color={COLORS.gold} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>Email Digest</Text>
              <Text style={styles.desc}>Weekly summary of your activity</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, height: 58 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  sectionHeader: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: SPACING.lg, marginTop: 12, marginBottom: SPACING.sm },
  card: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  label: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium },
  desc: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
});
