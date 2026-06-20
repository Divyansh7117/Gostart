// Mandatory onboarding — every user completes their profile here right after
// signing up, across 3 pages, including a device-picked profile photo.
// When finished, the saved user has onboardingComplete=true, which flips the
// root navigator from this screen to the main app automatically.

import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, BORDER_RADIUS, SPACING, FONTS, CONTENT_MAX_WIDTH } from '../theme';
import { saveProfile } from '../services/api';
import { useApp } from '../context/AppContext';
import CrimsonGlow from '../components/CrimsonGlow';

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
const LOVE_LANGUAGES = ['Quality Time', 'Acts of Service', 'Words of Affirmation', 'Physical Touch', 'Gifts'];
const TOTAL_PAGES = 3;

export default function OnboardingScreen() {
  const { user, setUser } = useApp();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [photo, setPhoto] = useState(user?.photo ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary'>(
    (user?.gender as 'male' | 'female' | 'non-binary') ?? 'male',
  );
  const [city, setCity] = useState(user?.city ?? '');
  const [height, setHeight] = useState(user?.height ?? '');
  const [religion, setReligion] = useState(user?.religion ?? '');
  const [profession, setProfession] = useState(user?.profession ?? '');
  const [college, setCollege] = useState(user?.college ?? '');
  const [about, setAbout] = useState(user?.about ?? '');
  const [tags, setTags] = useState((user?.tags ?? []).join(', '));
  const [weekendVibe, setWeekendVibe] = useState(user?.weekendVibe ?? '');
  const [firstDateIdea, setFirstDateIdea] = useState(user?.firstDateIdea ?? '');
  const [loveLanguage, setLoveLanguage] = useState(user?.loveLanguage ?? '');

  const parsedTags = useMemo(
    () => tags.split(',').map((t) => t.trim()).filter(Boolean),
    [tags],
  );

  const pickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Please allow photo access to add a profile picture.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        // Persist as a base64 data URI so it survives reloads (works on web + native)
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPhoto(uri);
      }
    } catch (err) {
      Alert.alert('Could not pick image', err instanceof Error ? err.message : 'Try again.');
    }
  };

  const validatePage = (): boolean => {
    if (page === 0) {
      if (!photo) { Alert.alert('Add a photo', 'A profile photo helps you get better matches.'); return false; }
      if (!name.trim()) { Alert.alert('Your name', 'Please enter your name.'); return false; }
      if (!age || Number(age) < 18) { Alert.alert('Your age', 'You must be at least 18.'); return false; }
      if (!city.trim()) { Alert.alert('Your city', 'Please enter your city.'); return false; }
    }
    if (page === 1) {
      if (!height.trim()) { Alert.alert('Height', 'Please add your height.'); return false; }
      if (!profession.trim()) { Alert.alert('Profession', 'Please add your profession.'); return false; }
    }
    if (page === 2) {
      if (!about.trim()) { Alert.alert('About you', 'Tell us a little about yourself.'); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validatePage()) return;
    if (page < TOTAL_PAGES - 1) setPage((p) => p + 1);
    else finish();
  };

  const finish = async () => {
    setLoading(true);
    try {
      const data = await saveProfile({
        name: name.trim(),
        age: Number(age),
        gender,
        city: city.trim(),
        height: height.trim(),
        religion: religion.trim(),
        profession: profession.trim(),
        college: college.trim(),
        about: about.trim(),
        tags: parsedTags,
        weekendVibe: weekendVibe.trim(),
        firstDateIdea: firstDateIdea.trim(),
        loveLanguage: loveLanguage.trim(),
        photo,
      });
      if (data.success) setUser(data.user); // flips navigator to Main
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const titles = ['The basics', 'A bit more', 'Your personality'];
  const subtitles = [
    'A photo and a few essentials to get started.',
    'Details that help us find your people.',
    'What makes you, you.',
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <CrimsonGlow />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          {page > 0 ? (
            <TouchableOpacity onPress={() => setPage((p) => p - 1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : <View style={{ width: 24 }} />}

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive, i < page && styles.dotDone]} />
            ))}
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{titles[page]}</Text>
          <Text style={styles.subtitle}>{subtitles[page]}</Text>

          {page === 0 && (
            <>
              <TouchableOpacity style={styles.photoWrap} onPress={pickPhoto} activeOpacity={0.85}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={28} color={COLORS.textSecondary} />
                  </View>
                )}
                <View style={styles.photoBadge}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to {photo ? 'change' : 'add'} your photo</Text>

              <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
              <Field label="Age" value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" />
              <Text style={styles.label}>Gender</Text>
              <View style={styles.chipRow}>
                {(['male', 'female', 'non-binary'] as const).map((g) => (
                  <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                      {g === 'non-binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Mumbai" />
            </>
          )}

          {page === 1 && (
            <>
              <Field label="Height" value={height} onChangeText={setHeight} placeholder={"e.g. 5'7\""} />
              <Text style={styles.label}>Religion</Text>
              <View style={styles.chipWrap}>
                {RELIGIONS.map((r) => (
                  <TouchableOpacity key={r} style={[styles.chip, religion === r && styles.chipActive]} onPress={() => setReligion(r)}>
                    <Text style={[styles.chipText, religion === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Profession" value={profession} onChangeText={setProfession} placeholder="e.g. Software Engineer" />
              <Field label="College (optional)" value={college} onChangeText={setCollege} placeholder="Where you studied" />
            </>
          )}

          {page === 2 && (
            <>
              <Field label="About you" value={about} onChangeText={setAbout} placeholder="A few lines about yourself" multiline />
              <Field label="Interests / tags" value={tags} onChangeText={setTags} placeholder="Coffee, Hiking, Music (comma separated)" />
              <Field label="Weekend vibe" value={weekendVibe} onChangeText={setWeekendVibe} placeholder="How you spend weekends" />
              <Field label="First date idea" value={firstDateIdea} onChangeText={setFirstDateIdea} placeholder="Your ideal first date" />
              <Text style={styles.label}>Love language</Text>
              <View style={styles.chipWrap}>
                {LOVE_LANGUAGES.map((l) => (
                  <TouchableOpacity key={l} style={[styles.chip, loveLanguage === l && styles.chipActive]} onPress={() => setLoveLanguage(l)}>
                    <Text style={[styles.chipText, loveLanguage === l && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={next} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{page < TOTAL_PAGES - 1 ? 'Continue' : 'Finish & Start Matching'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label, ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, inputProps.multiline && styles.multiline]}
        placeholderTextColor={COLORS.textMuted}
        {...inputProps}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  dotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 28, height: 5, borderRadius: 3, backgroundColor: COLORS.cardBorder },
  dotActive: { backgroundColor: COLORS.primary, width: 34 },
  dotDone: { backgroundColor: COLORS.primaryLight },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  title: { color: COLORS.textPrimary, fontSize: 26, fontFamily: FONTS.displayBold, marginBottom: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.lg, lineHeight: 20 },

  photoWrap: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, marginTop: 4, position: 'relative' },
  photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: COLORS.primary },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.cardBorder, borderStyle: 'dashed',
  },
  photoBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  photoHint: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: SPACING.lg },

  label: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.semiBold, marginBottom: 8, marginTop: SPACING.md },
  input: {
    backgroundColor: '#111', borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 13, color: COLORS.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  multiline: { minHeight: 92, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.chipInactive, borderWidth: 1, borderColor: COLORS.chipBorder },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
  chipTextActive: { color: '#fff' },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold, letterSpacing: 0.2 },
});
