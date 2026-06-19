import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';
import { useApp } from '../context/AppContext';

// Type for the Ionicons name prop — keeps the menuItems array strictly typed
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconName;
  label: string;
  value?: string;
  color: string;
}

export default function ProfileScreen() {
  const { user, credits, logout } = useApp();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'shield-checkmark', label: 'Verified Profile', value: 'Active', color: COLORS.success },
    { icon: 'heart-circle', label: 'Credits', value: `${credits} remaining`, color: COLORS.gold },
    { icon: 'notifications', label: 'Notifications', color: COLORS.textSecondary },
    { icon: 'lock-closed', label: 'Privacy', color: COLORS.textSecondary },
    { icon: 'help-circle', label: 'Help & Support', color: COLORS.textSecondary },
    { icon: 'document-text', label: 'Terms & Privacy Policy', color: COLORS.textSecondary },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Text style={styles.screenTitle}>Profile</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1A0A0A', COLORS.background]} style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
            <Text style={styles.verifiedPillText}>Verified Account</Text>
          </View>
        </LinearGradient>

        {/* Credits card */}
        <View style={styles.creditsCard}>
          <View>
            <Text style={styles.creditsCardLabel}>Credits Balance</Text>
            <Text style={styles.creditsCardCount}>{credits}</Text>
            <Text style={styles.creditsCardSub}>One-time · Never expire</Text>
          </View>
          <TouchableOpacity style={styles.buyMoreBtn}>
            <Text style={styles.buyMoreText}>Buy More</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value && <Text style={[styles.menuValue, { color: item.color }]}>{item.value}</Text>}
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Gostart v1.0.0</Text>
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  profileHeader: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userName: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.md },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  verifiedPillText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  creditsCard: { marginHorizontal: SPACING.lg, backgroundColor: 'rgba(201, 168, 76, 0.1)', borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.3)', marginBottom: SPACING.lg },
  creditsCardLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  creditsCardCount: { color: COLORS.gold, fontSize: 32, fontWeight: '800' },
  creditsCardSub: { color: COLORS.textMuted, fontSize: 11 },
  buyMoreBtn: { backgroundColor: COLORS.gold, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 18, paddingVertical: 10 },
  buyMoreText: { color: '#000', fontWeight: '700', fontSize: 13 },
  menuSection: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: COLORS.textPrimary, fontSize: 15, flex: 1 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, paddingVertical: 16, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(231, 76, 60, 0.08)', borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.2)' },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
  version: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.lg },
});
