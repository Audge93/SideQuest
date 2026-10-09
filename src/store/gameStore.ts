/**
 * gameStore.ts — Central Zustand store for all game state
 *
 * Manages settings, player profile, active session, badge tracking, and
 * persistence via AsyncStorage. All game actions (start, complete, discard,
 * swap, trivia, reset) flow through this store.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { matchesActivityPreferences } from '../data/activityPreferences';
import { Task, Session, Settings, Player, Badge, BadgeTier, CategoryToggles, SaveSlot, Draft, MAX_SAVE_SLOTS } from '../types';
import { SMALL_TASKS, BIG_TASKS, RIDE_ACTIVITY_TASKS, generateRideTasks } from '../data/tasks';
import { WHO_AM_I } from '../data/whoAmI';
import { TRIVIA_TASKS } from '../data/trivia';
import { RIDES, PARKS } from '../data/parks';
import { correctTriviaAnswers } from '../utils/trivia';
import { badgeProgress, gameBadgeStats } from '../utils/badges';
import { defaultGameName } from '../utils/gameSetup';

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
  baseId: string, name: string, category: string, displayCat: string,
  tiers: [number, number, number, number],
): Badge[] {
  const tierNames: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  return tierNames.map((tier, i) => ({
    id: `${baseId}-${tier}`,
    name: `${name} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
    description: `Complete ${tiers[i]} ${displayCat} tasks`,
    tier,
    earned: false,
  }));
}

const DEFAULT_BADGES: Badge[] = [
  // Category badges (10 categories x 4 tiers = 40)
  ...catBadges('sharp-eye', 'Sharp Eye', 'find', 'Find', [10, 25, 50, 100]),
  ...catBadges('shutterbug', 'Shutterbug', 'photo', 'Photo', [10, 25, 50, 100]),
  ...catBadges('brain-box', 'Brain Box', 'trivia', 'Trivia', [10, 25, 50, 100]),
  ...catBadges('scene-stealer', 'Scene Stealer', 'act', 'Act', [10, 25, 50, 100]),
  ...catBadges('thrill-seeker', 'Thrill Seeker', 'ride', 'Ride', [10, 25, 50, 100]),
  ...catBadges('foodie', 'Foodie', 'treat', 'Treat', [10, 25, 50, 100]),
  ...catBadges('pin-pro', 'Pin Pro', 'pins', 'Pins', [10, 25, 50, 100]),
  ...catBadges('star-struck', 'Star Struck', 'meet', 'Meet', [10, 25, 50, 100]),
  ...catBadges('trailblazer', 'Trailblazer', 'explore', 'Explore', [10, 25, 50, 100]),
  ...catBadges('treasure-hunter', 'Treasure Hunter', 'seek', 'Seek', [10, 25, 50, 100]),
  // Milestone badges (tiered)
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first task', tier: 'bronze', earned: false },
  // Streak tiers
  { id: 'streak-bronze', name: 'On Fire (Bronze)', description: 'Reach a 5-task streak', tier: 'bronze', earned: false },
  { id: 'streak-silver', name: 'On Fire (Silver)', description: 'Reach a 10-task streak', tier: 'silver', earned: false },
  { id: 'streak-gold', name: 'Blazing (Gold)', description: 'Reach a 20-task streak', tier: 'gold', earned: false },
  { id: 'streak-platinum', name: 'Inferno (Platinum)', description: 'Reach a 30-task streak', tier: 'platinum', earned: false },
  // Per-game score tiers, including minigame points
  { id: 'score-bronze', name: 'Centurion (Bronze)', description: 'Earn 100 points in this game', tier: 'bronze', earned: false },
  { id: 'score-silver', name: 'High Roller (Silver)', description: 'Earn 500 points in this game', tier: 'silver', earned: false },
  { id: 'score-gold', name: 'Legend (Gold)', description: 'Earn 1,000 points in this game', tier: 'gold', earned: false },
  { id: 'score-platinum', name: 'Mythic (Platinum)', description: 'Earn 5,000 points in this game', tier: 'platinum', earned: false },
  // Park hopper tiers
  { id: 'hopper-bronze', name: 'Park Hopper (Bronze)', description: 'Visit 2 parks', tier: 'bronze', earned: false },
  { id: 'hopper-silver', name: 'Park Hopper (Silver)', description: 'Visit 3 parks', tier: 'silver', earned: false },
  { id: 'hopper-gold', name: 'Park Hopper (Gold)', description: 'Visit all 4 Walt Disney World parks', tier: 'gold', earned: false },
  // Completionist tiers
  { id: 'completionist-bronze', name: 'Completionist (Bronze)', description: 'Earn all bronze category badges', tier: 'bronze', earned: false },
  { id: 'completionist-silver', name: 'Completionist (Silver)', description: 'Earn all silver category badges', tier: 'silver', earned: false },
  { id: 'completionist-gold', name: 'Completionist (Gold)', description: 'Earn all gold category badges', tier: 'gold', earned: false },
  { id: 'completionist-platinum', name: 'Completionist (Platinum)', description: 'Earn all platinum category badges', tier: 'platinum', earned: false },
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
  reduceMotion: 'system', textSize: 'system', readableFont: false, highContrast: false,
  seatedOnly: false, lessWalking: false, noPerforming: false,
};

const DEFAULT_PLAYER: Player = {
  id: 'player-1',
  name: 'Player 1',
  color: '#89B4F7',
};

/** Rebuilds a save's badges from the current definitions, keeping earned progress by id. */
function syncBadges(saved: Badge[] | undefined): Badge[] {
  const byId = new Map((saved ?? []).map(b => [b.id, b]));
  return DEFAULT_BADGES.map(def => {
    const prev = byId.get(def.id);
    return { ...def, earned: prev?.earned ?? false, earnedAt: prev?.earnedAt };
  });
}

