/**
 * gameStore.ts — Central Zustand store for all game state
 *
 * Manages settings, player profile, active session, badge tracking, and
 * persistence via AsyncStorage. All game actions (start, complete, discard,
 * swap, trivia, reset) flow through this store.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Session, Settings, Player, Badge, BadgeTier, CategoryToggles, ParkThemeTag, SaveSlot, MAX_SAVE_SLOTS } from '../types';
import { SMALL_TASKS, BIG_TASKS, RIDE_ACTIVITY_TASKS, generateRideTasks } from '../data/tasks';
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

/** Gives each challenge-card instance a unique id so repeated content can still render in 3 slots. */
function createChallengeInstance(task: Task): Task {
  return {
    ...task,
    id: `${task.id}::challenge::${Date.now()}::${Math.random().toString(36).slice(2, 8)}`,
  };
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
  ...catBadges('sharp-eye', 'Sharp Eye', '🔍', 'find', 'Find', [10, 25, 50, 100]),
  ...catBadges('shutterbug', 'Shutterbug', '📸', 'photo', 'Photo', [10, 25, 50, 100]),
  ...catBadges('brain-box', 'Brain Box', '🧠', 'trivia', 'Trivia', [10, 25, 50, 100]),
  ...catBadges('scene-stealer', 'Scene Stealer', '🎬', 'act', 'Act', [10, 25, 50, 100]),
  ...catBadges('thrill-seeker', 'Thrill Seeker', '🎢', 'ride', 'Ride', [10, 25, 50, 100]),
  ...catBadges('foodie', 'Foodie', '🍦', 'treat', 'Treat', [10, 25, 50, 100]),
  ...catBadges('pin-pro', 'Pin Pro', '📌', 'pins', 'Pins', [10, 25, 50, 100]),
  ...catBadges('star-struck', 'Star Struck', '🎭', 'meet', 'Meet', [10, 25, 50, 100]),
  ...catBadges('trailblazer', 'Trailblazer', '🗺️', 'explore', 'Explore', [10, 25, 50, 100]),
  ...catBadges('treasure-hunter', 'Treasure Hunter', '🎯', 'seek', 'Seek', [10, 25, 50, 100]),
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
    find: true,
    photo: true,
    trivia: true,
    act: true,
    ride: true,
    treat: true,
    pins: true,
    meet: true,
    explore: true,
    seek: true,
  },
  darkMode: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
};

const DEFAULT_PLAYER: Player = {
  id: 'player-1',
  name: 'Player 1',
  color: '#89B4F7',
};

// ─── Store Types ──────────────────────────────────────────────────────────────

interface GameState {
  // Persisted state slices read directly by screens and components.
  settings: Settings;
  player: Player;
  session: Session | null;
  isLoading: boolean;
  newlyEarnedBadges: Badge[];
  saveSlots: (SaveSlot | null)[];
  activeSlotId: string | null;

  // Simple profile/settings mutations.
  updateSettings: (patch: Partial<Settings>) => void;
  updateCategoryToggle: (category: keyof CategoryToggles, value: boolean) => void;
  updatePlayerName: (name: string) => void;

  // Session lifecycle.
  startSession: (customName?: string) => void;
  endSession: () => void;

  // Save/load management.
  saveGame: (slotId: string, name?: string) => void;
  loadSlot: (slotId: string) => void;
  deleteSlot: (slotId: string) => void;
  renameActiveSlot: (name: string) => void;
  autoSave: () => void;
  switchPark: (newParkIds: string[]) => void;

  // Core gameplay actions.
  completeTask: (taskId: string, isChallenge: boolean) => void;
  discardTask: (taskId: string) => void;
  swapChallengeTask: (taskId: string) => void;
  answerTrivia: (taskId: string, correct: boolean) => void;
  clearNewBadges: () => void;
  resetAllData: () => void;
  triggerTips: () => void;
  clearPendingTips: () => void;

  // Transient UI flag — true means GameScreen should show tips on next render.
  showTipsOnNext: boolean;

  // Persistence helpers.
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

