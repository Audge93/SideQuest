import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Session, Settings, Player, Badge, CategoryToggles } from '../types';
import { SMALL_TASKS, BIG_TASKS, generateRideTasks } from '../data/tasks';
import { TRIVIA_TASKS } from '../data/trivia';
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

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_BADGES: Badge[] = [
  // Category badges (10)
  { id: 'sharp-eye', name: 'Sharp Eye', description: 'Complete 10 Find tasks', icon: '🔍', earned: false },
  { id: 'shutterbug', name: 'Shutterbug', description: 'Complete 8 Photo tasks', icon: '📸', earned: false },
  { id: 'brain-box', name: 'Brain Box', description: 'Complete 10 Trivia tasks', icon: '🧠', earned: false },
  { id: 'scene-stealer', name: 'Scene Stealer', description: 'Complete 8 Act tasks', icon: '🎬', earned: false },
  { id: 'thrill-seeker', name: 'Thrill Seeker', description: 'Complete 10 Ride tasks', icon: '🎢', earned: false },
  { id: 'foodie', name: 'Foodie', description: 'Complete 5 Treat tasks', icon: '🍦', earned: false },
  { id: 'pin-pro', name: 'Pin Pro', description: 'Complete 5 Pins tasks', icon: '📌', earned: false },
  { id: 'star-struck', name: 'Star Struck', description: 'Complete 5 Meet tasks', icon: '🎭', earned: false },
  { id: 'trailblazer', name: 'Trailblazer', description: 'Complete 8 Explore tasks', icon: '🗺️', earned: false },
  { id: 'treasure-hunter', name: 'Treasure Hunter', description: 'Complete 8 Seek tasks', icon: '🎯', earned: false },
  // Milestone badges (8)
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first task', icon: '🎉', earned: false },
  { id: 'on-fire', name: 'On Fire', description: 'Reach a 10-task streak', icon: '🔥', earned: false },
  { id: 'blazing', name: 'Blazing', description: 'Reach a 20-task streak', icon: '💙', earned: false },
  { id: 'centurion', name: 'Centurion', description: 'Earn 100 lifetime points', icon: '🏅', earned: false },
  { id: 'high-roller', name: 'High Roller', description: 'Earn 500 lifetime points', icon: '💎', earned: false },
  { id: 'legend', name: 'Legend', description: 'Earn 1,000 lifetime points', icon: '⭐', earned: false },
  { id: 'park-hopper', name: 'Park Hopper', description: 'Complete tasks at 2+ parks', icon: '🏰', earned: false },
  { id: 'completionist', name: 'Completionist', description: 'Earn all category badges', icon: '🏆', earned: false },
];

const DEFAULT_SETTINGS: Settings = {
  parkIds: ['wdw-mk'],
  heightFilterEnabled: false,
  minHeightInches: 40,
  categoryToggles: {
    observation: true,
    photo: true,
    trivia: true,
    action: true,
    ride: true,
    food: true,
    pin: true,
    character: true,
    exploration: true,
    scavenger: true,
  },
  darkMode: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
};

const DEFAULT_PLAYER: Player = {
  id: 'player-1',
  name: 'Player 1',
  color: '#89B4F7',
  lifetimeScore: 0,
  badges: DEFAULT_BADGES,
  unlockedThemes: [],
  visitedParks: [],
};

// ─── Store Types ──────────────────────────────────────────────────────────────

interface GameState {
  settings: Settings;
  player: Player;
  session: Session | null;
  isLoading: boolean;

  updateSettings: (patch: Partial<Settings>) => void;
  updateCategoryToggle: (category: keyof CategoryToggles, value: boolean) => void;
  updatePlayerName: (name: string) => void;

  startSession: () => void;
  endSession: () => void;

  completeTask: (taskId: string, isChallenge: boolean) => void;
  discardTask: (taskId: string) => void;
  swapChallengeTask: (taskId: string) => void;
  answerTrivia: (taskId: string, correct: boolean) => void;

  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

// ─── Task Pool Builder ────────────────────────────────────────────────────────

function buildTaskPools(settings: Settings): { small: Task[]; big: Task[] } {
  const { categoryToggles, parkIds, heightFilterEnabled, minHeightInches } = settings;

  // Small pool: observation, photo, action from SMALL_TASKS + trivia from TRIVIA_TASKS
  const enabledSmallCategories = (['observation', 'photo', 'action'] as const).filter(c => categoryToggles[c]);
  let small: Task[] = SMALL_TASKS.filter(t => enabledSmallCategories.includes(t.category as any));
  if (categoryToggles.trivia) {
    small = [...small, ...TRIVIA_TASKS];
  }

  // Big pool: food, pin, character, exploration, scavenger from BIG_TASKS + ride tasks
  const enabledBigCategories = (['food', 'pin', 'character', 'exploration', 'scavenger'] as const).filter(c => categoryToggles[c]);
  let big: Task[] = BIG_TASKS.filter(t => enabledBigCategories.includes(t.category as any));

  if (categoryToggles.ride) {
    const parkRides = RIDES.filter(r => parkIds.includes(r.parkId));
    const filteredRides = heightFilterEnabled
      ? parkRides.filter(r => r.heightRequirement === 0 || r.heightRequirement <= minHeightInches)
      : parkRides;
    const rideTasks = generateRideTasks(filteredRides);
    big = [...big, ...rideTasks];
  }

  return { small: shuffle(small), big: shuffle(big) };
}

function drawFromPool(pool: Task[], exclude: Task[], count: number): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = pool.filter(t => !excludeIds.has(t.id));
  return available.slice(0, count);
}