// Refresh current wording and catalog names in previously dealt cards.
function refreshSavedTrivia(session: Session, settings?: Settings): Session {
  const current = new Map([...TRIVIA_TASKS, ...SMALL_TASKS, ...BIG_TASKS, ...RIDE_ACTIVITY_TASKS, ...generateRideTasks(RIDES)].map(task => [task.id, task]));
  const refresh = (task: Task) => {
    const known = current.get(task.id.split('::challenge::')[0]);
    return known ? { ...task, ...known, id: task.id } : task;
  };
  const retired = new Set(['wdw-mk-mickey-minnies-runaway-railway', 'wdw-ak-dinosaur', 'wdw-ak-triceratop-spin']);
  const hasRetired = session.challengeTasks.some(task => task.rideId && retired.has(task.rideId));
  const poolSettings: Settings = { ...DEFAULT_SETTINGS, ...settings, parkIds: settings?.parkIds ?? session.parkIds, categoryToggles: { ...DEFAULT_SETTINGS.categoryToggles, ...settings?.categoryToggles } };
  const challengeTasks = hasRetired ? drawChallengeBoard(buildTaskPools(poolSettings).big, 3) : session.challengeTasks.map(refresh);
  return { ...session, fiftyFiftyUses: session.fiftyFiftyUses ?? 2,
    triviaEliminatedChoices: session.triviaEliminatedChoices ?? {}, hand: session.hand.map(refresh), challengeTasks,
    draft: session.draft ? { ...session.draft, options: session.draft.options.map(refresh) } : null };
}

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
  updateSettings: (patch: Partial<Settings>) => boolean;
  updateCategoryToggle: (category: keyof CategoryToggles, value: boolean) => void;
  updatePlayerName: (name: string) => void;

  // Session lifecycle.
  startSession: (customName?: string, setup?: { settings: Settings; playerName: string }) => boolean;
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
  acknowledgeMinigameHelp: (game: string) => void;
  startWhoAmI: () => void;
  revealWhoClue: () => void;
  answerWhoAmI: (choice: number) => void;
  startTriviaSprint: (seconds: 30 | 60) => void;
  answerSprint: (choice: number, questionId?: string) => void;
  finishSprint: () => void;
  reviewSprintQuestion: (index: number) => void;
  answerTrivia: (taskId: string, correct: boolean) => void;
  useTriviaFiftyFifty: (taskId: string) => void;
  chooseDraftCard: (taskId: string) => void;
  refreshBadges: () => void;
  clearNewBadges: () => void;
  resetAllData: () => Promise<void>;
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
 * the player's settings — filters by enabled categories, selected park,
 * and optionally by rider height requirements.
 */
