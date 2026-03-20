// Balatro-inspired design system for SideQuest

export const COLORS = {
  // Backgrounds — dark green felt poker table
  felt: '#1B3A2D',
  feltLight: '#234A3A',
  feltDark: '#142E23',
  surface: '#1E4535',
  surfaceLight: '#2A5A47',

  // Primary actions
  red: '#FE5F55',
  redDark: '#D94A42',
  blue: '#009DFF',
  blueDark: '#007ACC',
  gold: '#F5A623',
  goldDark: '#D48C1A',

  // Neutrals
  white: '#FFFFFF',
  cardWhite: '#FFFFFF',
  textDark: '#374151',
  textBody: '#1F2937',
  textMuted: '#9CA3AF',
  black: '#000000',

  // Borders
  borderLight: 'rgba(255,255,255,0.12)',
  borderPanel: 'rgba(255,255,255,0.18)',

  // Category colors (one per task type)
  catObservation: '#5B8DEF',
  catPhoto: '#4CAF82',
  catTrivia: '#E8C84A',
  catRide: '#E06464',
  catFood: '#F0954F',
  catPin: '#B07CE8',
  catCharacter: '#E87CB4',
  catExploration: '#4DB8C8',
  catScavenger: '#8BC34A',
};

export const CATEGORY_COLORS: Record<string, string> = {
  observation: COLORS.catObservation,
  photo: COLORS.catPhoto,
  trivia: COLORS.catTrivia,
  ride: COLORS.catRide,
  food: COLORS.catFood,
  pin: COLORS.catPin,
  character: COLORS.catCharacter,
  exploration: COLORS.catExploration,
  scavenger: COLORS.catScavenger,
};

export const CATEGORY_LABELS: Record<string, string> = {
  observation: 'Observation',
  photo: 'Photo',
  trivia: 'Trivia',
  ride: 'Ride',
  food: 'Food & Treat',
  pin: 'Pin Trading',
  character: 'Character',
  exploration: 'Exploration',
  scavenger: 'Scavenger',
};

export const CATEGORY_ICONS: Record<string, string> = {
  observation: '👁️',
  photo: '📸',
  trivia: '🧠',
  ride: '🎢',
  food: '🍦',
  pin: '📌',
  character: '🎭',
  exploration: '🗺️',
  scavenger: '🔍',
};

export const SHADOWS = {
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 4,
  },
  chip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
};

export const RADII = {
  card: 14,
  button: 10,
  chip: 20,
  panel: 14,
  pill: 16,
};
