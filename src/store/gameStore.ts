/**
 * gameStore.ts — Central Zustand store for all game state
 *
 * Manages settings, player profile, active session, badge tracking, and
 * persistence via AsyncStorage. All game actions (start, complete, discard,
 * swap, trivia, reset) flow through this store.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Session, Settings, Player, Badge, BadgeTier, CategoryToggles, ParkThemeTag } from '../types';
import { SMALL_TASKS, BIG_TASKS, generateRideTasks } from '../data/tasks';
import { TRIVIA_TASKS } from '../data/trivia';
import { RIDES, PARKS } from '../data/parks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new shuffled copy of the array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

/** Generates 4 tiered badges (bronze → platinum) for a task category */
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
  ...catBadges('sharp-eye', 'Sharp Eye', '🔍', 'observation', 'Find', [10, 25, 50, 100]),
  ...catBadges('shutterbug', 'Shutterbug', '📸', 'photo', 'Photo', [10, 25, 50, 100]),
  ...catBadges('brain-box', 'Brain Box', '🧠', 'trivia', 'Trivia', [10, 25, 50, 100]),
  ...catBadges('scene-stealer', 'Scene Stealer', '🎬', 'action', 'Act', [10, 25, 50, 100]),
  ...catBadges('thrill-seeker', 'Thrill Seeker', '🎢', 'ride', 'Ride', [10, 25, 50, 100]),
  ...catBadges('foodie', 'Foodie', '🍦', 'food', 'Treat', [10, 25, 50, 100]),
  ...catBadges('pin-pro', 'Pin Pro', '📌', 'pin', 'Pins', [10, 25, 50, 100]),
  ...catBadges('star-struck', 'Star Struck', '🎭', 'character', 'Meet', [10, 25, 50, 100]),
  ...catBadges('trailblazer', 'Trailblazer', '🗺️', 'exploration', 'Explore', [10, 25, 50, 100]),
  ...catBadges('treasure-hunter', 'Treasure Hunter', '🎯', 'scavenger', 'Seek', [10, 25, 50, 100]),
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
  categoryCompletions: {},
};

// ─── Store Types ──────────────────────────────────────────────────────────────

interface GameState {
  settings: Settings;
  player: Player;
  session: Session | null;
  isLoading: boolean;
  newlyEarnedBadges: Badge[];

  updateSettings: (patch: Partial<Settings>) => void;
  updateCategoryToggle: (category: keyof CategoryToggles, value: boolean) => void;
  updatePlayerName: (name: string) => void;

  startSession: () => void;
  endSession: () => void;

