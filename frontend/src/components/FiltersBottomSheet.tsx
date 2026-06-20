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
  Image,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { saveFilters } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Filters } from '../types';

let NativeSlider: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  NativeSlider = require('@react-native-community/slider').default;
}

const RANGE_STYLE_ID = 'gostart-range-slider';

function RangeSlider({
  minValue, maxValue, min, max, onMinChange, onMaxChange,
}: {
  minValue: number; maxValue: number; min: number; max: number;
  onMinChange: (v: number) => void; onMaxChange: (v: number) => void;
}) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if ((document as any).getElementById(RANGE_STYLE_ID)) return;
    const style = (document as any).createElement('style');
    style.id = RANGE_STYLE_ID;
    style.textContent = `
      .gs-range {
        -webkit-appearance: none; appearance: none;
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        background: transparent; outline: none; border: none;
        margin: 0; padding: 0;
        pointer-events: none;
      }
      .gs-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 20px; height: 20px; border-radius: 50%;
        background: ${COLORS.primary};
        border: 2px solid #fff;
        box-shadow: 0 1px 5px rgba(0,0,0,0.45);
        cursor: pointer; pointer-events: all;
      }
      .gs-range::-moz-range-thumb {
        width: 20px; height: 20px; border-radius: 50%;
        background: ${COLORS.primary};
        border: 2px solid #fff;
        box-shadow: 0 1px 5px rgba(0,0,0,0.45);
        cursor: pointer; pointer-events: all;
        border-radius: 50%;
      }
      .gs-range::-webkit-slider-runnable-track { background: transparent; }
      .gs-range::-moz-range-track { background: transparent; }
    `;
    (document as any).head.appendChild(style);
  }, []);

  if (Platform.OS === 'web') {
    const minPct = ((minValue - min) / (max - min)) * 100;
    const maxPct = ((maxValue - min) / (max - min)) * 100;
    const minZ = minPct > 90 ? 3 : 1;

    return createElement('div', {
      style: { position: 'relative', height: 32, width: '100%', display: 'flex', alignItems: 'center' },
    },
      createElement('div', {
        style: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2 },
      }),
      createElement('div', {
        style: { position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`, height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
      }),
      createElement('input', {
        type: 'range', className: 'gs-range',
        min, max, value: minValue,
        onChange: (e: any) => { const v = Number(e.target.value); if (v < maxValue) onMinChange(v); },
        style: { zIndex: minZ },
      }),
      createElement('input', {
        type: 'range', className: 'gs-range',
        min, max, value: maxValue,
        onChange: (e: any) => { const v = Number(e.target.value); if (v > minValue) onMaxChange(v); },
        style: { zIndex: 2 },
      }),
    );
  }

  if (!NativeSlider) return null;
  return (
    <View style={{ width: '100%' }}>
      <NativeSlider
        style={styles.slider}
        minimumValue={min} maximumValue={max} value={minValue}
        onValueChange={(v: number) => { const r = Math.round(v); if (r < maxValue) onMinChange(r); }}
        minimumTrackTintColor={COLORS.primary} maximumTrackTintColor={COLORS.cardBorder} thumbTintColor={COLORS.primary}
      />
      <NativeSlider
        style={styles.slider}
        minimumValue={min} maximumValue={max} value={maxValue}
        onValueChange={(v: number) => { const r = Math.round(v); if (r > minValue) onMaxChange(r); }}
        minimumTrackTintColor={COLORS.cardBorder} maximumTrackTintColor={COLORS.primary} thumbTintColor={COLORS.primary}
      />
    </View>
  );
}

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.75, 600);

const LOOKING_FOR_OPTIONS = ['Men', 'Women', 'LGBTQ+'] as const;
const LOCATION_OPTIONS = ['Nearby', 'Same City', 'Anywhere'] as const;
const RELIGION_OPTIONS = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'] as const;
const PROFESSION_OPTIONS = ['Any', 'Student', 'Working Professional', 'Founder / Entrepreneur'] as const;


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
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250, useNativeDriver: false }).start();
    }
  }, [visible]);

  const handleClose = async () => {
    const newFilters: Filters = { lookingFor, minAge, maxAge, location, religion, profession };
    updateFilters(newFilters);
    try { await saveFilters(newFilters); } catch { /* non-fatal */ }
    onClose();
  };

  const ChipRow = <T extends string>({
    options, selected, onSelect,
  }: { options: readonly T[]; selected: string; onSelect: (v: T) => void }) => (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        {/* Dark scrim — tap to dismiss */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

        {/* Close icon — floats above the sheet, animates in sync */}
        <Animated.View style={[styles.floatingCloseWrap, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.75}>
            <Image
              source={require('../../assets/icons/closefilter.png')}
              style={styles.closeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom sheet — slides up with the same animation */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>I'm looking for</Text>
            <ChipRow options={LOOKING_FOR_OPTIONS} selected={lookingFor} onSelect={setLookingFor} />

            <Text style={styles.sectionLabel}>Age range</Text>
            <View style={styles.ageLabelRow}>
              <Text style={styles.ageLabel}>{minAge}</Text>
              <Text style={styles.ageDash}>–</Text>
              <Text style={styles.ageLabel}>{maxAge}</Text>
            </View>
            <RangeSlider
              min={18} max={60}
              minValue={minAge} maxValue={maxAge}
              onMinChange={setMinAge} onMaxChange={setMaxAge}
            />

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
              <Text style={styles.chevron}>{showReligionDrop ? '▲' : '▼'}</Text>
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
              <Text style={styles.chevron}>{showProfessionDrop ? '▲' : '▼'}</Text>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },

  // Close icon wrapper — positioned just above the sheet top
  floatingCloseWrap: {
    position: 'absolute',
    bottom: SHEET_HEIGHT + 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: { width: 44, height: 44 },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  sectionLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semiBold, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  optional: { color: COLORS.textSecondary, fontFamily: FONTS.regular },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.chipInactive, borderWidth: 1, borderColor: COLORS.chipBorder },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary },
  ageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ageLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semiBold },
  ageDash: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.regular },
  slider: { width: '100%', height: 30 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.chipBorder },
  dropdownPlaceholder: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular },
  dropdownValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
  chevron: { color: COLORS.textSecondary, fontSize: 12 },
  dropdownList: { backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: COLORS.chipBorder, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemText: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
});