function buildTaskPools(settings: Settings): { small: Task[]; big: Task[] } {
  const { categoryToggles, parkIds, heightFilterEnabled, minHeightInches } = settings;

  // Small pool: find, photo, act from SMALL_TASKS + trivia from TRIVIA_TASKS
  const enabledSmallCategories = (['find', 'photo', 'act'] as const).filter(c => categoryToggles[c]);
  let small: Task[] = SMALL_TASKS.filter(t => enabledSmallCategories.includes(t.category as any));
  if (categoryToggles.trivia) {
    small = [...small, ...TRIVIA_TASKS];
  }

  // Big pool: treat, pins, meet, explore, seek from BIG_TASKS + ride tasks
  const enabledBigCategories = (['treat', 'pins', 'meet', 'explore', 'seek'] as const).filter(c => categoryToggles[c]);
  let big: Task[] = BIG_TASKS.filter(t => enabledBigCategories.includes(t.category as any));

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
      return !(heightFilterEnabled && t.heightRequirement! > minHeightInches);
    });
    big = [...big, ...rideActivityTasks];
  }

  return { small: shuffle(small.filter(t => matchesActivityPreferences(t, settings))), big: shuffle(big.filter(t => matchesActivityPreferences(t, settings))) };
}

const MAX_TRIVIA_IN_HAND = 3;

