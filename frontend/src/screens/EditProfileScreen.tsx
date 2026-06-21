import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { useApp } from '../context/AppContext';
import { saveProfile } from '../services/api';
import type { ProfileStackParamList } from '../types';

type Props = StackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useApp();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  // pre-fill every field from the current user object
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [city, setCity] = useState(user?.city ?? '');
  const [profession, setProfession] = useState(user?.profession ?? '');
  const [bio, setBio] = useState(user?.about ?? '');
  const [college, setCollege] = useState(user?.college ?? '');
  const [height, setHeight] = useState(user?.height ?? '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (age && (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100)) {
      Alert.alert('Invalid age', 'Please enter a valid age between 18 and 100.');
      return;
    }

    setSaving(true);
    try {
      const data = await saveProfile({
        name: name.trim(),
        age: age ? Number(age) : undefined,
        city: city.trim() || undefined,
        profession: profession.trim() || undefined,
        about: bio.trim() || undefined,
        college: college.trim() || undefined,
        height: height.trim() || undefined,
      });

      if (data.success) {
        // update the context so the profile screen shows the new values immediately
        setUser(data.user);
        Alert.alert('Saved!', 'Your profile has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
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
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Text style={styles.saveLink}>Save</Text>
            )}
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
              maxLength={3}
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

          <Field label="Height">
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder={`e.g. 5'10"`}
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

          <Field label="College / University">
            <TextInput
              style={styles.input}
              value={college}
              onChangeText={setCollege}
              placeholder="Where did you study?"
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

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
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
    paddingTop: 32,
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
