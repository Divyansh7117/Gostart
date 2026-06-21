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
  PanResponder,
  Image,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../theme';
import { saveFilters } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Filters } from '../types';

// web uses two overlapping <input type="range"> on a shared track
// native uses custom PanResponder thumbs since there's no built-in range slider

const THUMB = 24;
const TRACK_H = 4;
const RANGE_STYLE_ID = 'gostart-range-slider';

function RangeSlider({
  minValue, maxValue, min, max, onMinChange, onMaxChange,
}: {
  minValue: number; maxValue: number;
  min: number; max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // inject thumb styles once so we don't repeat them on every render
    if ((document as any).getElementById(RANGE_STYLE_ID)) return;
    const style = (document as any).createElement('style');
    style.id = RANGE_STYLE_ID;
    style.textContent = `
      .gs-range {
        -webkit-appearance: none; appearance: none;
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        background: transparent; outline: none; border: none;
        margin: 0; padding: 0; pointer-events: none;
      }
      .gs-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 22px; height: 22px; border-radius: 50%;
        background: ${COLORS.primary}; border: 2px solid #fff;
        box-shadow: 0 1px 5px rgba(0,0,0,0.45);
        cursor: pointer; pointer-events: all;
      }
      .gs-range::-moz-range-thumb {
        width: 22px; height: 22px; border-radius: 50%;
        background: ${COLORS.primary}; border: 2px solid #fff;
        box-shadow: 0 1px 5px rgba(0,0,0,0.45);
        cursor: pointer; pointer-events: all;
      }
      .gs-range::-webkit-slider-runnable-track { background: transparent; }
      .gs-range::-moz-range-track { background: transparent; }
    `;
    (document as any).head.appendChild(style);
  }, []);

  if (Platform.OS === 'web') {
    const minPct = ((minValue - min) / (max - min)) * 100;
    const maxPct = ((maxValue - min) / (max - min)) * 100;
    return createElement(
      'div',
      { style: { position: 'relative', height: 36, width: '100%', display: 'flex', alignItems: 'center' } },
      createElement('div', { style: { position: 'absolute', left: 0, right: 0, height: TRACK_H, backgroundColor: COLORS.cardBorder, borderRadius: 2 } }),
      createElement('div', { style: { position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`, height: TRACK_H, backgroundColor: COLORS.primary, borderRadius: 2 } }),
      // bump min input z-index when near the right edge so max thumb stays grabbable
      createElement('input', {
        type: 'range', className: 'gs-range',
        min, max, value: minValue,
        style: { zIndex: minPct > 90 ? 3 : 1 },
        onChange: (e: any) => { const v = Number(e.target.value); if (v < maxValue) onMinChange(v); },
      }),
      createElement('input', {
        type: 'range', className: 'gs-range',
        min, max, value: maxValue,
        style: { zIndex: 2 },
        onChange: (e: any) => { const v = Number(e.target.value); if (v > minValue) onMaxChange(v); },
      }),
    );
  }

  // native slider — refs give PanResponder stale-closure-free access to current values
  const [minVal, setMinVal] = useState(minValue);
  const [maxVal, setMaxVal] = useState(maxValue);
  const [trackWidth, setTrackWidth] = useState(0);

  const minRef = useRef(minValue);
  const maxRef = useRef(maxValue);
  const twRef  = useRef(0);

  // sync when parent resets the sheet
  useEffect(() => { minRef.current = minValue; setMinVal(minValue); }, [minValue]);
  useEffect(() => { maxRef.current = maxValue; setMaxVal(maxValue); }, [maxValue]);

  const toValue = (r: number) => Math.round(min + r * (max - min));
  const toRatio = (v: number) => (v - min) / (max - min);
  const clamp   = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const minStart = useRef(0);
  const maxStart = useRef(0);

  // PanResponder ref trick so stale closures don't capture old values
  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { minStart.current = toRatio(minRef.current); },
      onPanResponderMove: (_, g) => {
        if (!twRef.current) return;
        const ratio = clamp(minStart.current + g.dx / twRef.current, 0, toRatio(maxRef.current) - 0.04);
        const val   = toValue(ratio);
        minRef.current = val;
        setMinVal(val);
        onMinChange(val);
      },
    }),
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { maxStart.current = toRatio(maxRef.current); },
      onPanResponderMove: (_, g) => {
        if (!twRef.current) return;
        const ratio = clamp(maxStart.current + g.dx / twRef.current, toRatio(minRef.current) + 0.04, 1);
        const val   = toValue(ratio);
        maxRef.current = val;
        setMaxVal(val);
        onMaxChange(val);
      },
    }),
  ).current;

  const minPct = toRatio(minVal);
  const maxPct = toRatio(maxVal);

  return (
    <View
      style={styles.nativeTrackContainer}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - THUMB;
        twRef.current = w;
        setTrackWidth(w);
      }}
    >
      <View style={[styles.nativeTrack, { left: THUMB / 2, right: THUMB / 2 }]} />
      <View style={[
        styles.nativeTrackFill,
        { left: THUMB / 2 + minPct * trackWidth, width: Math.max(0, (maxPct - minPct) * trackWidth) },
      ]} />
      <View
        {...minPan.panHandlers}
        style={[styles.nativeThumb, { left: minPct * trackWidth }]}
      />
      <View
        {...maxPan.panHandlers}
        style={[styles.nativeThumb, { left: maxPct * trackWidth, zIndex: 2 }]}
      />
    </View>
  );
}

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT  = Math.min(SCREEN_HEIGHT * 0.75, 600);

const LOOKING_FOR_OPTIONS  = ['Men', 'Women', 'LGBTQ+'] as const;
const LOCATION_OPTIONS     = ['Nearby', 'Same City', 'Anywhere'] as const;
const RELIGION_OPTIONS     = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'] as const;
const PROFESSION_OPTIONS   = ['Any', 'Student', 'Working Professional', 'Founder / Entrepreneur'] as const;

export default function FiltersBottomSheet({ visible, onClose }: FiltersBottomSheetProps) {
  const { filters, updateFilters } = useApp();

  const [lookingFor, setLookingFor] = useState(filters.lookingFor);
  const [minAge, setMinAge]         = useState(filters.minAge);
  const [maxAge, setMaxAge]         = useState(filters.maxAge);
  const [location, setLocation]     = useState(filters.location);
  const [religion, setReligion]     = useState<string | null>(filters.religion);
  const [profession, setProfession] = useState<string | null>(filters.profession);
  const [showReligionDrop, setShowReligionDrop]     = useState(false);
  const [showProfessionDrop, setShowProfessionDrop] = useState(false);

  // animate the sheet in/out — spring on open, quick ease on close
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // reset local state to match context each time the sheet opens
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
    // save is best-effort — non-fatal if offline
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
        {/* tap outside the sheet to close */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[styles.floatingCloseWrap, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.75}>
            <Image source={require('../../assets/icons/closefilter.png')} style={styles.closeIcon} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>

            <Text style={styles.sectionLabel}>I'm looking for</Text>
            <ChipRow options={LOOKING_FOR_OPTIONS} selected={lookingFor} onSelect={setLookingFor} />

            <Text style={styles.sectionLabel}>Age range</Text>
            <View style={styles.ageLabelRow}>
              <Text style={styles.ageLabel}>{minAge}</Text>
              <Text style={styles.ageDash}>–</Text>
              <Text style={styles.ageLabel}>{maxAge}</Text>
              <Text style={styles.ageDash}>yrs</Text>
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
  floatingCloseWrap: { position: 'absolute', bottom: SHEET_HEIGHT + 12, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  closeIcon: { width: 44, height: 44 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT, backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  sectionLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semiBold, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  optional: { color: COLORS.textSecondary, fontFamily: FONTS.regular },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.chipInactive, borderWidth: 1, borderColor: COLORS.chipBorder },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary },
  ageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ageLabel: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semiBold },
  ageDash: { color: COLORS.textSecondary, fontSize: 14 },
  nativeTrackContainer: { width: '100%', height: 44, justifyContent: 'center' },
  nativeTrack: { position: 'absolute', height: TRACK_H, backgroundColor: COLORS.cardBorder, borderRadius: 2 },
  nativeTrackFill: { position: 'absolute', height: TRACK_H, backgroundColor: COLORS.primary, borderRadius: 2, top: (44 - TRACK_H) / 2 },
  nativeThumb: {
    position: 'absolute',
    width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: COLORS.primary,
    borderWidth: 2, borderColor: '#fff',
    top: (44 - THUMB) / 2,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.chipBorder },
  dropdownPlaceholder: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular },
  dropdownValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
  chevron: { color: COLORS.textSecondary, fontSize: 12 },
  dropdownList: { backgroundColor: COLORS.chipInactive, borderRadius: BORDER_RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: COLORS.chipBorder, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropdownItemText: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.regular },
});
