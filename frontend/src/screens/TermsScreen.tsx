import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating a Gostart account, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use our service. These terms constitute a legally binding agreement between you and Gostart.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old to use Gostart. By using the app, you represent that you meet this age requirement and that you will comply with all applicable laws.',
  },
  {
    title: '3. User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. Each person may only maintain one account. Providing false or misleading information may result in account suspension.',
  },
  {
    title: '4. Credits & Payments',
    body: 'Credits are purchased through in-app payment and are non-refundable. Credits do not expire and carry forward indefinitely. One credit is deducted each time you start a new conversation with a match.',
  },
  {
    title: '5. User Conduct',
    body: 'Users must treat others with respect. Harassment, hate speech, spam, or sharing inappropriate content is strictly prohibited. Violations will result in immediate account termination.',
  },
  {
    title: '6. Privacy Policy',
    body: 'We collect only the information necessary to provide our service. Your personal data is encrypted and stored securely. We do not sell or share your data with third parties for marketing purposes. You can request deletion of your data at any time by contacting support.',
  },
  {
    title: '7. Content Ownership',
    body: 'You retain ownership of the content you create on Gostart. By posting content, you grant us a non-exclusive license to display it within the app for the purpose of providing our service.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'Gostart is provided "as is." We do not guarantee matches or relationship outcomes. We are not liable for any actions taken by other users on the platform.',
  },
  {
    title: '9. Contact',
    body: 'For questions about these terms, contact us at legal@gostart.app.',
  },
];

export default function TermsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Privacy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, height: 58 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  content: { paddingHorizontal: 24, paddingTop: 61 },
  lastUpdated: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.semiBold, marginBottom: SPACING.sm },
  sectionBody: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
});
