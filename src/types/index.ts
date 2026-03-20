// ─── Task Types ─────────────────────────────────────────────────────────────

export type TaskSize = 'small' | 'big';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SmallCategory = 'observation' | 'photo' | 'trivia';
export type BigCategory = 'ride' | 'food' | 'pin' | 'character' | 'exploration' | 'scavenger';
export type TaskCategory = SmallCategory | BigCategory;

export interface Task {
  id: string;
  size: TaskSize;
  category: TaskCategory;
  description: string;
  points: number;
  difficulty: Difficulty;
  parkId?: string;
  rideId?: string;
  heightRequirement?: number; // inches
  triviaChoices?: string[];   // 4 multiple-choice options (trivia only)
  triviaAnswer?: number;      // index of correct choice (0-3)
}

// ─── Park / Ride Types ───────────────────────────────────────────────────────

export type RideIntensity = 'gentle' | 'moderate' | 'thrill';

export interface Ride {
  id: string;
  name: string;
  heightRequirement: number; // inches, 0 = no requirement
  intensity: RideIntensity;
  points: 25 | 50 | 75;
  parkId: string;
  landId: string;
}

export interface Land {
  id: string;
  name: string;
  parkId: string;
}

export interface Park {
  id: string;
  name: string;
  shortName: string;
  theme: 'disney' | 'universal' | 'custom';
  lands: Land[];
}

// ─── Player / Session Types ──────────────────────────────────────────────────

export type PlayMode = 'solo';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  lifetimeScore: number;
  badges: Badge[];
  unlockedThemes: string[];
  unlockedCardBacks: string[];
}

export interface PlayerSession {
  playerId: string;
  sessionScore: number;
  currentStreak: number;
  discardsRemaining: number;
  hand: Task[]; // always 5
  completedTasks: Task[];
}

export interface Session {
  id: string;
  parkId: string;
  mode: PlayMode;
  players: PlayerSession[];
  bigBoard: Task[]; // always 3
  startedAt: number;
  active: boolean;
}

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface CategoryToggles {
  observation: boolean;
  photo: boolean;
  trivia: boolean;
  ride: boolean;
  food: boolean;
  pin: boolean;
  character: boolean;
  exploration: boolean;
  scavenger: boolean;
}

export interface Settings {
  parkId: string;
  playMode: PlayMode;
  heightFilterEnabled: boolean;
  minHeightInches: number; // 32–54
  categoryToggles: CategoryToggles;
  disabledRideIds: string[];
  darkMode: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
