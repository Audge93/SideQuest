import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Session, Settings, Player, Badge, BadgeTier, CategoryToggles } from '../types';
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

// Helper to generate tiered badges for a category
function catBadges(
  baseId: string, name: string, icon: string, category: string, displayCat: string,
  tiers: [number, number, number, number],
): Badge[] {
  const tierNames: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  return tierNames.map((tier, i) => ({
    id: `${baseId}-${tier}`,
    name: `${name} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
    description: `Complete ${tiers[i]} ${displayCat} tasks`,
    icon,
    tier,
    earned: false,
  }));
}

const DEFAULT_BADGES: Badge[] = [
  // Category badges (10 categories x 4 tiers = 40)
  ...catBadges('sharp-eye', 'Sharp Eye', '🔍', 'observation', 'Find', [5, 15, 30, 50]),
  ...catBadges('shutterbug', 'Shutterbug', '📸', 'photo', 'Photo', [5, 12, 25, 40]),
  ...catBadges('brain-box', 'Brain Box', '🧠', 'trivia', 'Trivia', [5, 15, 30, 50]),
  ...catBadges('scene-stealer', 'Scene Stealer', '🎬', 'action', 'Act', [5, 12, 25, 40]),
  ...catBadges('thrill-seeker', 'Thrill Seeker', '🎢', 'ride', 'Ride', [5, 15, 30, 50]),
  ...catBadges('foodie', 'Foodie', '🍦', 'food', 'Treat', [3, 8, 15, 25]),
  ...catBadges('pin-pro', 'Pin Pro', '📌', 'pin', 'Pins', [3, 8, 15, 25]),
  ...catBadges('star-struck', 'Star Struck', '🎭', 'character', 'Meet', [3, 8, 15, 25]),
  ...catBadges('trailblazer', 'Trailblazer', '🗺️', 'exploration', 'Explore', [5, 12, 25, 40]),
  ...catBadges('treasure-hunter', 'Treasure Hunter', '🎯', 'scavenger', 'Seek', [5, 12, 25, 40]),
  // Milestone badges (tiered)
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first task', icon: '🎉', tier: 'bronze', earned: false },
  // Streak tiers
  { id: 'streak-bronze', name: 'On Fire (Bronze)', description: 'Reach a 5-task streak', icon: '🔥', tier: 'bronze', earned: false },
  { id: 'streak-silver', name: 'On Fire (Silver)', description: 'Reach a 10-task streak', icon: '🔥', tier: 'silver', earned: false },
  { id: 'streak-gold', name: 'Blazing (Gold)', description: 'Reach a 20-task streak', icon: '🔥', tier: 'gold', earned: false },
  { id: 'streak-platinum', name: 'Inferno (Platinum)', description: 'Reach a 30-task streak', icon: '💙', tier: 'platinum', earned: false },
  // Lifetime score tiers
  { id: 'score-bronze', name: 'Centurion (Bronze)', description: 'Earn 100 lifetime points', icon: '🏅', tier: 'bronze', earned: false },
  { id: 'score-silver', name: 'High Roller (Silver)', description: 'Earn 500 lifetime points', icon: '💎', tier: 'silver', earned: false },
  { id: 'score-gold', name: 'Legend (Gold)', description: 'Earn 1,000 lifetime points', icon: '⭐', tier: 'gold', earned: false },
  { id: 'score-platinum', name: 'Mythic (Platinum)', description: 'Earn 5,000 lifetime points', icon: '👑', tier: 'platinum', earned: false },
  // Park hopper tiers
  { id: 'hopper-bronze', name: 'Park Hopper (Bronze)', description: 'Visit 2 parks', icon: '🏰', tier: 'bronze', earned: false },
  { id: 'hopper-silver', name: 'Park Hopper (Silver)', description: 'Visit 4 parks', icon: '🏰', tier: 'silver', earned: false },
  { id: 'hopper-gold', name: 'Park Hopper (Gold)', description: 'Visit 6 parks', icon: '🏰', tier: 'gold', earned: false },
  { id: 'hopper-platinum', name: 'Park Hopper (Platinum)', description: 'Visit 10 parks', icon: '🏰', tier: 'platinum', earned: false },
  // Completionist tiers
  { id: 'completionist-bronze', name: 'Completionist (Bronze)', description: 'Earn all bronze category badges', icon: '🏆', tier: 'bronze', earned: false },
  { id: 'completionist-silver', name: 'Completionist (Silver)', description: 'Earn all silver category badges', icon: '🏆', tier: 'silver', earned: false },
  { id: 'completionist-gold', name: 'Completionist (Gold)', description: 'Earn all gold category badges', icon: '🏆', tier: 'gold', earned: false },
  { id: 'completionist-platinum', name: 'Completionist (Platinum)', description: 'Earn all platinum category badges', icon: '🏆', tier: 'platinum', earned: false },
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

// Category badge tier thresholds (must match catBadges calls above)
const CAT_THRESHOLDS: Record<string, [number, number, number, number]> = {
  'sharp-eye': [5, 15, 30, 50],
  'shutterbug': [5, 12, 25, 40],
  'brain-box': [5, 15, 30, 50],
  'scene-stealer': [5, 12, 25, 40],
  'thrill-seeker': [5, 15, 30, 50],
  'foodie': [3, 8, 15, 25],
  'pin-pro': [3, 8, 15, 25],
  'star-struck': [3, 8, 15, 25],
  'trailblazer': [5, 12, 25, 40],
  'treasure-hunter': [5, 12, 25, 40],
};

const CAT_TO_CATEGORY: Record<string, string> = {
  'sharp-eye': 'observation',
  'shutterbug': 'photo',
  'brain-box': 'trivia',
  'scene-stealer': 'action',
  'thrill-seeker': 'ride',
  'foodie': 'food',
  'pin-pro': 'pin',
  'star-struck': 'character',
  'trailblazer': 'exploration',
  'treasure-hunter': 'scavenger',
};

const TIER_INDEX: Record<BadgeTier, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 };

const CAT_BASE_IDS = Object.keys(CAT_THRESHOLDS);

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

    // Check category tiered badges (e.g. "sharp-eye-bronze")
    for (const baseId of CAT_BASE_IDS) {
      const tiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
      for (const tier of tiers) {
        if (b.id === `${baseId}-${tier}`) {
          const cat = CAT_TO_CATEGORY[baseId];
          const threshold = CAT_THRESHOLDS[baseId][TIER_INDEX[tier]];
          earned = countByCategory(cat) >= threshold;
        }
      }
    }

    // Milestone badges
    switch (b.id) {
      case 'first-steps': earned = completed.length >= 1; break;
      case 'streak-bronze': earned = session.currentStreak >= 5; break;
      case 'streak-silver': earned = session.currentStreak >= 10; break;
      case 'streak-gold': earned = session.currentStreak >= 20; break;
      case 'streak-platinum': earned = session.currentStreak >= 30; break;
      case 'score-bronze': earned = lifetimeScore >= 100; break;
      case 'score-silver': earned = lifetimeScore >= 500; break;
      case 'score-gold': earned = lifetimeScore >= 1000; break;
      case 'score-platinum': earned = lifetimeScore >= 5000; break;
      case 'hopper-bronze': earned = visitedParks.length >= 2; break;
      case 'hopper-silver': earned = visitedParks.length >= 4; break;
      case 'hopper-gold': earned = visitedParks.length >= 6; break;
      case 'hopper-platinum': earned = visitedParks.length >= 10; break;
      case 'completionist-bronze': {
        earned = CAT_BASE_IDS.every(id => badges.find(bb => bb.id === `${id}-bronze`)?.earned);
        break;
      }
      case 'completionist-silver': {
        earned = CAT_BASE_IDS.every(id => badges.find(bb => bb.id === `${id}-silver`)?.earned);
        break;
      }
      case 'completionist-gold': {
        earned = CAT_BASE_IDS.every(id => badges.find(bb => bb.id === `${id}-gold`)?.earned);
        break;
      }
      case 'completionist-platinum': {
        earned = CAT_BASE_IDS.every(id => badges.find(bb => bb.id === `${id}-platinum`)?.earned);
        break;
      }
    }

    return earned ? { ...b, earned: true, earnedAt: Date.now() } : b;
  });
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

    const updatedPlayer: Player = {
      ...player,
      lifetimeScore: newLifetime,
      badges: updatedBadges,
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