/** Draws up to `count` tasks from a pool, excluding already-used tasks, capping trivia at MAX_TRIVIA_IN_HAND */
function drawFromPool(pool: Task[], exclude: Task[], count: number): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const available = pool.filter(t => !excludeIds.has(t.id));
  const result: Task[] = [];
  let triviaCount = 0;
  const triviaLimit = pool.some(task => task.category !== 'trivia') ? MAX_TRIVIA_IN_HAND : count;
  for (const task of available) {
    if (result.length >= count) break;
    if (task.category === 'trivia') {
      if (triviaCount >= triviaLimit) continue;
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

const DRAFT_SIZE = 3;

/**
 * Picks up to DRAFT_SIZE distinct options for the player to choose from,
 * preferring different categories so the choice feels meaningful.
 */
function pickDraftOptions(pool: Task[], exclude: Task[], handAfterRemoval: Task[]): Task[] {
  const excludeIds = new Set(exclude.map(t => t.id));
  const handIds = new Set(handAfterRemoval.map(t => t.id));
  const triviaFull = pool.some(task => task.category !== 'trivia') &&
    handAfterRemoval.filter(t => t.category === 'trivia').length >= MAX_TRIVIA_IN_HAND;
  const eligible = (t: Task) => !(triviaFull && t.category === 'trivia');

  let available = pool.filter(t => !excludeIds.has(t.id) && eligible(t));
  if (available.length < DRAFT_SIZE) {
    // Pool nearly exhausted — recycle completed tasks, only avoid what's in hand.
    const seen = new Set(available.map(t => t.id));
    const recycled = pool.filter(t => !handIds.has(t.id) && !seen.has(t.id) && eligible(t));
    available = [...available, ...recycled];
  }

  const shuffled = shuffle(available);
  const picked: Task[] = [];
  const usedCategories = new Set<string>();
  for (const t of shuffled) {
    if (picked.length >= DRAFT_SIZE) break;
    if (usedCategories.has(t.category)) continue;
    picked.push(t);
    usedCategories.add(t.category);
  }
  for (const t of shuffled) {
    if (picked.length >= DRAFT_SIZE) break;
    if (!picked.includes(t)) picked.push(t);
  }
  return picked;
}

/** Removes a hand card and prepares a draft to refill its slot. */
function openHandSlot(session: Session, settings: Settings, taskId: string): { hand: Task[]; draft: Draft | null } {
  const slotIndex = session.hand.findIndex(t => t.id === taskId);
  const hand = session.hand.filter(t => t.id !== taskId);
  const { small } = buildTaskPools(settings);
  const options = pickDraftOptions(small, [...session.hand, ...session.completedTasks], hand);
  return { hand, draft: options.length > 0 ? { options, slotIndex } : null };
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

function checkedSlot(slot: SaveSlot, session = slot.session): SaveSlot {
  const stats = gameBadgeStats(slot, session);
  let badges = slot.badges;
  for (let pass = 0; pass < 2; pass++) badges = badges.map(b => {
    const progress = badgeProgress(b, stats, badges);
    return !b.earned && progress && progress.current >= progress.goal ? { ...b, earned: true, earnedAt: Date.now() } : b;
  });
  return { ...slot, badges, visitedParks: stats.parks };
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
    const next = { ...get().settings, ...patch };
    const pools = buildTaskPools(next);
    if (pools.small.length < 5 || pools.big.length < 3) return false;
    set(s => ({ settings: { ...s.settings, ...patch } }));
    if (get().session && get().activeSlotId) get().autoSave();
    else get().saveToStorage();
    return true;
  },

  updateCategoryToggle: (category, value) => {
    const current = get().settings.categoryToggles;
    const group: (keyof CategoryToggles)[] = ['find', 'photo', 'trivia', 'act'].includes(category)
      ? ['find', 'photo', 'trivia', 'act'] : ['ride', 'treat', 'pins', 'meet', 'explore', 'seek'];
    if (!value && !group.some(key => key !== category && current[key])) return;
    get().updateSettings({ categoryToggles: { ...current, [category]: value } });
  },

  updatePlayerName: (name) => {
    if (!name.trim()) return;
    set(s => ({ player: { ...s.player, name: name.trim().slice(0, 20) } }));
    get().saveToStorage();
  },

  // ─── Session lifecycle ────────────────────────────────────────────────────

  /** Creates a new game session — builds task pools, draws initial hand + challenges, assigns to save slot */
  startSession: (customName, setup) => {
    const { saveSlots, player } = get();
    const source = setup?.settings ?? get().settings;
    const settings = { ...source, parkIds: [...source.parkIds], categoryToggles: { ...source.categoryToggles } };
    const playerName = setup ? setup.playerName.trim() : player.name;
    if (!playerName || !settings.parkIds.length || settings.parkIds.some(id => !PARKS.some(park => park.id === id))) return false;

    // New sessions automatically claim the first empty save slot so the player
    // always has a resumable run even before manually saving.
    // Find the first empty slot
    const emptyIndex = saveSlots.findIndex(s => s === null);
    if (emptyIndex === -1) return false; // All slots full — cannot start a new session

    // Build the eligible content pools from the current park selection and filters.
    const { small, big } = buildTaskPools(settings);
    if (small.length < 5 || big.length < 3) return false;

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
      fiftyFiftyUses: 2,
      triviaEliminatedChoices: {},
      totalCompletions: 0,
      hand,
      challengeTasks,
      completedTasks: [],
    };

    // Build default slot name: "Mar 29 - Magic Kingdom" (overridden by customName if provided)
    const slotName = customName?.trim() || defaultGameName(settings.parkIds[0]);

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

    set({ settings, player: { ...player, name: playerName }, session, saveSlots: newSlots, activeSlotId: slot.id, showTipsOnNext: true, newlyEarnedBadges: [] });
    get().saveToStorage();
    return true;
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
    const { saveSlots, settings } = get();
    const slot = saveSlots.find(s => s && s.id === slotId);
    if (!slot) return;

    // Restore the saved session snapshot and the paired settings snapshot together.
    set({
      session: refreshSavedTrivia(slot.session, slot.settings),
      settings: { ...DEFAULT_SETTINGS, ...slot.settings,
        categoryToggles: { ...DEFAULT_SETTINGS.categoryToggles, ...slot.settings?.categoryToggles },
        darkMode: settings.darkMode, soundEnabled: settings.soundEnabled, hapticsEnabled: settings.hapticsEnabled,
        reduceMotion: settings.reduceMotion, textSize: settings.textSize, readableFont: settings.readableFont, highContrast: settings.highContrast },
      activeSlotId: slotId,
      newlyEarnedBadges: [],
    });
    get().refreshBadges();
    get().autoSave();
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
    if (!activeSlotId || !name.trim()) return;
    const newSlots = saveSlots.map(s =>
      s && s.id === activeSlotId ? { ...s, name: name.trim().slice(0, 30) } : s
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
      draft: null,
      // Keep: completedTasks, sessionScore, currentStreak, totalCompletions, discardsRemaining
    };

    set({ settings: updatedSettings, session: updatedSession });
    get().refreshBadges();
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
    let newDraft = session.draft ?? null;

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
      ({ hand: newHand, draft: newDraft } = openHandSlot(session, settings, taskId));
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
      fiftyFiftyUses: Math.min(3, (session.fiftyFiftyUses ?? 2) + (newTotalCompletions % 5 === 0 ? 1 : 0)),
      triviaEliminatedChoices: Object.fromEntries(Object.entries(session.triviaEliminatedChoices ?? {}).filter(([id]) => id !== taskId)),
      totalCompletions: newTotalCompletions,
      hand: newHand,
      challengeTasks: newChallengeTasks,
      completedTasks: [...session.completedTasks, task],
      draft: newDraft,
    };

    set({ session: updatedSession });
    get().refreshBadges();
    get().saveToStorage();
  },

  /** Discards a hand card — resets streak, draws replacement, costs 1 discard pip */
  discardTask: (taskId) => {
    const { session, settings } = get();
    if (!session) return;
    if (session.discardsRemaining <= 0) return;

    const task = session.hand.find(t => t.id === taskId);
    if (!task) return;

    const { hand, draft } = openHandSlot(session, settings, taskId);

    const updatedSession: Session = {
      ...session,
      currentStreak: 0,
      discardsRemaining: session.discardsRemaining - 1,
      triviaEliminatedChoices: Object.fromEntries(Object.entries(session.triviaEliminatedChoices ?? {}).filter(([id]) => id !== taskId)),
      hand,
      draft,
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
  useTriviaFiftyFifty: (taskId) => {
    const { session } = get();
    const task = session?.hand.find(t => t.id === taskId);
    if (!session || !task || task.category !== 'trivia' || task.triviaChoices?.length !== 4 ||
      correctTriviaAnswers(task).length !== 1 || session.fiftyFiftyUses <= 0 || session.triviaEliminatedChoices[taskId]) return;
    const correct = correctTriviaAnswers(task)[0];
    const removed = shuffle([0, 1, 2, 3].filter(index => index !== correct)).slice(0, 2);
    set({ session: { ...session, fiftyFiftyUses: session.fiftyFiftyUses - 1,
      triviaEliminatedChoices: { ...session.triviaEliminatedChoices, [taskId]: removed } } });
    get().autoSave();
  },

  acknowledgeMinigameHelp: (game) => {
    const { session } = get(); if (!session) return;
    set({ session: { ...session, minigameHelpSeen: [...new Set([...(session.minigameHelpSeen ?? []), game])] } }); get().autoSave();
  },
  startWhoAmI: () => {
    const { session } = get(); if (!session || (session.whoAmI && !session.whoAmI.finished)) return;
    const recent = new Set(session.recentWhoAmI ?? []);
    const fresh = WHO_AM_I.filter(c => !recent.has(c.id));
    const character = shuffle(fresh.length ? fresh : WHO_AM_I)[0];
    const choices = shuffle([character.name, ...shuffle(WHO_AM_I.filter(c => c.id !== character.id)).slice(0, 3).map(c => c.name)]);
    set({ session: { ...session, recentWhoAmI: [...(session.recentWhoAmI ?? []), character.id].slice(-15),
      whoAmI: { characterId: character.id, choices, cluesRevealed: 1, finished: false, earnedPoints: 0 } } }); get().autoSave();
  },
  revealWhoClue: () => {
    const { session } = get(); const round = session?.whoAmI;
    if (!session || !round || round.finished || round.cluesRevealed >= 3) return;
    set({ session: { ...session, whoAmI: { ...round, cluesRevealed: round.cluesRevealed + 1 } } }); get().autoSave();
  },
  answerWhoAmI: (choice) => {
    const { session } = get(); const round = session?.whoAmI;
    if (!session || !round || round.finished || !Number.isInteger(choice) || choice < -1 || choice >= round.choices.length) return;
    const character = WHO_AM_I.find(c => c.id === round.characterId); if (!character) return;
    const earnedPoints = round.choices[choice] === character.name ? (4 - round.cluesRevealed) * 5 : 0;
    set({ session: { ...session, sessionScore: session.sessionScore + earnedPoints,
      whoAmI: { ...round, answer: choice, finished: true, earnedPoints } } }); get().refreshBadges(); get().autoSave();
  },
  startTriviaSprint: (seconds) => {
    const { session } = get();
    if (!session || (seconds !== 30 && seconds !== 60) || (session.triviaSprint && !session.triviaSprint.finished)) return;
    const pool = TRIVIA_TASKS.filter(t => t.triviaChoices && correctTriviaAnswers(t).length === 1 && t.description.length <= 180 && t.triviaChoices.every(c => c.length <= 60));
    const recent = new Set(session.recentSprintQuestions ?? []);
    const questions = [...shuffle(pool.filter(t => !recent.has(t.id))), ...shuffle(pool.filter(t => recent.has(t.id)))].slice(0, 10);
    if (questions.length !== 10) return;
    set({ session: { ...session, recentSprintQuestions: [...(session.recentSprintQuestions ?? []), ...questions.map(t => t.id)].slice(-50),
      triviaSprint: { id: String(Date.now()) + Math.random(), questions, answers: [], deadline: Date.now() + seconds * 1000, durationSeconds: seconds, finished: false, earnedPoints: 0 } } });
    get().autoSave();
  },
  answerSprint: (choice, questionId) => {
    const { session } = get(); const round = session?.triviaSprint;
    if (!session || !round || round.finished) return;
    if (Date.now() >= round.deadline) { get().finishSprint(); return; }
    const question = round.questions[round.answers.length];
    if (!question || (questionId !== undefined && questionId !== question.id) || !Number.isInteger(choice) || choice < 0 || choice >= (question.triviaChoices?.length ?? 0)) return;
    const answers = [...round.answers, choice];
    set({ session: { ...session, triviaSprint: { ...round, answers } } });
    if (answers.length === 10) get().finishSprint(); else get().autoSave();
  },
  finishSprint: () => {
    const { session } = get(); const round = session?.triviaSprint;
    if (!session || !round || round.finished || (round.answers.length < 10 && Date.now() < round.deadline)) return;
    const correct = round.questions.filter((q, i) => correctTriviaAnswers(q).includes(round.answers[i]));
    const multiplier = correct.length === 10 ? 3 : correct.length === 9 ? 2 : 1;
    const earnedPoints = correct.reduce((sum, q) => sum + q.points, 0) * multiplier;
    set({ session: { ...session, sessionScore: session.sessionScore + earnedPoints, triviaSprint: { ...round, finished: true, earnedPoints } } });
    get().refreshBadges();
    get().autoSave();
  },
  reviewSprintQuestion: (index) => {
    const { session } = get(); const round = session?.triviaSprint;
    if (!session || !round?.finished || !Number.isInteger(index) || index < 0 || index >= round.questions.length) return;
    set({ session: { ...session, triviaSprint: { ...round, reviewIndex: index } } }); get().autoSave();
  },
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

      const { hand, draft } = openHandSlot(session, settings, taskId);

      const updatedSession: Session = {
        ...session,
        currentStreak: 0,
        triviaEliminatedChoices: Object.fromEntries(Object.entries(session.triviaEliminatedChoices ?? {}).filter(([id]) => id !== taskId)),
        hand,
        draft,
      };

      set({ session: updatedSession });
      get().saveToStorage();
    }
  },

  /** Puts the chosen draft option into the hand slot that was opened */
  chooseDraftCard: (taskId) => {
    const { session } = get();
    if (!session?.draft) return;
    const chosen = session.draft.options.find(t => t.id === taskId);
    if (!chosen) return;

    const hand = [...session.hand];
    hand.splice(Math.min(session.draft.slotIndex, hand.length), 0, chosen);

    set({ session: { ...session, hand, draft: null } });
    get().saveToStorage();
  },

  refreshBadges: () => {
    const { session, saveSlots, activeSlotId } = get();
    if (!session) return;
    const slot = saveSlots.find(s => s?.id === activeSlotId);
    if (!slot) return;
    const updated = checkedSlot(slot, session);
    set({ saveSlots: saveSlots.map(s => s?.id === slot.id ? updated : s),
      newlyEarnedBadges: [...get().newlyEarnedBadges, ...findNewlyEarned(slot.badges, updated.badges)] });
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

  /** Clears local games, profile, and preferences. */
  resetAllData: async () => {
    const freshPlayer: Player = {
      ...DEFAULT_PLAYER,
      name: DEFAULT_PLAYER.name,
    };
    await AsyncStorage.removeItem('parkquest_state');
    set({
      player: freshPlayer,
      settings: { ...DEFAULT_SETTINGS, categoryToggles: { ...DEFAULT_SETTINGS.categoryToggles } },
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
        const session = saved.session ? refreshSavedTrivia(saved.session, saved.settings) : null;
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
          return checkedSlot({
            ...s,
            badges: syncBadges(raw.badges),
            categoryCompletions: raw.categoryCompletions ?? {},
            visitedParks: raw.visitedParks ?? (s.session?.parkIds ?? []),
          }, s.id === activeSlotId && session ? session : s.session);
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
        // Drop parks that are no longer offered (e.g. from older multi-resort builds).
        const validParkIds = ((saved.settings?.parkIds ?? []) as string[]).filter(id => PARKS.some(p => p.id === id));
        const migratedSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...saved.settings,
          parkIds: validParkIds.length > 0 ? validParkIds : DEFAULT_SETTINGS.parkIds,
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