  // Determine which park themes are active (disney, universal, zoo, or any combo)
  const activeThemes = new Set<ParkThemeTag>();
  for (const pid of parkIds) {
    const park = PARKS.find(p => p.id === pid);
    if (!park || park.theme === 'custom') {
      // "Any Park" / custom → include theme park content
      activeThemes.add('disney');
      activeThemes.add('universal');
    } else if (park.theme === 'zoo') {
      activeThemes.add('zoo');
    } else {
      activeThemes.add(park.theme as ParkThemeTag);
    }
  }

  // Theme filter: only include tasks that match the active park themes (or have no tag)
  const matchesTheme = (t: Task) => !t.tag || activeThemes.has(t.tag);

  // Small pool: find, photo, act from SMALL_TASKS + trivia from TRIVIA_TASKS
  const enabledSmallCategories = (['find', 'photo', 'act'] as const).filter(c => categoryToggles[c]);
  let small: Task[] = SMALL_TASKS.filter(t => enabledSmallCategories.includes(t.category as any) && matchesTheme(t));
  if (categoryToggles.trivia) {
    const filteredTrivia = TRIVIA_TASKS.filter(matchesTheme);
    small = [...small, ...filteredTrivia];
  }

  // Big pool: treat, pins, meet, explore, seek from BIG_TASKS + ride tasks
  const enabledBigCategories = (['treat', 'pins', 'meet', 'explore', 'seek'] as const).filter(c => categoryToggles[c]);
  let big: Task[] = BIG_TASKS.filter(t => enabledBigCategories.includes(t.category as any) && matchesTheme(t));

  if (categoryToggles.ride) {
    const parkRides = RIDES.filter(r => parkIds.includes(r.parkId));
    const filteredRides = heightFilterEnabled
      ? parkRides.filter(r => r.heightRequirement === 0 || r.heightRequirement <= minHeightInches)
      : parkRides;
    big = [...big, ...generateRideTasks(filteredRides)];

    // Ride-activity tasks (e.g. "Score 100k on Toy Story Mania") — filtered by
    // selected park and the player's height setting, same as generated ride tasks.
    const rideActivityTasks = RIDE_ACTIVITY_TASKS.filter(t => {
      if (!parkIds.includes(t.parkId!)) return false;
      if (heightFilterEnabled && t.heightRequirement! > minHeightInches) return false;
      return matchesTheme(t);
    });
    big = [...big, ...rideActivityTasks];
  }

  return { small: shuffle(small), big: shuffle(big) };
}

const MAX_TRIVIA_IN_HAND = 3;

/** Draws up to `count` tasks from a pool, excluding already-used tasks, capping trivia at MAX_TRIVIA_IN_HAND */
function drawFromPool(pool: Task[], exclude: Task[], count: number): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = pool.filter(t => !excludeIds.has(t.id));
  const result: Task[] = [];
  let triviaCount = 0;
  for (const task of available) {
    if (result.length >= count) break;
    if (task.category === 'trivia') {
      if (triviaCount >= MAX_TRIVIA_IN_HAND) continue;
      triviaCount++;
    }
    result.push(task);
  }
  return result;
}

/**
 * Builds a fresh challenge row by sampling randomly from the full challenge
 * pool, only avoiding duplicates that are currently visible.
 */
function drawChallengeBoard(pool: Task[], count: number, exclude: Task[] = []): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = shuffle(pool.filter(t => !excludeIds.has(t.id)));
  if (available.length >= count) {
    return available.slice(0, count).map(createChallengeInstance);
  }
  if (available.length === 0) {
    return shuffle(pool).slice(0, count).map(createChallengeInstance);
  }

  const filled = [...available];
  while (filled.length < count) {
    filled.push(available[filled.length % available.length]);
  }
  return filled.map(createChallengeInstance);
}

/** Swaps a task by ID with a replacement, or removes it if no replacement available */
function replaceInArray(arr: Task[], taskId: string, replacement: Task | undefined): Task[] {
  if (!replacement) return arr.filter(t => t.id !== taskId);
  return arr.map(t => (t.id === taskId ? replacement : t));
}

/** Picks a random replacement task from the pool that isn't in any exclusion list.
 *  If the pool is exhausted (all tasks completed), recycles by only avoiding
 *  cards currently in hand so the game can continue indefinitely. */
