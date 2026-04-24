/**
 * Shared domain model for the app. These definitions describe the shape of
 * gameplay tasks, player data, sessions, rides, parks, badges, settings, and
 * save slots so every screen and store action works with the same contract.
 */

// Distinguishes hand-card tasks from challenge-board tasks.
export type TaskSize = 'small' | 'big';
// Difficulty controls both task feel and the points assigned to it.
export type Difficulty = 'easy' | 'medium' | 'hard';

// Small categories populate the player's hand, while big categories appear on
// the challenge board and usually award more points.
export type SmallCategory = 'find' | 'photo' | 'trivia' | 'act';
export type BigCategory = 'ride' | 'treat' | 'pins' | 'meet' | 'explore' | 'seek';
export type TaskCategory = SmallCategory | BigCategory;

// Ride intensity is stored separately from point value so the app can reason
// about attraction intensity in a human-friendly way.
export type RideIntensity = 'gentle' | 'moderate' | 'thrill';

// Theme tags let task content be filtered to Disney or Universal contexts.
export type ParkThemeTag = 'disney' | 'universal';

export interface Task {
  // Stable identifier used by save data, completion logic, and replacement.
  id: string;
  // Determines whether this task appears in the hand carousel or challenge board.
  size: TaskSize;
  // Internal bucket used for filtering, badge progress, colors, and icons.
  category: TaskCategory;
  // Friendly label shown to the player in headers and badges.
  displayCategory: string;
  // Main instruction text shown on the task card or expanded modal.
  description: string;
  // Optional helper line used to teach or flavor the task.
  flavorText?: string;
  // Score awarded for completing the task.
  points: number;
  // Relative challenge level used for balancing.
  difficulty: Difficulty;
  // Optional park binding for park-specific tasks.
  parkId?: string;
  // Optional ride binding for generated ride tasks.
  rideId?: string;
  // Optional minimum rider height, mainly for ride tasks.
  heightRequirement?: number;
  // Answer choices for trivia cards.
  triviaChoices?: string[];
  // Zero-based index of the correct trivia choice.
  triviaAnswer?: number;
  // Theme filter; omitted means the task can appear in any park.
  tag?: ParkThemeTag;
}

export interface Ride {
  // Canonical ride metadata used to generate ride challenge tasks.
  id: string;
  name: string;
  heightRequirement: number;
  intensity: RideIntensity;
  points: 25 | 50 | 75;
  parkId: string;
}

export interface Park {
  // Park reference data used by selectors, settings, and session display.
  id: string;
  name: string;
  shortName: string;
  theme: 'disney' | 'universal' | 'custom';
}

// Badge tiers create a progression ladder for each achievement line.
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  // Badge records feed both unlock evaluation and profile rendering.
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  earnedAt?: number;
}

export interface Player {
  // Persistent player profile — only identity data shared across all games.
  id: string;
  name: string;
  color: string;
}

export interface Session {
  // Live gameplay snapshot used by the active game screen.
  id: string;
  parkIds: string[];
  startedAt: number;
  active: boolean;
  sessionScore: number;
  currentStreak: number;
  discardsRemaining: number;
  totalCompletions: number;
  hand: Task[];
  challengeTasks: Task[];
  completedTasks: Task[];
}

export interface CategoryToggles {
  // Individual switches that turn task categories on or off for generation.
  find: boolean;
  photo: boolean;
  trivia: boolean;
  act: boolean;
  ride: boolean;
  treat: boolean;
  pins: boolean;
  meet: boolean;
  explore: boolean;
  seek: boolean;
}

export interface Settings {
  // Player-configurable options that shape task generation and app behavior.
  parkIds: string[];
  heightFilterEnabled: boolean;
  minHeightInches: number;
  categoryToggles: CategoryToggles;
  darkMode: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface SaveSlot {
  // Named save entry — fully self-contained so each game is independent.
  // Badges, category progress, and visited parks are per-slot, not global.
  id: string;
  name: string;
  createdAt: number;
  lastSavedAt: number;
  session: Session;
  settings: Settings;
  badges: Badge[];
  categoryCompletions: Record<string, number>;
  visitedParks: string[];
}

// Current cap for how many save entries the player can keep at once.
export const MAX_SAVE_SLOTS = 3;
