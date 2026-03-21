// Task types
export type TaskSize = 'small' | 'big';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Categories - v3 uses internal names + display names
export type SmallCategory = 'observation' | 'photo' | 'trivia' | 'action';
export type BigCategory = 'ride' | 'food' | 'pin' | 'character' | 'exploration' | 'scavenger';
export type TaskCategory = SmallCategory | BigCategory;

export type RideIntensity = 'gentle' | 'moderate' | 'thrill';

export interface Task {
  id: string;
  size: TaskSize;
  category: TaskCategory;
  displayCategory: string; // "Find", "Photo", "Trivia", "Act", "Ride", "Treat", "Pins", "Meet", "Explore", "Seek"
  description: string;
  flavorText?: string;
  points: number;
  difficulty: Difficulty;
  parkId?: string;
  rideId?: string;
  heightRequirement?: number;
  triviaChoices?: string[];
  triviaAnswer?: number;
}

export interface Ride {
  id: string;
  name: string;
  heightRequirement: number;
  intensity: RideIntensity;
  points: 25 | 50 | 75;
  parkId: string;
}

export interface Park {
  id: string;
  name: string;
  shortName: string;
  theme: 'disney' | 'universal' | 'custom';
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  earnedAt?: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  lifetimeScore: number;
  badges: Badge[];
  visitedParks: string[];
}

export interface Session {
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
  observation: boolean;
  photo: boolean;
  trivia: boolean;
  action: boolean;
  ride: boolean;
  food: boolean;
  pin: boolean;
  character: boolean;
  exploration: boolean;
  scavenger: boolean;
}

export interface Settings {
  parkIds: string[];
  heightFilterEnabled: boolean;
  minHeightInches: number;
  categoryToggles: CategoryToggles;
  darkMode: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
