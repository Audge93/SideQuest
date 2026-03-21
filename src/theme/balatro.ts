// Whimsical & Bright design system for Side Quest v3

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
  catAction: '#FFD080',
  catRide: '#F09090',
  catFood: '#F5B882',
  catPin: '#C8A4F0',
  catCharacter: '#F0A4D0',
  catExploration: '#82D0DC',
  catScavenger: '#B0D878',
};

export const CATEGORY_COLORS: Record<string, string> = {
  observation: COLORS.catObservation,
  photo: COLORS.catPhoto,
  trivia: COLORS.catTrivia,
  action: COLORS.catAction,
  ride: COLORS.catRide,
  food: COLORS.catFood,
  pin: COLORS.catPin,
  character: COLORS.catCharacter,
  exploration: COLORS.catExploration,
  scavenger: COLORS.catScavenger,
};

// Display names for categories
export const CATEGORY_LABELS: Record<string, string> = {
  observation: 'Find',
  photo: 'Photo',
  trivia: 'Trivia',
  action: 'Act',
  ride: 'Ride',
  food: 'Treat',
  pin: 'Pins',
  character: 'Meet',
  exploration: 'Explore',
  scavenger: 'Seek',
};

export const CATEGORY_ICONS: Record<string, string> = {
  observation: '🔍',
  photo: '📸',
  trivia: '🧠',
  action: '🎬',
  ride: '🎢',
  food: '🍦',
  pin: '📌',
  character: '🎭',
  exploration: '🗺️',
  scavenger: '🎯',
};

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

export const RADII = {
  card: 20,
  button: 14,
  chip: 20,
  panel: 16,
  pill: 24,
};