function replaceInArray(arr: Task[], taskId: string, replacement: Task | undefined): Task[] {
  if (!replacement) return arr.filter(t => t.id !== taskId);
  return arr.map(t => (t.id === taskId ? replacement : t));
}

function pickReplacement(pool: Task[], exclude: Task[]): Task | undefined {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = pool.filter(t => !excludeIds.has(t.id));
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
}

// ─── Badge / Unlock Helpers ───────────────────────────────────────────────────

function checkBadges(
  session: Session,
  badges: Badge[],
  lifetimeScore: number,
  visitedParks: string[],
): Badge[] {
  const completed = session.completedTasks;
  const countByCategory = (cat: string) => completed.filter(t => t.category === cat).length;

  return badges.map(b => {
    if (b.earned) return b;
    let earned = false;
    switch (b.id) {
      // Category badges
      case 'sharp-eye':
        earned = countByCategory('observation') >= 10; break;
      case 'shutterbug':
        earned = countByCategory('photo') >= 8; break;
      case 'brain-box':
        earned = countByCategory('trivia') >= 10; break;
      case 'scene-stealer':
        earned = countByCategory('action') >= 8; break;
      case 'thrill-seeker':
        earned = countByCategory('ride') >= 10; break;
      case 'foodie':
        earned = countByCategory('food') >= 5; break;
      case 'pin-pro':
        earned = countByCategory('pin') >= 5; break;
      case 'star-struck':
        earned = countByCategory('character') >= 5; break;
      case 'trailblazer':
        earned = countByCategory('exploration') >= 8; break;
      case 'treasure-hunter':
        earned = countByCategory('scavenger') >= 8; break;
      // Milestone badges
      case 'first-steps':
        earned = completed.length >= 1; break;
      case 'on-fire':
        earned = session.currentStreak >= 10; break;
      case 'blazing':
        earned = session.currentStreak >= 20; break;
      case 'centurion':
        earned = lifetimeScore >= 100; break;
      case 'high-roller':
        earned = lifetimeScore >= 500; break;
      case 'legend':
        earned = lifetimeScore >= 1000; break;
      case 'park-hopper':
        earned = visitedParks.length >= 2; break;
      case 'completionist': {
        const categoryBadgeIds = [
          'sharp-eye', 'shutterbug', 'brain-box', 'scene-stealer', 'thrill-seeker',
          'foodie', 'pin-pro', 'star-struck', 'trailblazer', 'treasure-hunter',
        ];
        // Check against the current badges array (with any newly earned ones)
        earned = categoryBadgeIds.every(id => {
          const badge = badges.find(bb => bb.id === id);
          return badge?.earned;
        });
        break;
      }
    }
    return earned ? { ...b, earned: true, earnedAt: Date.now() } : b;
  });
}

