// Login / Register screen.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
  StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';
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

  const handleSubmit = async () => {
    if (!email || !password) { Alert.alert('Oops', 'Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      const data = isSignUp
        ? await registerUser(name, email, password, parseInt(age, 10), gender)
        : await loginUser(email, password);
      if (data.success) await login(data.user, data.token);
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
      if (data.success) await login(data.user, data.token);
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
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image source={require('../../assets/icons/Logomark.png')} style={styles.logoIcon} resizeMode="contain" />
            <Text style={styles.tagline}>Verified profiles. Serious Intentions.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

            {isSignUp && (
              <TextInput
                style={styles.input} placeholder="Your name"
                placeholderTextColor={COLORS.textMuted} value={name}
                onChangeText={setName} autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input} placeholder="Email address"
              placeholderTextColor={COLORS.textMuted} value={email}
              onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" autoCorrect={false}
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password" placeholderTextColor={COLORS.textMuted}
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <>
                <TextInput
                  style={styles.input} placeholder="Age"
                  placeholderTextColor={COLORS.textMuted} value={age}
                  onChangeText={setAge} keyboardType="numeric"
                />
                <View style={styles.genderRow}>
                  {(['male', 'female'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, gender === g && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create Account' : 'Login'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(p => !p)} style={styles.toggleRow} activeOpacity={0.7}>
              <Text style={styles.toggleText}>
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
  logoArea: { alignItems: 'center', marginBottom: SPACING.xl },
  logoIcon: { width: 120, height: 120, marginBottom: SPACING.sm },
  tagline: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.lg },
  formTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: SPACING.lg },
  input: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.md, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 13, color: COLORS.textPrimary, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  passwordRow: { position: 'relative', marginBottom: 12 },
  passwordInput: { marginBottom: 0, paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  genderChip: { flex: 1, paddingVertical: 13, borderRadius: BORDER_RADIUS.md, backgroundColor: '#111', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  genderChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  genderTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  toggleRow: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 4 },
  toggleText: { color: COLORS.textSecondary, fontSize: 14 },
  toggleLink: { color: COLORS.primary, fontWeight: '600' },
  demoBtn: { alignItems: 'center', paddingVertical: 14 },
  demoBtnText: { color: COLORS.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
