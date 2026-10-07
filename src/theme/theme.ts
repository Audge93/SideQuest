/**
 * theme.ts
 *
 * Centralized design tokens for the app. Keeping shared colors, shadows, and
 * radii here makes the UI consistent across gameplay, menus, cards, and modals.
 */

export const COLORS = {
  // Backgrounds
  bg: '#FEFCF8',
  bgLight: '#FFFDF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F5F0',

  // Primary actions
  green: '#78D4A0',
  greenDark: '#5CB888',
  red: '#F09090',
  redDark: '#D47878',
  blue: '#89B4F7',
  blueDark: '#6E9AE0',

  // Accent
  gold: '#F0D878',
  goldDark: '#D4BE60',

  // Neutrals
  white: '#FFFFFF',
  cardBg: '#FFFDF8',
  textDark: '#2D3748',
  textBody: '#4A5568',
  textMuted: '#A0AEC0',
  textLight: '#CBD5E0',
  black: '#1A202C',

  // Borders
  borderLight: '#EDF2F7',
  borderMedium: '#E2E8F0',
  borderPanel: '#E2E8F0',

  // Category colors — soft pastels
  catObservation: '#89B4F7',
  catPhoto: '#7CCFA6',
  catTrivia: '#F0D878',
  catAction: '#C0B0F5',
  catRide: '#F09090',
  catFood: '#F5B882',
  catPin: '#F5A842',
  catCharacter: '#F0A4D0',
  catExploration: '#82D0DC',
  catScavenger: '#B0D878',
};

// Maps internal category ids to the accent color used on task cards, icons,
// challenge badges, and other category-driven UI treatments.
export const CATEGORY_COLORS: Record<string, string> = {
  find: COLORS.catObservation,
  photo: COLORS.catPhoto,
  trivia: COLORS.catTrivia,
  act: COLORS.catAction,
  ride: COLORS.catRide,
  treat: COLORS.catFood,
  pins: COLORS.catPin,
  meet: COLORS.catCharacter,
  explore: COLORS.catExploration,
  seek: COLORS.catScavenger,
};

// ── Card-game look ──────────────────────────────────────────
// Display face for titles, numbers and buttons; body copy stays in the system font.
export const FONTS = {
  display: 'LilitaOne_400Regular',
};

// Dark outline used on cards, chips and buttons, plus the "table" behind them.
export const INK = '#2A1E3F';
export const TABLE = {
  felt: '#1B1430',
  panel: '#2E2348',
  panelLight: '#3C2F5C',
  gold: '#FFD45C',
  goldDark: '#C9971C',
  chipBlue: '#3B82F6',
  multRed: '#EF4444',
};

// Saturated frame colors so cards stay vivid on the dark table; pastel
// CATEGORY_COLORS remain for card art backgrounds.
export const CATEGORY_FRAME_COLORS: Record<string, string> = {
  find: '#3D7BE0',
  photo: '#1F9E68',
  trivia: '#D9A514',
  act: '#7B5FE0',
  ride: '#E0484F',
  treat: '#E57A2E',
  pins: '#D97A06',
  meet: '#D9479B',
  explore: '#1F9DB3',
  seek: '#5FA32A',
};

// Difficulty reads like card rarity.
export const RARITY = {
  easy: { label: 'Common', color: '#B8C0CC' },
  medium: { label: 'Rare', color: '#4C8DFF' },
  hard: { label: 'Epic', color: '#B054FF' },
} as const;

// Short user-facing labels for each category.
export const CATEGORY_LABELS: Record<string, string> = {
  find: 'Find',
  photo: 'Photo',
  trivia: 'Trivia',
  act: 'Act',
  ride: 'Ride',
  treat: 'Treat',
  pins: 'Pins',
  meet: 'Meet',
  explore: 'Explore',
  seek: 'Seek',
};

// Reusable depth presets so buttons, cards, and chips all cast shadows in a
// consistent way and preserve the same playful visual hierarchy.
export const SHADOWS = {
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  chip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
};

// Shared corner radii keep cards, panels, and buttons in the same shape family.
export const RADII = {
  card: 20,
  button: 14,
  chip: 20,
  panel: 16,
  pill: 24,
};