function checkThemeUnlocks(lifetimeScore: number, current: string[]): string[] {
  const unlocked = [...current];
  if (lifetimeScore >= 250 && !unlocked.includes('fireworks')) unlocked.push('fireworks');
  if (lifetimeScore >= 500 && !unlocked.includes('twilight')) unlocked.push('twilight');
  if (lifetimeScore >= 1000 && !unlocked.includes('gold-foil')) unlocked.push('gold-foil');
  return unlocked;
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  player: DEFAULT_PLAYER,
  session: null,
  isLoading: true,

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

  updatePlayerName: (name) => {
    set(s => ({ player: { ...s.player, name } }));
    get().saveToStorage();
  },

  startSession: () => {
    const { settings } = get();
    const { small, big } = buildTaskPools(settings);

    const hand = drawFromPool(small, [], 5);
    const challengeTasks = drawFromPool(big, [], 3);

    const session: Session = {
      id: `session-${Date.now()}`,
      parkIds: [...settings.parkIds],
      startedAt: Date.now(),
      active: true,
      sessionScore: 0,
      currentStreak: 0,
      discardsRemaining: 2,
      totalCompletions: 0,
      hand,
      challengeTasks,
      completedTasks: [],
    };

    set({ session });
    get().saveToStorage();
  },

  endSession: () => {
    const { session, player } = get();
    if (!session) return;

    const newLifetime = player.lifetimeScore + session.sessionScore;

    // Deduplicate visited parks
    const allVisited = [...new Set([...player.visitedParks, ...session.parkIds])];

    // Check badges (run twice so completionist can see freshly earned category badges)
    let updatedBadges = checkBadges(session, player.badges, newLifetime, allVisited);
    updatedBadges = checkBadges(session, updatedBadges, newLifetime, allVisited);

    const updatedThemes = checkThemeUnlocks(newLifetime, player.unlockedThemes);

    const updatedPlayer: Player = {
      ...player,
      lifetimeScore: newLifetime,
      badges: updatedBadges,
      unlockedThemes: updatedThemes,
      visitedParks: allVisited,
    };

    set({
      player: updatedPlayer,
      session: { ...session, active: false },
    });
    get().saveToStorage();
  },

  completeTask: (taskId, isChallenge) => {
    const { session, settings } = get();
    if (!session) return;

    let task: Task | undefined;
    let newHand = [...session.hand];
    let newChallengeTasks = [...session.challengeTasks];

    if (isChallenge) {
      task = session.challengeTasks.find(t => t.id === taskId);
      if (!task) return;
      const { big } = buildTaskPools(settings);
      const replacement = pickReplacement(big, newChallengeTasks);
      newChallengeTasks = replaceInArray(newChallengeTasks, taskId, replacement);
    } else {
      task = session.hand.find(t => t.id === taskId);
      if (!task) return;
      const { small } = buildTaskPools(settings);
      const replacement = pickReplacement(small, newHand);
      newHand = replaceInArray(newHand, taskId, replacement);
    }

    const newStreak = session.currentStreak + 1;
    let streakBonus = 0;
    if (newStreak > 0 && newStreak % 5 === 0) {
      streakBonus = 10;
    }

    const newScore = session.sessionScore + task.points + streakBonus;
    const newTotalCompletions = session.totalCompletions + 1;

    let newDiscards = session.discardsRemaining;
    if (newTotalCompletions % 5 === 0 && newDiscards < 2) {
      newDiscards++;
    }

    const updatedSession: Session = {
      ...session,
      sessionScore: newScore,
      currentStreak: newStreak,
      discardsRemaining: newDiscards,
      totalCompletions: newTotalCompletions,
      hand: newHand,
      challengeTasks: newChallengeTasks,
      completedTasks: [...session.completedTasks, task],
    };

    set({ session: updatedSession });
    get().saveToStorage();
  },

  discardTask: (taskId) => {
    const { session, settings } = get();
    if (!session) return;
    if (session.discardsRemaining <= 0) return;

    const task = session.hand.find(t => t.id === taskId);
    if (!task) return;

    const { small } = buildTaskPools(settings);
    const replacement = pickReplacement(small, session.hand);
    const newHand = replaceInArray(session.hand, taskId, replacement);

    const updatedSession: Session = {
      ...session,
      currentStreak: 0,
      discardsRemaining: session.discardsRemaining - 1,
      hand: newHand,
    };

    set({ session: updatedSession });
    get().saveToStorage();
  },

  swapChallengeTask: (taskId) => {
    const { session, settings } = get();
    if (!session) return;
    if (session.sessionScore < 25) return;

    const { big } = buildTaskPools(settings);
    const replacement = pickReplacement(big, session.challengeTasks);
    const newChallengeTasks = replaceInArray(session.challengeTasks, taskId, replacement);

    const updatedSession: Session = {
      ...session,
      sessionScore: session.sessionScore - 25,
      challengeTasks: newChallengeTasks,
    };

    set({ session: updatedSession });
    get().saveToStorage();
  },

  answerTrivia: (taskId, correct) => {
    if (correct) {
      get().completeTask(taskId, false);
    } else {
      // Wrong trivia: replace card and reset streak, but don't use a discard
      const { session, settings } = get();
      if (!session) return;

      const task = session.hand.find(t => t.id === taskId);
      if (!task) return;

      const { small } = buildTaskPools(settings);
      const replacement = pickReplacement(small, session.hand);
      const newHand = replaceInArray(session.hand, taskId, replacement);

      const updatedSession: Session = {
        ...session,
        currentStreak: 0,
        hand: newHand,
      };

      set({ session: updatedSession });
      get().saveToStorage();
    }
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