function pickReplacement(pool: Task[], exclude: Task[], alsoExclude?: Task[], handAfterRemoval?: Task[]): Task | undefined {
  const excludeIds = new Set(exclude.map(t => t.id));
  if (alsoExclude) {
    for (const t of alsoExclude) excludeIds.add(t.id);
  }
  const triviaInHand = handAfterRemoval ? handAfterRemoval.filter(t => t.category === 'trivia').length : 0;
  let available = pool.filter(t => !excludeIds.has(t.id));
  if (triviaInHand >= MAX_TRIVIA_IN_HAND) {
    available = available.filter(t => t.category !== 'trivia');
  }

  // Pool exhausted — recycle completed tasks, only avoid what's currently in hand
  if (available.length === 0) {
    const handIds = new Set((handAfterRemoval ?? []).map(t => t.id));
    available = pool.filter(t => !handIds.has(t.id));
    if (triviaInHand >= MAX_TRIVIA_IN_HAND) {
      available = available.filter(t => t.category !== 'trivia');
    }
  }

  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Chooses the next challenge card from the full challenge pool so the
 * challenge row keeps cycling forever. It avoids duplicates with the other
 * visible challenge cards and prefers not to immediately repeat the card that
 * was just replaced, but falls back if the pool is very small.
 */
function pickChallengeReplacement(
  pool: Task[],
  currentChallenges: Task[],
  replacedTaskId: string,
): Task | undefined {
  const otherVisibleIds = new Set(
    currentChallenges.filter(t => t.id !== replacedTaskId).map(t => t.id),
  );

  const preferred = pool.filter(
    t => !otherVisibleIds.has(t.id) && t.id !== replacedTaskId,
  );
  if (preferred.length > 0) {
    return createChallengeInstance(
      preferred[Math.floor(Math.random() * preferred.length)],
    );
  }

  const fallback = pool.filter(t => !otherVisibleIds.has(t.id));
  // Full recycle — just pick anything from the pool if all else is exhausted
  const source = fallback.length > 0 ? fallback : pool;
  if (source.length === 0) return undefined;
  return createChallengeInstance(
    source[Math.floor(Math.random() * source.length)],
  );
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
  'sharp-eye': 'find',
  'shutterbug': 'photo',
  'brain-box': 'trivia',
  'scene-stealer': 'act',
  'thrill-seeker': 'ride',
  'foodie': 'treat',
  'pin-pro': 'pins',
  'star-struck': 'meet',
  'trailblazer': 'explore',
  'treasure-hunter': 'seek',
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
  sessionScore: number,
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
      case 'score-bronze': earned = sessionScore >= 100; break;
      case 'score-silver': earned = sessionScore >= 500; break;
      case 'score-gold': earned = sessionScore >= 1000; break;
      case 'score-platinum': earned = sessionScore >= 5000; break;
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
  // Initial in-memory state before AsyncStorage hydration completes.
  settings: DEFAULT_SETTINGS,
  player: DEFAULT_PLAYER,
  session: null,
  isLoading: true,
  newlyEarnedBadges: [],
  saveSlots: [null, null, null],
  activeSlotId: null,
  showTipsOnNext: false,

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

  /** Creates a new game session — builds task pools, draws initial hand + challenges, assigns to save slot */
  startSession: (customName?: string) => {
    const { settings, saveSlots } = get();

    // New sessions automatically claim the first empty save slot so the player
    // always has a resumable run even before manually saving.
    // Find the first empty slot
    const emptyIndex = saveSlots.findIndex(s => s === null);
    if (emptyIndex === -1) return; // All slots full — cannot start a new session

    // Build the eligible content pools from the current park selection and filters.
    const { small, big } = buildTaskPools(settings);

    // Deal the opening hand and opening challenge board from those fresh pools.
    const hand = drawFromPool(small, [], 5);
    const challengeTasks = drawChallengeBoard(big, 3);

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

    // Build default slot name: "Mar 29 - Magic Kingdom" (overridden by customName if provided)
    const date = new Date();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = `${monthNames[date.getMonth()]} ${date.getDate()}`;
    const parkName = PARKS.find(p => p.id === settings.parkIds[0])?.name ?? 'Unknown Park';
    const slotName = customName?.trim() || `${formatted} - ${parkName}`;

    const slot: SaveSlot = {
      id: `slot-${Date.now()}`,
      name: slotName,
      createdAt: Date.now(),
      lastSavedAt: Date.now(),
      session,
      settings: { ...settings },
      badges: DEFAULT_BADGES.map(b => ({ ...b, earned: false, earnedAt: undefined })),
      categoryCompletions: {},
      visitedParks: [...settings.parkIds],
    };

    const newSlots = [...saveSlots];
    newSlots[emptyIndex] = slot;

    set({ session, saveSlots: newSlots, activeSlotId: slot.id, showTipsOnNext: true });
    get().saveToStorage();
  },

  /** Ends the active session — finalises badge state on the save slot, marks inactive */
  endSession: () => {
    const { session, saveSlots, activeSlotId } = get();
    if (!session) return;

    // Build final category completion counts from the completed task list
    const finalCatCounts: Record<string, number> = {};
    for (const t of session.completedTasks) {
      finalCatCounts[t.category] = (finalCatCounts[t.category] || 0) + 1;
    }

    // Keep the slot with its final badge/stats state so the player can review
    // their results after the game ends. Clear activeSlotId so no game is "active".
    const newSlots = saveSlots.map(s => {
      if (s && s.id === activeSlotId) {
        return {
          ...s,
          session: { ...session, active: false },
          categoryCompletions: finalCatCounts,
          visitedParks: [...new Set([...s.visitedParks, ...session.parkIds])],
          lastSavedAt: Date.now(),
        };
      }
      return s;
    });

    set({
      session: { ...session, active: false },
      saveSlots: newSlots,
      activeSlotId: null,
    });
    get().saveToStorage();
  },

  // ─── Save slot actions ───────────────────────────────────────────────────

  /** Save current session to a specific slot */
  saveGame: (slotId, name?) => {
    const { session, settings, saveSlots } = get();
    if (!session) return;

    const newSlots = saveSlots.map(s => {
      if (s && s.id === slotId) {
        // Save slots capture both session state and settings so loading the
        // run later restores the same task-generation rules.
        return {
          ...s,
          name: name ?? s.name,
          lastSavedAt: Date.now(),
          session: { ...session },
          settings: { ...settings },
        };
      }
      return s;
    });

    set({ saveSlots: newSlots });
    get().saveToStorage();
  },

  /** Load a save slot and set it as active */
  loadSlot: (slotId) => {
    const { saveSlots } = get();
    const slot = saveSlots.find(s => s && s.id === slotId);
    if (!slot) return;

    // Restore the saved session snapshot and the paired settings snapshot together.
    set({
      session: { ...slot.session },
      settings: { ...slot.settings },
      activeSlotId: slotId,
    });
    get().saveToStorage();
  },

  /** Delete a save slot */
  deleteSlot: (slotId) => {
    const { saveSlots, activeSlotId } = get();
    const newSlots = saveSlots.map(s => (s && s.id === slotId ? null : s));

    const updates: Partial<GameState> = { saveSlots: newSlots };
    if (activeSlotId === slotId) {
      updates.activeSlotId = null;
      updates.session = null;
    }

    set(updates as any);
    get().saveToStorage();
  },

  /** Rename the currently active save slot */
  renameActiveSlot: (name) => {
    const { saveSlots, activeSlotId } = get();
    if (!activeSlotId) return;
    const newSlots = saveSlots.map(s =>
      s && s.id === activeSlotId ? { ...s, name: name.trim() } : s
    );
    set({ saveSlots: newSlots } as any);
    get().saveToStorage();
  },

  /** Auto-save to the active slot if one exists */
  autoSave: () => {
    const { activeSlotId } = get();
    if (!activeSlotId) return;
    // Auto-save stays intentionally simple by reusing the normal save path.
    get().saveGame(activeSlotId);
  },

  /** Switch parks mid-game — rebuild task pools, keep score/streak/completions, redraw hand and challenges */
  switchPark: (newParkIds) => {
    const { session, settings } = get();
    if (!session) return;

    // Update settings with new park IDs
    const updatedSettings: Settings = { ...settings, parkIds: newParkIds };

    // Rebuild task pools with new settings
    const { small, big } = buildTaskPools(updatedSettings);

    // Draw fresh hand and challenge tasks from new pools
    const hand = drawFromPool(small, session.completedTasks, 5);
    const challengeTasks = drawChallengeBoard(big, 3);

    // Deduplicate parkIds — keep existing + add new
    const allParkIds = [...new Set([...session.parkIds, ...newParkIds])];

    const updatedSession: Session = {
      ...session,
      parkIds: allParkIds,
      hand,
      challengeTasks,
      // Keep: completedTasks, sessionScore, currentStreak, totalCompletions, discardsRemaining
    };

    set({ settings: updatedSettings, session: updatedSession });
    get().autoSave();
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

    // Challenge tasks and hand cards draw replacements from different source pools.
    if (isChallenge) {
      task = session.challengeTasks.find(t => t.id === taskId);
      if (!task) return;
      const { big } = buildTaskPools(settings);
      const replacement = pickChallengeReplacement(big, newChallengeTasks, taskId);
      newChallengeTasks = replaceInArray(newChallengeTasks, taskId, replacement);
    } else {
      task = session.hand.find(t => t.id === taskId);
      if (!task) return;
      const { small } = buildTaskPools(settings);
      const handAfterRemoval = newHand.filter(t => t.id !== taskId);
      const replacement = pickReplacement(small, newHand, session.completedTasks, handAfterRemoval);
      newHand = replaceInArray(newHand, taskId, replacement);
    }

    // Every completion extends the streak and may trigger streak-based rewards.
    const newStreak = session.currentStreak + 1;
    let streakBonus = 0;
    if (newStreak > 0 && newStreak % 5 === 0) {
      streakBonus = 10;
    }

    const newScore = session.sessionScore + task.points + streakBonus;
    const newTotalCompletions = session.totalCompletions + 1;

    // Discards refill slowly as a progress reward, capped at the UI max of 2.
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

    // Check badges using the active save slot's badge state (per-game, not lifetime)
    const { saveSlots, activeSlotId } = get();
    const activeSlot = saveSlots.find(s => s && s.id === activeSlotId);

    if (activeSlot) {
      const allVisited = [...new Set([...activeSlot.visitedParks, ...updatedSession.parkIds])];
      const combinedCounts = buildCategoryCounts(
        activeSlot.categoryCompletions || {},
        updatedSession.completedTasks,
      );
      const totalCompletions = Object.values(combinedCounts).reduce((a, b) => a + b, 0);

      let updatedBadges = checkBadges(
        activeSlot.badges, combinedCounts, totalCompletions,
        newStreak, newScore, allVisited,
      );
      // Run twice so completionist badges can see freshly earned category badges
      updatedBadges = checkBadges(
        updatedBadges, combinedCounts, totalCompletions,
        newStreak, newScore, allVisited,
      );

      const freshlyEarned = findNewlyEarned(activeSlot.badges, updatedBadges);

      const newSlots = saveSlots.map(s =>
        s && s.id === activeSlotId
          ? { ...s, badges: updatedBadges, visitedParks: allVisited }
          : s,
      );

      set({
        session: updatedSession,
        saveSlots: newSlots,
        newlyEarnedBadges: [...get().newlyEarnedBadges, ...freshlyEarned],
      });
    } else {
      set({ session: updatedSession });
    }
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
    const handAfterRemoval = session.hand.filter(t => t.id !== taskId);
    const replacement = pickReplacement(small, session.hand, session.completedTasks, handAfterRemoval);
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
    const replacement = pickChallengeReplacement(big, session.challengeTasks, taskId);
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
      // Correct trivia uses the same completion pipeline as any other hand task.
      get().completeTask(taskId, false);
    } else {
      // Wrong trivia: replace card and reset streak, but don't use a discard
      const { session, settings } = get();
      if (!session) return;

      const task = session.hand.find(t => t.id === taskId);
      if (!task) return;

      const { small } = buildTaskPools(settings);
      const handAfterRemoval = session.hand.filter(t => t.id !== taskId);
      const replacement = pickReplacement(small, session.hand, session.completedTasks, handAfterRemoval);
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
    // Clears the transient unlock queue once the popup sequence is complete.
    set({ newlyEarnedBadges: [] });
  },

  triggerTips: () => {
    set({ showTipsOnNext: true });
  },

  clearPendingTips: () => {
    set({ showTipsOnNext: false });
  },

  // ─── Data management ──────────────────────────────────────────────────────

  /** Wipes all save data — preserves profile name, clears all games and badges */
  resetAllData: async () => {
    const { player } = get();
    const freshPlayer: Player = {
      ...DEFAULT_PLAYER,
      name: player.name,
    };
    await AsyncStorage.removeItem('parkquest_state');
    set({
      player: freshPlayer,
      session: null,
      newlyEarnedBadges: [],
      saveSlots: [null, null, null],
      activeSlotId: null,
    });
    await get().saveToStorage();
  },

  /** Hydrates state from AsyncStorage on app launch */
  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem('parkquest_state');
      if (raw) {
        const saved = JSON.parse(raw);

        let saveSlots: (SaveSlot | null)[] = saved.saveSlots ?? [null, null, null];
        let activeSlotId: string | null = saved.activeSlotId ?? null;

        // Migration support for older saves that predate the dedicated save-slot
        // system. Legacy active sessions are moved into slot 0 automatically.
        const session = saved.session ?? null;
        if (session && session.active && !saved.saveSlots) {
          const date = new Date(session.startedAt);
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const formatted = `${monthNames[date.getMonth()]} ${date.getDate()}`;
          const parkName = PARKS.find(p => p.id === session.parkIds?.[0])?.name ?? 'Unknown Park';
          const slotName = `${formatted} - ${parkName}`;

          const migratedSlot: SaveSlot = {
            id: `slot-migrated-${Date.now()}`,
            name: slotName,
            createdAt: session.startedAt,
            lastSavedAt: Date.now(),
            session,
            settings: saved.settings ? { ...DEFAULT_SETTINGS, ...saved.settings } : { ...DEFAULT_SETTINGS },
            badges: DEFAULT_BADGES.map(b => ({ ...b, earned: false, earnedAt: undefined })),
            categoryCompletions: {},
            visitedParks: session.parkIds ?? [],
          };
          saveSlots = [migratedSlot, null, null];
          activeSlotId = migratedSlot.id;
        }

        // Migrate older save slots that predate per-slot badge storage
        saveSlots = saveSlots.map(s => {
          if (!s) return null;
          const raw = s as any;
          return {
            ...s,
            badges: raw.badges ?? DEFAULT_BADGES.map((b: Badge) => ({ ...b, earned: false, earnedAt: undefined })),
            categoryCompletions: raw.categoryCompletions ?? {},
            visitedParks: raw.visitedParks ?? (s.session?.parkIds ?? []),
          };
        });

        // Migrate old category toggle keys to new names
        const rawToggles = (saved.settings?.categoryToggles ?? {}) as Record<string, boolean>;
        const migratedToggles: Partial<CategoryToggles> = { ...rawToggles } as any;
        const KEY_RENAMES: Record<string, keyof CategoryToggles> = {
          observation: 'find',
          action: 'act',
          food: 'treat',
          pin: 'pins',
          character: 'meet',
          exploration: 'explore',
          scavenger: 'seek',
        };
        for (const [oldKey, newKey] of Object.entries(KEY_RENAMES)) {
          if (oldKey in rawToggles && !(newKey in rawToggles)) {
            (migratedToggles as any)[newKey] = rawToggles[oldKey];
            delete (migratedToggles as any)[oldKey];
          }
        }
        const migratedSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...saved.settings,
          categoryToggles: { ...DEFAULT_SETTINGS.categoryToggles, ...migratedToggles },
        };

        // Load only identity fields from player — badges/score now live on save slots
        const savedPlayer = (saved.player ?? {}) as any;
        set({
          settings: migratedSettings,
          player: {
            id: savedPlayer.id ?? DEFAULT_PLAYER.id,
            name: savedPlayer.name ?? DEFAULT_PLAYER.name,
            color: savedPlayer.color ?? DEFAULT_PLAYER.color,
          },
          session: session,
          saveSlots,
          activeSlotId,
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
    const { settings, player, session, saveSlots, activeSlotId } = get();
    // Persist the full gameplay snapshot so the app can restore seamlessly on launch.
    await AsyncStorage.setItem('parkquest_state', JSON.stringify({ settings, player, session, saveSlots, activeSlotId }));
  },
}));
