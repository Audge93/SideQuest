import { Badge, SaveSlot, Session } from '../types';
import { PARKS } from '../data/parks';

export const BADGE_CATEGORIES: Record<string, string> = {
  'sharp-eye': 'find', shutterbug: 'photo', 'brain-box': 'trivia', 'scene-stealer': 'act',
  'thrill-seeker': 'ride', foodie: 'treat', 'pin-pro': 'pins', 'star-struck': 'meet',
  trailblazer: 'explore', 'treasure-hunter': 'seek',
};
const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
export interface BadgeStats { categoryCounts: Record<string, number>; completions: number; streak: number; score: number; parks: string[]; }

/** A save retains its completed cards on ending/resuming; stored totals are not additional cards. */
export function gameBadgeStats(slot: SaveSlot, live?: Session | null): BadgeStats {
  const session = live?.id === slot.session.id ? live : slot.session;
  const categoryCounts = { ...slot.categoryCompletions };
  const recorded: Record<string, number> = {};
  for (const task of session.completedTasks) recorded[task.category] = (recorded[task.category] ?? 0) + 1;
  for (const [category, count] of Object.entries(recorded)) categoryCounts[category] = Math.max(categoryCounts[category] ?? 0, count);
  return { categoryCounts, completions: Math.max(session.totalCompletions, Object.values(categoryCounts).reduce((a, b) => a + b, 0)),
    streak: session.currentStreak, score: session.sessionScore,
    parks: [...new Set([...slot.visitedParks, ...session.parkIds])].filter(id => PARKS.some(p => p.id === id)) };
}

/** The same numeric goals drive both unlocking and the displayed progress. */
export function badgeProgress(badge: Badge, stats: BadgeStats, badges: Badge[]) {
  const tier = TIERS.indexOf(badge.tier);
  const base = badge.id.replace(/-(bronze|silver|gold|platinum)$/, '');
  let current = 0, goal = 1, unit = 'cards';
  if (BADGE_CATEGORIES[base]) { current = stats.categoryCounts[BADGE_CATEGORIES[base]] ?? 0; goal = [10, 25, 50, 100][tier]; }
  else if (base === 'first-steps') current = stats.completions;
  else if (base === 'streak') { current = stats.streak; goal = [5, 10, 20, 30][tier]; unit = 'card streak'; }
  else if (base === 'score') { current = stats.score; goal = [100, 500, 1000, 5000][tier]; unit = 'points'; }
  else if (base === 'hopper') { current = stats.parks.length; goal = [2, 3, 4][tier]; unit = 'parks'; }
  else if (base === 'completionist') { current = Object.keys(BADGE_CATEGORIES).filter(id => badges.find(b => b.id === `${id}-${badge.tier}`)?.earned).length; goal = 10; unit = 'category badges'; }
  else return null;
  return { current, goal, unit };
}
