import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  { question: 'How does matching work?', answer: 'Set your preferences using filters, then swipe to find a match. Our algorithm searches verified profiles that match your criteria. Each conversation costs 1 credit.' },
  { question: 'What are credits?', answer: 'Credits are used to start conversations with your matches. You can purchase credits in packs of 5. Credits never expire and carry forward forever.' },
  { question: 'How do I get verified?', answer: 'All Gostart accounts are verified through email during sign-up. We ensure all profiles represent real people looking for genuine connections.' },
  { question: 'Can I get a refund?', answer: 'Credits are non-refundable once purchased. However, unused credits never expire, so you can use them whenever you\'re ready.' },
  { question: 'How do I report someone?', answer: 'If you encounter inappropriate behavior, you can report the user from within the chat screen. Our team reviews all reports within 24 hours.' },
  { question: 'Is my data safe?', answer: 'We take privacy seriously. Your personal data is encrypted and never shared with third parties. See our Privacy Policy for full details.' },
];

interface ContactOption {
  icon: IoniconName;
  label: string;
  description: string;
}

const CONTACT_OPTIONS: ContactOption[] = [
  { icon: 'mail', label: 'Email Support', description: 'support@gostart.app' },
  { icon: 'chatbubble-ellipses', label: 'Live Chat', description: 'Available 9 AM - 9 PM IST' },
  { icon: 'logo-instagram', label: 'Instagram', description: '@gostart.app' },
];

export default function HelpSupportScreen({ navigation }: any) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 49 }}>
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqRow, i === FAQS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setExpanded(expanded === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
              </View>
              {expanded === i && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Contact Us</Text>
        <View style={styles.card}>
          {CONTACT_OPTIONS.map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.contactRow, i === CONTACT_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${COLORS.primary}18` }]}>
                <Ionicons name={opt.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.contactLabel}>{opt.label}</Text>
                <Text style={styles.contactDesc}>{opt.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
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
  faqRow: { paddingVertical: 14, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium, flex: 1, marginRight: 8 },
  faqAnswer: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  contactLabel: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium },
  contactDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
