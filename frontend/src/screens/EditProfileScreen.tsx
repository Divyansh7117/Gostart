import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { useApp } from '../context/AppContext';
import type { ProfileStackParamList } from '../types';

type Props = StackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [city, setCity] = useState('');
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    Alert.alert('Profile updated', 'Your changes have been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveLink}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Full Name">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
            />
          </Field>

          <Field label="Age">
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Your age"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={2}
              selectionColor={COLORS.primary}
            />
          </Field>

          <Field label="City">
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Where do you live?"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
            />
          </Field>

          <Field label="Profession">
            <TextInput
              style={styles.input}
              value={profession}
              onChangeText={setProfession}
              placeholder="What do you do?"
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
            />
          </Field>

          <Field label="About Me">
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others a bit about yourself..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={COLORS.primary}
            />
          </Field>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.semiBold, letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 58,
  },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.displayBold },
  saveLink: { color: COLORS.gold, fontSize: 15, fontFamily: FONTS.semiBold },

  form: {
    paddingHorizontal: 24,
    paddingTop: 61,
    gap: SPACING.lg,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    fontFamily: FONTS.regular,
  },
  bioInput: {
    height: 110,
    paddingTop: 14,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold },
});
