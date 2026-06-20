export const COLORS = {
  // ── Figma color tokens ─────────────────────────────────────────────────────
  crimson:  '#710014',          // brand red (Figma: crimson)
  sand:     '#F2F1ED',          // primary light surface/text (Figma: sand)
  obsidian: '#0A0A0A',          // deepest background (Figma: obsidian)

  // ── Semantic aliases (used throughout screens) ─────────────────────────────
  background:    '#0A0A0A',
  card:          '#161616',
  cardBorder:    '#222222',

  primary:       '#710014',     // crimson
  primaryDark:   '#3D0009',
  primaryLight:  '#A0001E',

  gold:          '#C9A84C',
  goldLight:     '#E8C76B',

  textPrimary:   '#F2F1ED',     // sand
  textSecondary: '#8A8A8A',
  textMuted:     '#555555',

  chipActive:    '#710014',
  chipInactive:  '#1A1A1A',
  chipBorder:    '#2E2E2E',

  success: '#2ECC71',
  error:   '#E74C3C',
  errorBg: 'rgba(231, 76, 60, 0.12)',

  overlay:      'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  navBackground: '#161616',
  navActive:     '#F2F1ED',
  navInactive:   '#767676',
} as const;

export const FONTS = {
  // Display headings — DM Serif Display (Figma: DMSerifDisplay)
  displayBold:    'DMSerifDisplay_400Regular',
  displayItalic:  'DMSerifDisplay_400Regular_Italic',

  // UI / body text — Outfit (Figma: Outfit)
  regular:  'Outfit_400Regular',
  medium:   'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold:     'Outfit_700Bold',
} as const;

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   28,
  full: 999,
} as const;

// Phone-first layout: on tablets / foldables / wide windows, content is capped
// to this width and centered so it stays a readable column instead of stretching.
export const CONTENT_MAX_WIDTH = 520;