  completeTask: (taskId: string, isChallenge: boolean) => void;
  discardTask: (taskId: string) => void;
  swapChallengeTask: (taskId: string) => void;
  answerTrivia: (taskId: string, correct: boolean) => void;
  clearNewBadges: () => void;
  resetAllData: () => void;

  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

// ─── Task Pool Builder ────────────────────────────────────────────────────────

/**
 * Builds shuffled pools of small (hand) and big (challenge) tasks based on
 * the player's settings — filters by enabled categories, park theme tags,
 * and optionally by rider height requirements.
 */
function buildTaskPools(settings: Settings): { small: Task[]; big: Task[] } {
  const { categoryToggles, parkIds, heightFilterEnabled, minHeightInches } = settings;

  // Determine which park themes are active (disney, universal, or both)
  const activeThemes = new Set<ParkThemeTag>();
  for (const pid of parkIds) {
    const park = PARKS.find(p => p.id === pid);
    if (!park || park.theme === 'custom') {
      // "Any Park" / custom → include all themes
      activeThemes.add('disney');
      activeThemes.add('universal');
    } else {
      activeThemes.add(park.theme as ParkThemeTag);
    }
  }

  // Theme filter: only include tasks that match the active park themes (or have no tag)
  const matchesTheme = (t: Task) => !t.tag || activeThemes.has(t.tag);

  // Small pool: observation, photo, action from SMALL_TASKS + trivia from TRIVIA_TASKS
  const enabledSmallCategories = (['observation', 'photo', 'action'] as const).filter(c => categoryToggles[c]);
  let small: Task[] = SMALL_TASKS.filter(t => enabledSmallCategories.includes(t.category as any) && matchesTheme(t));
  if (categoryToggles.trivia) {
    const filteredTrivia = TRIVIA_TASKS.filter(matchesTheme);
    small = [...small, ...filteredTrivia];
  }

  // Big pool: food, pin, character, exploration, scavenger from BIG_TASKS + ride tasks
  const enabledBigCategories = (['food', 'pin', 'character', 'exploration', 'scavenger'] as const).filter(c => categoryToggles[c]);
  let big: Task[] = BIG_TASKS.filter(t => enabledBigCategories.includes(t.category as any) && matchesTheme(t));

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

/** Draws up to `count` tasks from a pool, excluding already-used tasks */
function drawFromPool(pool: Task[], exclude: Task[], count: number): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = pool.filter(t => !excludeIds.has(t.id));
  return available.slice(0, count);
}

/** Swaps a task by ID with a replacement, or removes it if no replacement available */
function replaceInArray(arr: Task[], taskId: string, replacement: Task | undefined): Task[] {
  if (!replacement) return arr.filter(t => t.id !== taskId);
  return arr.map(t => (t.id === taskId ? replacement : t));
}

/** Picks a random replacement task from the pool that isn't in any exclusion list */
function pickReplacement(pool: Task[], exclude: Task[], alsoExclude?: Task[]): Task | undefined {
  const excludeIds = new Set(exclude.map(t => t.id));
  if (alsoExclude) {
    for (const t of alsoExclude) excludeIds.add(t.id);
  }
  const available = pool.filter(t => !excludeIds.has(t.id));
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
}

// ─── Badge / Unlock Helpers ───────────────────────────────────────────────────
// These functions evaluate all badge unlock conditions after each task completion.
// Badges are checked in two passes so "completionist" badges can see freshly-earned
// category badges from the first pass.

/** Category badge tier thresholds — must match catBadges() calls above */
const CAT_THRESHOLDS: Record<string, [number, number, number, number]> = {
  'sharp-eye': [10, 25, 50, 100],
  'shutterbug': [10, 25, 50, 100],
  'brain-box': [10, 25, 50, 100],
  'scene-stealer': [10, 25, 50, 100],
  'thrill-seeker': [10, 25, 50, 100],
  'foodie': [10, 25, 50, 100],
  'pin-pro': [10, 25, 50, 100],
  'star-struck': [10, 25, 50, 100],
  'trailblazer': [10, 25, 50, 100],
  'treasure-hunter': [10, 25, 50, 100],
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

/** Merges lifetime category counts with current session completions */
function buildCategoryCounts(
  lifetimeCounts: Record<string, number>,
  sessionTasks: Task[],
): Record<string, number> {
  const counts: Record<string, number> = { ...lifetimeCounts };
  for (const t of sessionTasks) {
    counts[t.category] = (counts[t.category] || 0) + 1;
  }
  return counts;
}

/**
 * Evaluates all badge unlock conditions and returns updated badge array.
 * Checks category thresholds, milestones (first task, streaks), lifetime
 * score tiers, park hopper counts, and completionist meta-badges.
 */
function checkBadges(
  badges: Badge[],
  categoryCounts: Record<string, number>,
  totalCompletions: number,
  currentStreak: number,
  lifetimeScore: number,
  visitedParks: string[],
): Badge[] {
  const countByCategory = (cat: string) => categoryCounts[cat] || 0;

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
      case 'first-steps': earned = totalCompletions >= 1; break;
      case 'streak-bronze': earned = currentStreak >= 5; break;
      case 'streak-silver': earned = currentStreak >= 10; break;
      case 'streak-gold': earned = currentStreak >= 20; break;
      case 'streak-platinum': earned = currentStreak >= 30; break;
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

/** Detects which badges were newly earned by comparing old vs new arrays by ID */
function findNewlyEarned(oldBadges: Badge[], newBadges: Badge[]): Badge[] {
  const oldEarnedIds = new Set(oldBadges.filter(b => b.earned).map(b => b.id));
  return newBadges.filter(b => b.earned && !oldEarnedIds.has(b.id));
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  player: DEFAULT_PLAYER,
  session: null,
  isLoading: true,
  newlyEarnedBadges: [],

  // ─── Settings actions ─────────────────────────────────────────────────────

  /** Partially update settings and persist */
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

  // ─── Session lifecycle ────────────────────────────────────────────────────

  /** Creates a new game session — builds task pools, draws initial hand + challenges */
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

  /** Ends the active session — merges score + completions into lifetime profile, checks badges */
  endSession: () => {
    const { session, player } = get();
    if (!session) return;

    const newLifetime = player.lifetimeScore + session.sessionScore;

    // Deduplicate visited parks
    const allVisited = [...new Set([...player.visitedParks, ...session.parkIds])];

    // Merge session category completions into lifetime counts
    const updatedCatCompletions = { ...(player.categoryCompletions || {}) };
    for (const t of session.completedTasks) {
      updatedCatCompletions[t.category] = (updatedCatCompletions[t.category] || 0) + 1;
    }

    // Check badges using combined lifetime counts (no session tasks since they're now merged)
    const totalCompletions = Object.values(updatedCatCompletions).reduce((a, b) => a + b, 0);
    let updatedBadges = checkBadges(
      player.badges, updatedCatCompletions, totalCompletions,
      session.currentStreak, newLifetime, allVisited,
    );
    updatedBadges = checkBadges(
      updatedBadges, updatedCatCompletions, totalCompletions,
      session.currentStreak, newLifetime, allVisited,
    );

    const updatedPlayer: Player = {
      ...player,
      lifetimeScore: newLifetime,
      badges: updatedBadges,
      visitedParks: allVisited,
      categoryCompletions: updatedCatCompletions,
    };

    set({
      player: updatedPlayer,
      session: { ...session, active: false },
    });
    get().saveToStorage();
  },

  // ─── Task actions ─────────────────────────────────────────────────────────

  /** Marks a task complete — awards points, updates streak, draws replacement, checks badges */
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
      const replacement = pickReplacement(big, newChallengeTasks, session.completedTasks);
      newChallengeTasks = replaceInArray(newChallengeTasks, taskId, replacement);
    } else {
      task = session.hand.find(t => t.id === taskId);
      if (!task) return;
      const { small } = buildTaskPools(settings);
      const replacement = pickReplacement(small, newHand, session.completedTasks);
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

    // Check badges after completion — combine lifetime + session counts
    const { player } = get();
    const newLifetime = player.lifetimeScore + newScore;
    const allVisited = [...new Set([...player.visitedParks, ...updatedSession.parkIds])];
    const combinedCounts = buildCategoryCounts(
      player.categoryCompletions || {},
      updatedSession.completedTasks,
    );
    const totalCompletions = Object.values(combinedCounts).reduce((a, b) => a + b, 0);

    let updatedBadges = checkBadges(
      player.badges, combinedCounts, totalCompletions,
      newStreak, newLifetime, allVisited,
    );
    // Run twice so completionist badges can see freshly earned category badges
    updatedBadges = checkBadges(
      updatedBadges, combinedCounts, totalCompletions,
      newStreak, newLifetime, allVisited,
    );

    // Detect newly earned badges by id (safe across storage loads)
    const freshlyEarned = findNewlyEarned(player.badges, updatedBadges);

    set({
      session: updatedSession,
      player: { ...player, badges: updatedBadges },
      newlyEarnedBadges: [...get().newlyEarnedBadges, ...freshlyEarned],
    });
    get().saveToStorage();
  },

  /** Discards a hand card — resets streak, draws replacement, costs 1 discard pip */
  discardTask: (taskId) => {
    const { session, settings } = get();
    if (!session) return;
    if (session.discardsRemaining <= 0) return;

    const task = session.hand.find(t => t.id === taskId);
    if (!task) return;

    const { small } = buildTaskPools(settings);
    const replacement = pickReplacement(small, session.hand, session.completedTasks);
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

  /** Swaps a challenge task for a new one — costs 25 points from session score */
  swapChallengeTask: (taskId) => {
    const { session, settings } = get();
    if (!session) return;
    if (session.sessionScore < 25) return;

    const { big } = buildTaskPools(settings);
    const replacement = pickReplacement(big, session.challengeTasks, session.completedTasks);
    const newChallengeTasks = replaceInArray(session.challengeTasks, taskId, replacement);

    const updatedSession: Session = {
      ...session,
      sessionScore: session.sessionScore - 25,
      challengeTasks: newChallengeTasks,
    };

    set({ session: updatedSession });
    get().saveToStorage();
  },

  /** Handles trivia answer — correct = complete task, wrong = replace card + reset streak */
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
      const replacement = pickReplacement(small, session.hand, session.completedTasks);
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

  clearNewBadges: () => {
    set({ newlyEarnedBadges: [] });
  },

  // ─── Data management ──────────────────────────────────────────────────────

  /** Wipes all progress — deep-clones badges, clears AsyncStorage, resets to defaults */
  resetAllData: async () => {
    // Deep-clone badges so earned state is fully reset
    const freshBadges = DEFAULT_BADGES.map(b => ({ ...b, earned: false, earnedAt: undefined }));
    const freshPlayer = {
      ...DEFAULT_PLAYER,
      badges: freshBadges,
      lifetimeScore: 0,
      visitedParks: [] as string[],
      categoryCompletions: {} as Record<string, number>,
    };
    // Clear storage first to prevent stale data on reload
    await AsyncStorage.removeItem('parkquest_state');
    set({
      player: freshPlayer,
      session: null,
      newlyEarnedBadges: [],
    });
    // Save clean state
    await get().saveToStorage();
  },

  /** Hydrates state from AsyncStorage on app launch */
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

  /** Persists current state to AsyncStorage */
  saveToStorage: async () => {
    const { settings, player, session } = get();
    await AsyncStorage.setItem('parkquest_state', JSON.stringify({ settings, player, session }));
  },
}));
