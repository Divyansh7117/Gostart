import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Image, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { useApp } from '../context/AppContext';
import type { ProfileStackParamList } from '../types';
import CrimsonGlow from '../components/CrimsonGlow';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Props = StackScreenProps<ProfileStackParamList, 'ProfileMain'>;

interface MenuItem {
  icon: IoniconName;
  label: string;
  value?: string;
  color: string;
  route?: keyof ProfileStackParamList;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, credits, logout } = useApp();
  const insets = useSafeAreaInsets();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      // Web: trigger native file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setAvatarUri(reader.result as string);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Profile Picture',
        'Photo picker requires expo-image-picker. Install it to enable on mobile.',
        [{ text: 'OK' }],
      );
    }
  };

  const menuItems: MenuItem[] = [
    { icon: 'shield-checkmark', label: 'Verified Profile', value: 'Active', color: COLORS.success },
    { icon: 'heart-circle', label: 'Credits', value: `${credits} remaining`, color: COLORS.gold, route: 'BuyCreditsProfile' },
    { icon: 'notifications', label: 'Notifications', color: COLORS.textSecondary, route: 'Notifications' },
    { icon: 'lock-closed', label: 'Privacy', color: COLORS.textSecondary, route: 'Privacy' },
    { icon: 'help-circle', label: 'Help & Support', color: COLORS.textSecondary, route: 'HelpSupport' },
    { icon: 'document-text', label: 'Terms & Privacy Policy', color: COLORS.textSecondary, route: 'Terms' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
        <LinearGradient colors={['#1A0A0A', COLORS.background]} style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

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
          <TouchableOpacity style={styles.buyMoreBtn} onPress={() => navigation.navigate('BuyCreditsProfile')}>
            <Text style={styles.buyMoreText}>Buy More</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === 4 && { borderBottomWidth: 0 }]}
              onPress={() => item.route && navigation.navigate(item.route)}
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

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footerNoteWrap}>
          <Text style={styles.version}>Gostart v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 30 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 58, marginBottom: 8 },
  screenTitle: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 10, paddingTop: 30, paddingHorizontal: SPACING.lg },
  avatarWrap: { width: 90, height: 90, marginBottom: 8, position: 'relative' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { color: '#fff', fontSize: 36, fontFamily: FONTS.displayBold },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  userName: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONTS.displayBold, marginBottom: 2 },
  userEmail: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  verifiedPillText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  creditsCard: { marginHorizontal: SPACING.lg, backgroundColor: 'rgba(201, 168, 76, 0.1)', borderRadius: BORDER_RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.3)', marginBottom: 10 },
  creditsCardLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  creditsCardCount: { color: COLORS.gold, fontSize: 32, fontFamily: FONTS.displayBold },
  creditsCardSub: { color: COLORS.textMuted, fontSize: 11 },
  buyMoreBtn: { backgroundColor: COLORS.gold, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 18, paddingVertical: 10 },
  buyMoreText: { color: '#000', fontFamily: FONTS.semiBold, fontSize: 13 },
  menuSection: { marginHorizontal: SPACING.lg, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: COLORS.textPrimary, fontSize: 15, flex: 1 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: SPACING.lg, marginTop: 10, marginBottom: 6, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(231, 76, 60, 0.08)', borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.2)' },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
  footerNoteWrap: { alignItems: 'center', paddingTop: 6 },
  version: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
