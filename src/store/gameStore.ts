import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Session, PlayerSession, Settings, Player, Badge, CategoryToggles } from '../types';
import { SMALL_TASKS, BIG_TASKS, generateRideTasks } from '../data/tasks';
import { RIDES } from '../data/parks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDiscardsAllowed(score: number): number {
  if (score <= 50) return 5;
  if (score <= 150) return 4;
  if (score <= 300) return 3;
  if (score <= 500) return 2;
  return 1;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'eagle-eye', name: 'Eagle Eye', description: 'Complete 10 Observation tasks', icon: '🦅', earned: false },
  { id: 'on-fire', name: 'On Fire', description: 'Reach a 10-task streak', icon: '🔥', earned: false },
  { id: 'centurion', name: 'Centurion', description: 'Earn 100 lifetime points', icon: '🏅', earned: false },
  { id: 'legend', name: 'Legend', description: 'Earn 1,000 lifetime points', icon: '⭐', earned: false },
  { id: 'foodie', name: 'Foodie', description: 'Complete 5 Food & Treat tasks', icon: '🍦', earned: false },
  { id: 'explorer', name: 'Explorer', description: 'Complete 5 Exploration tasks', icon: '🗺️', earned: false },
  { id: 'shutterbug', name: 'Shutterbug', description: 'Complete 5 Photo tasks', icon: '📸', earned: false },
  { id: 'trivia-master', name: 'Trivia Master', description: 'Complete 5 Trivia tasks', icon: '🧠', earned: false },
];

const DEFAULT_SETTINGS: Settings = {
  parkId: 'wdw-mk',
  playMode: 'solo',
  heightFilterEnabled: false,
  minHeightInches: 40,
  categoryToggles: {
    observation: true,
    photo: true,
    trivia: true,
    ride: true,
    food: true,
    pin: true,
    character: true,
    exploration: true,
    scavenger: true,
  },
  disabledRideIds: [],
  darkMode: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
};

const DEFAULT_PLAYER: Player = {
  id: 'player-1',
  name: 'Player 1',
  color: '#4A90E2',
  lifetimeScore: 0,
  badges: DEFAULT_BADGES,
  unlockedThemes: [],
  unlockedCardBacks: [],
};

// ─── Store Types ──────────────────────────────────────────────────────────────

interface GameState {
  settings: Settings;
  player: Player;
  session: Session | null;
  isLoading: boolean;

  // Computed helpers
  activePlayerSession: PlayerSession | null;

  // Actions — Settings
  updateSettings: (patch: Partial<Settings>) => void;
  updateCategoryToggle: (category: keyof CategoryToggles, value: boolean) => void;
  toggleRide: (rideId: string, enabled: boolean) => void;

  // Actions — Player
  updatePlayerName: (name: string) => void;

  // Actions — Session
  startSession: () => void;
  endSession: () => void;

