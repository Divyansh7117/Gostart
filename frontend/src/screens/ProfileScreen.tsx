import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Image, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, BORDER_RADIUS, SPACING, FONTS, CONTENT_MAX_WIDTH } from '../theme';
import { useApp } from '../context/AppContext';
import { saveProfile } from '../services/api';
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
  const { user, credits, logout, setUser } = useApp();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) {
        logout();
      }
      return;
    }
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') {
      // web doesn't have expo-image-picker so use a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const uri = reader.result as string;
          setUploading(true);
          try {
            const data = await saveProfile({ photo: uri });
            if (data.success) setUser(data.user);
          } catch { Alert.alert('Upload failed', 'Could not save photo.'); }
          finally { setUploading(false); }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // ask for permission first on native
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    // store as base64 so it works reliably across platforms
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

    setUploading(true);
    try {
      const data = await saveProfile({ photo: uri });
      if (data.success) setUser(data.user);
    } catch {
      Alert.alert('Upload failed', 'Could not save photo. Try again.');
    } finally {
      setUploading(false);
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

  const photoUri = user?.photo ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
        <LinearGradient colors={['#1A0A0A', COLORS.background]} style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={styles.avatarWrap} disabled={uploading}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name={uploading ? 'hourglass' : 'camera'} size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.success} />
            <Text style={styles.verifiedPillText}>Verified Account</Text>
          </View>
        </LinearGradient>

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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 58, marginBottom: 8, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
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
