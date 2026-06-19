import React, { useState, useRef, useEffect, createElement } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { saveFilters } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Filters } from '../types';

// Only import the native slider on non-web platforms to avoid web bundling errors
let NativeSlider: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  NativeSlider = require('@react-native-community/slider').default;
}

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

const LOOKING_FOR_OPTIONS = ['Men', 'Women', 'LGBTQ+'] as const;
const LOCATION_OPTIONS = ['Nearby', 'Same City', 'Anywhere'] as const;
const RELIGION_OPTIONS = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'] as const;
const PROFESSION_OPTIONS = ['Any', 'Student', 'Working Professional', 'Founder / Entrepreneur'] as const;

// Cross-platform slider: HTML range input on web, native Slider on mobile
function AgeSlider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
}: {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (v: number) => void;
}) {
  if (Platform.OS === 'web') {
    return createElement('input', {
      type: 'range',
      min: minimumValue,
      max: maximumValue,
      value,
      onChange: (e: any) => onValueChange(Number(e.target.value)),
      style: {
        width: '100%',
        accentColor: COLORS.primary,
        cursor: 'pointer',
        height: 30,
        background: 'transparent',
      },
    });
  }
  if (!NativeSlider) return null;
  return (
    <NativeSlider
      style={styles.slider}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      value={value}
      onValueChange={(v: number) => onValueChange(Math.round(v))}
      minimumTrackTintColor={COLORS.primary}
      maximumTrackTintColor={COLORS.cardBorder}
      thumbTintColor={COLORS.primary}
    />
  );
}

export default function FiltersBottomSheet({ visible, onClose }: FiltersBottomSheetProps) {
  const { filters, updateFilters } = useApp();

  const [lookingFor, setLookingFor] = useState(filters.lookingFor);
  const [minAge, setMinAge] = useState(filters.minAge);
  const [maxAge, setMaxAge] = useState(filters.maxAge);
  const [location, setLocation] = useState(filters.location);
  const [religion, setReligion] = useState<string | null>(filters.religion);
  const [profession, setProfession] = useState<string | null>(filters.profession);
  const [showReligionDrop, setShowReligionDrop] = useState(false);
  const [showProfessionDrop, setShowProfessionDrop] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setLookingFor(filters.lookingFor);
      setMinAge(filters.minAge);
      setMaxAge(filters.maxAge);
      setLocation(filters.location);
      setReligion(filters.religion);
      setProfession(filters.profession);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = async () => {
    const newFilters: Filters = { lookingFor, minAge, maxAge, location, religion, profession };
    updateFilters(newFilters);
    try { await saveFilters(newFilters); } catch { /* non-fatal */ }
    onClose();
  };

  const ChipRow = <T extends string>({
    options,
    selected,
    onSelect,
  }: {
    options: readonly T[];
    selected: string;
    onSelect: (v: T) => void;
  }) => (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>I'm looking for</Text>
          <ChipRow options={LOOKING_FOR_OPTIONS} selected={lookingFor} onSelect={setLookingFor} />

          <Text style={styles.sectionLabel}>Age range</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.ageLabel}>{minAge}</Text>
            <View style={styles.sliderContainer}>
              <AgeSlider
                value={minAge}
                minimumValue={18}
                maximumValue={maxAge - 1}
                onValueChange={setMinAge}
              />
              <AgeSlider
                value={maxAge}
                minimumValue={minAge + 1}
                maximumValue={60}
                onValueChange={setMaxAge}
              />
            </View>
            <Text style={styles.ageLabel}>{maxAge}</Text>
          </View>

          <Text style={styles.sectionLabel}>Location</Text>
          <ChipRow options={LOCATION_OPTIONS} selected={location} onSelect={setLocation} />

          <Text style={styles.sectionLabel}>
            Religion <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => { setShowReligionDrop((p) => !p); setShowProfessionDrop(false); }}
          >
            <Text style={religion ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {religion ?? 'Select religion'}
            </Text>
            <Ionicons name={showReligionDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showReligionDrop && (
            <View style={styles.dropdownList}>
              {RELIGION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => { setReligion(opt === 'Any' ? null : opt); setShowReligionDrop(false); }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>
            Profession <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => { setShowProfessionDrop((p) => !p); setShowReligionDrop(false); }}
          >
            <Text style={profession ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {profession ?? 'Select profession'}
            </Text>
            <Ionicons name={showProfessionDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showProfessionDrop && (
            <View style={styles.dropdownList}>
              {PROFESSION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => { setProfession(opt === 'Any' ? null : opt); setShowProfessionDrop(false); }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  sectionLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semiBold, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  optional: { color: COLORS.textSecondary, fontFamily: FONTS.regular },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.chipInactive, borderWidth: 1, borderColor: COLORS.chipBorder },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderContainer: { flex: 1 },
  slider: { width: '100%', height: 30 },
  ageLabel: { color: COLORS.textSecondary, fontSize: 13, width: 28, textAlign: 'center', fontFamily: FONTS.medium },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.chipBorder },
  dropdownPlaceholder: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular },
  dropdownValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
  dropdownList: { backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: COLORS.chipBorder, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemText: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
});