  // Actions — Gameplay
  completeTask: (taskId: string, isBig: boolean, playerId?: string) => void;
  discardTask: (taskId: string, playerId?: string) => void;
  swapBigTask: (taskId: string) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

// ─── Task Pool Builder ────────────────────────────────────────────────────────

function buildTaskPools(settings: Settings): { small: Task[]; big: Task[] } {
  const { categoryToggles, parkId, heightFilterEnabled, minHeightInches, disabledRideIds } = settings;

  const enabledSmall = (['observation', 'photo', 'trivia'] as const).filter(c => categoryToggles[c]);
  const enabledBig = (['food', 'pin', 'character', 'exploration', 'scavenger'] as const).filter(c => categoryToggles[c]);

  let small = SMALL_TASKS.filter(t => enabledSmall.includes(t.category as any));
  let big = BIG_TASKS.filter(t => enabledBig.includes(t.category as any));

  if (categoryToggles.ride) {
    const parkRides = RIDES.filter(r => r.parkId === parkId);
    const filteredRides = heightFilterEnabled
      ? parkRides.filter(r => r.heightRequirement === 0 || r.heightRequirement <= minHeightInches)
      : parkRides;
    const rideTasks = generateRideTasks(filteredRides, disabledRideIds);
    big = [...big, ...rideTasks];
  }

  return { small: shuffle(small), big: shuffle(big) };
}

function drawCards(pool: Task[], existing: Task[], count: number): { drawn: Task[]; remaining: Task[] } {
  const existingIds = new Set(existing.map(t => t.id));
  const available = pool.filter(t => !existingIds.has(t.id));
  const needed = count - existing.length;
  if (needed <= 0) return { drawn: existing, remaining: pool };

  const drawn = [...existing, ...available.slice(0, needed)];
  const remaining = available.slice(needed);
  return { drawn, remaining };
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  player: DEFAULT_PLAYER,
  session: null,
  isLoading: true,
  activePlayerSession: null,

  updateSettings: (patch) => {
    set(s => ({ settings: { ...s.settings, ...patch } }));
    get().saveToStorage();
  },

  updateCategoryToggle: (category, value) => {
    set(s => ({
      settings: {
        ...s.settings,
        categoryToggles: { ...s.settings.categoryToggles, [category]: value },
      },
    }));
    get().saveToStorage();
  },

  toggleRide: (rideId, enabled) => {
    set(s => {
      const current = s.settings.disabledRideIds;
      const next = enabled ? current.filter(id => id !== rideId) : [...current, rideId];
      return { settings: { ...s.settings, disabledRideIds: next } };
    });
    get().saveToStorage();
  },

  updatePlayerName: (name) => {
    set(s => ({ player: { ...s.player, name } }));
    get().saveToStorage();
  },

  startSession: () => {
    const { settings, player } = get();
    const { small, big } = buildTaskPools(settings);

    const hand = small.slice(0, 5);
    const bigBoard = big.slice(0, 3);

    const playerSession: PlayerSession = {
      playerId: player.id,
      sessionScore: 0,
      currentStreak: 0,
      discardsRemaining: 5,
      hand,
      completedTasks: [],
    };

    const session: Session = {
      id: `session-${Date.now()}`,
      parkId: settings.parkId,
      mode: settings.playMode,
      players: [playerSession],
      bigBoard,
      startedAt: Date.now(),
      active: true,
    };

    set({ session, activePlayerSession: playerSession });
    get().saveToStorage();
  },

  endSession: () => {
    const { session, player } = get();
    if (!session) return;

    const ps = session.players[0];
    const newLifetime = player.lifetimeScore + ps.sessionScore;
    const updatedBadges = checkBadges(ps, player.badges, newLifetime);
    const updatedThemes = checkThemeUnlocks(newLifetime, player.unlockedThemes);

    const updatedPlayer = {
      ...player,
      lifetimeScore: newLifetime,
      badges: updatedBadges,
      unlockedThemes: updatedThemes,
    };

    set({
      player: updatedPlayer,
      session: { ...session, active: false },
    });
    get().saveToStorage();
  },

  completeTask: (taskId, isBig, _playerId) => {
    const state = get();
    const { session, player, settings } = state;
    if (!session) return;

    const ps = { ...session.players[0] };

    let task: Task | undefined;
    let newBigBoard = [...session.bigBoard];
    let newHand = [...ps.hand];

    if (isBig) {
      task = session.bigBoard.find(t => t.id === taskId);
      if (!task) return;
      const { big } = buildTaskPools(settings);
      const unusedBig = big.filter(t => !newBigBoard.find(b => b.id === t.id) && t.id !== taskId);
      const replacement = unusedBig[Math.floor(Math.random() * unusedBig.length)];
      newBigBoard = newBigBoard.map(t => (t.id === taskId ? replacement : t)).filter(Boolean);
    } else {
      task = ps.hand.find(t => t.id === taskId);
      if (!task) return;
      const { small } = buildTaskPools(settings);
      const unusedSmall = small.filter(t => !newHand.find(h => h.id === t.id) && t.id !== taskId);
      const replacement = unusedSmall[Math.floor(Math.random() * unusedSmall.length)];
      newHand = newHand.map(t => (t.id === taskId ? replacement : t)).filter(Boolean);
    }

    const newStreak = ps.currentStreak + 1;
    let streakBonus = 0;
    if (newStreak > 0 && newStreak % 3 === 0) {
      streakBonus = 5;
    }

    const newScore = ps.sessionScore + task.points + streakBonus;
    const newDiscardsRemaining = getDiscardsAllowed(newScore);

    const updatedPs: PlayerSession = {
      ...ps,
      sessionScore: newScore,
      currentStreak: newStreak,
      discardsRemaining: newDiscardsRemaining,
      hand: newHand,
      completedTasks: [...ps.completedTasks, task],
    };

    set({
      session: { ...session, players: [updatedPs], bigBoard: newBigBoard },
      activePlayerSession: updatedPs,
    });
    get().saveToStorage();
  },

  discardTask: (taskId, _playerId) => {
    const state = get();
    const { session, settings } = state;
    if (!session) return;

    const ps = { ...session.players[0] };
    if (ps.discardsRemaining <= 0) return;

    const task = ps.hand.find(t => t.id === taskId);
    if (!task) return;

    const { small } = buildTaskPools(settings);
    const newHand = [...ps.hand];
    const unusedSmall = small.filter(t => !newHand.find(h => h.id === t.id) && t.id !== taskId);
    const replacement = unusedSmall[Math.floor(Math.random() * unusedSmall.length)];
    const updatedHand = newHand.map(t => (t.id === taskId ? replacement : t)).filter(Boolean);

    const updatedPs: PlayerSession = {
      ...ps,
      currentStreak: 0,
      discardsRemaining: ps.discardsRemaining - 1,
      hand: updatedHand,
    };

    set({
      session: { ...session, players: [updatedPs] },
      activePlayerSession: updatedPs,
    });
    get().saveToStorage();
  },

  swapBigTask: (taskId) => {
    const state = get();
    const { session, settings } = state;
    if (!session) return;

    const ps = { ...session.players[0] };
    if (ps.sessionScore < 25) return;

    const { big } = buildTaskPools(settings);
    const newBigBoard = [...session.bigBoard];
    const unusedBig = big.filter(t => !newBigBoard.find(b => b.id === t.id) && t.id !== taskId);
    const replacement = unusedBig[Math.floor(Math.random() * unusedBig.length)];
    const updatedBoard = newBigBoard.map(t => (t.id === taskId ? replacement : t)).filter(Boolean);

    const newScore = Math.max(0, ps.sessionScore - 25);
    const updatedPs: PlayerSession = { ...ps, sessionScore: newScore };

    set({
      session: { ...session, players: [updatedPs], bigBoard: updatedBoard },
      activePlayerSession: updatedPs,
    });
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem('parkquest_state');
      if (raw) {
        const saved = JSON.parse(raw);
        set({
          settings: { ...DEFAULT_SETTINGS, ...saved.settings },
          player: { ...DEFAULT_PLAYER, ...saved.player },
          session: saved.session ?? null,
          activePlayerSession: saved.session?.players?.[0] ?? null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveToStorage: async () => {
    const { settings, player, session } = get();
    await AsyncStorage.setItem('parkquest_state', JSON.stringify({ settings, player, session }));
  },
}));

// ─── Badge / Unlock Helpers ───────────────────────────────────────────────────

function checkBadges(ps: PlayerSession, badges: Badge[], lifetimeScore: number): Badge[] {
  const completed = ps.completedTasks;
  return badges.map(b => {
    if (b.earned) return b;
    let earned = false;
    switch (b.id) {
      case 'eagle-eye':
        earned = completed.filter(t => t.category === 'observation').length >= 10; break;
      case 'on-fire':
        earned = ps.currentStreak >= 10; break;
      case 'centurion':
        earned = lifetimeScore >= 100; break;
      case 'legend':
        earned = lifetimeScore >= 1000; break;
      case 'foodie':
        earned = completed.filter(t => t.category === 'food').length >= 5; break;
      case 'explorer':
        earned = completed.filter(t => t.category === 'exploration').length >= 5; break;
      case 'shutterbug':
        earned = completed.filter(t => t.category === 'photo').length >= 5; break;
      case 'trivia-master':
        earned = completed.filter(t => t.category === 'trivia').length >= 5; break;
    }
    return earned ? { ...b, earned: true, earnedAt: Date.now() } : b;
  });
}

function checkThemeUnlocks(lifetimeScore: number, current: string[]): string[] {
  const unlocked = [...current];
  if (lifetimeScore >= 250 && !unlocked.includes('fireworks')) unlocked.push('fireworks');
  if (lifetimeScore >= 500 && !unlocked.includes('retro')) unlocked.push('retro');
  if (lifetimeScore >= 1000 && !unlocked.includes('gold-foil')) unlocked.push('gold-foil');
  return unlocked;
}
