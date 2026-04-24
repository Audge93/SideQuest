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
  catPin: '#C8A4F0',
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

// Maps internal category ids to their PNG icon assets.
// treat uses snack.PNG (the filename chosen when uploading).
export const CATEGORY_ICON_IMAGES: Record<string, any> = {
  find:    require('../../assets/icons/find.PNG'),
  photo:   require('../../assets/icons/photo.PNG'),
  trivia:  require('../../assets/icons/trivia.PNG'),
  act:     require('../../assets/icons/act.PNG'),
  ride:    require('../../assets/icons/ride.PNG'),
  treat:   require('../../assets/icons/snack.PNG'),
  pins:    require('../../assets/icons/pins.PNG'),
  meet:    require('../../assets/icons/meet.PNG'),
  explore: require('../../assets/icons/explore.PNG'),
  seek:    require('../../assets/icons/seek.PNG'),
};

// Lightweight emoji icons kept for text contexts (e.g. settings labels).
export const CATEGORY_ICONS: Record<string, string> = {
  find: '🔍',
  photo: '📸',
  trivia: '🧠',
  act: '🎬',
  ride: '🎢',
  treat: '🍦',
  pins: '📌',
  meet: '🎭',
  explore: '🗺️',
  seek: '🎯',
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
