import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
  StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS, CONTENT_MAX_WIDTH } from '../theme';
import { loginUser, registerUser } from '../services/api';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Oops', 'Please fill in all required fields.');
      return;
    }

    if (isSignUp && (!name || !age)) {
      Alert.alert('Oops', 'Please enter your name and age to continue.');
      return;
    }

    if (isSignUp && password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = isSignUp
        ? await registerUser(name, email, password, parseInt(age, 10), gender)
        : await loginUser(email, password);

      // New users land on the onboarding flow automatically (onboardingComplete=false)
      if (data.success) await login(data.user, data.token, remember);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const data = await loginUser('demo@gostart.app', 'demo123');
      if (data.success) await login(data.user, data.token, remember);
    } catch (err) {
      Alert.alert('Demo login failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoStack}>
              <Image source={require('../../assets/icons/Logomark.png')} style={styles.logoIcon} resizeMode="contain" />
              <Text style={styles.brand}>Gostart</Text>
            </View>
            <Text style={styles.tagline}>Verified profiles. Serious intentions.</Text>
            <Text style={styles.subtag}>Join with a profile that feels like you.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleOption, !isSignUp && styles.toggleOptionActive]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, isSignUp && styles.toggleOptionActive]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formTitle}>
              {isSignUp ? 'Start your journey' : 'Welcome back'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isSignUp
                ? 'A few basics to get started — you\'ll set up your profile next.'
                : 'Sign in to continue where you left off.'}
            </Text>

            <>
                {isSignUp && (
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((value) => !value)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {isSignUp && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor={COLORS.textMuted}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                    />
                    <View style={styles.genderRow}>
                      {(['male', 'female'] as const).map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[styles.genderChip, gender === value && styles.genderChipActive]}
                          onPress={() => setGender(value)}
                        >
                          <Text style={[styles.genderText, gender === value && styles.genderTextActive]}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
            </>

            {isSignUp && (
              <Text style={styles.passwordHint}>Use at least 8 characters.</Text>
            )}

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create Account' : 'Login'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignUp((value) => !value)}
              style={styles.toggleRow}
              activeOpacity={0.7}
            >
              <Text style={styles.togglePrompt}>
                {isSignUp ? 'Already have an account? ' : 'New here? '}
                <Text style={styles.toggleLink}>{isSignUp ? 'Login' : 'Sign Up'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.demoBtn} onPress={handleDemoLogin} disabled={loading} activeOpacity={0.7}>
            <Text style={styles.demoBtnText}>Try Demo Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  hero: { alignItems: 'center', marginBottom: SPACING.xl, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  logoStack: { alignItems: 'center', marginBottom: SPACING.sm },
  logoIcon: { width: 88, height: 88, marginBottom: 2 },
  brand: { color: COLORS.textPrimary, fontSize: 34, fontFamily: FONTS.displayBold },
  tagline: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.medium, marginTop: 6 },
  subtag: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.lg, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  togglePill: { flexDirection: 'row', backgroundColor: '#111', borderRadius: BORDER_RADIUS.full, padding: 4, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  toggleOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BORDER_RADIUS.full },
  toggleOptionActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.medium },
  toggleTextActive: { color: '#fff' },
  formTitle: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONTS.displayBold, marginBottom: 4 },
  formSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.md, lineHeight: 19 },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  backStepText: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.medium },
  input: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 13, color: COLORS.textPrimary, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  multilineInput: { minHeight: 88, textAlignVertical: 'top' },
  passwordRow: { position: 'relative', marginBottom: 12 },
  passwordInput: { marginBottom: 0, paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  genderChip: { flex: 1, paddingVertical: 13, borderRadius: BORDER_RADIUS.md, backgroundColor: '#111', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  genderChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  genderTextActive: { color: '#fff' },
  passwordHint: { color: COLORS.textMuted, fontSize: 12, marginTop: -4, marginBottom: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rememberText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold, letterSpacing: 0.2 },
  toggleRow: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 4 },
  togglePrompt: { color: COLORS.textSecondary, fontSize: 14 },
  toggleLink: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  demoBtn: { alignItems: 'center', paddingVertical: 14 },
  demoBtnText: { color: COLORS.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
