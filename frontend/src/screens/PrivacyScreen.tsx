import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface PrivacySetting {
  key: string;
  icon: IoniconName;
  label: string;
  description: string;
}

const SETTINGS: PrivacySetting[] = [
  { key: 'showProfile', icon: 'eye', label: 'Profile Visibility', description: 'Allow others to discover your profile' },
  { key: 'showDistance', icon: 'location', label: 'Show Distance', description: 'Display your approximate distance to matches' },
  { key: 'readReceipts', icon: 'checkmark-done', label: 'Read Receipts', description: 'Let others know when you\'ve read their messages' },
  { key: 'onlineStatus', icon: 'ellipse', label: 'Online Status', description: 'Show when you\'re active on the app' },
];

export default function PrivacyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    showProfile: true,
    showDistance: true,
    readReceipts: true,
    onlineStatus: false,
  });

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 49 }}>
        <Text style={styles.sectionHeader}>Privacy Settings</Text>
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

        <Text style={styles.sectionHeader}>Account Actions</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder }]}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(231,76,60,0.1)' }]}>
              <Ionicons name="hand-left" size={18} color={COLORS.error} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>Blocked Users</Text>
              <Text style={styles.desc}>Manage your blocked list</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(231,76,60,0.1)' }]}>
              <Ionicons name="trash" size={18} color={COLORS.error} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>Delete Account</Text>
              <Text style={styles.desc}>Permanently delete your account and data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
