import { Task, Ride } from '../types';

// ─── Small Tasks (110 tasks) ────────────────────────────────────────────────

export const SMALL_TASKS: Task[] = [
  // ── Find 🔍 (observation) ── 30 tasks ──

  // Find – Easy (5 pts)
  { id: 'find-e-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a family wearing matching outfits', points: 5, difficulty: 'easy' },
  { id: 'find-e-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing Mickey ears', points: 5, difficulty: 'easy' },
  { id: 'find-e-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Count trash cans visible from your spot', points: 5, difficulty: 'easy' },
  { id: 'find-e-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a stroller with a balloon', points: 5, difficulty: 'easy' },
  { id: 'find-e-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a cast member name tag from another state/country', points: 5, difficulty: 'easy' },
  { id: 'find-e-6', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot someone carrying a turkey leg', points: 5, difficulty: 'easy' },
  { id: 'find-e-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a water fountain', points: 5, difficulty: 'easy' },
  { id: 'find-e-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a dog in a pet-friendly area', points: 5, difficulty: 'easy' },
  { id: 'find-e-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice a hidden security camera in theming', points: 5, difficulty: 'easy' },
  { id: 'find-e-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing a birthday button', points: 5, difficulty: 'easy' },

  // Find – Medium (10 pts)
  { id: 'find-m-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a Hidden Mickey in your surroundings', points: 10, difficulty: 'medium' },
  { id: 'find-m-2', size: 'small', category: 'observation', displayCategory: 'Find', description: "Spot an animatronic you've never noticed", points: 10, difficulty: 'medium' },
  { id: 'find-m-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find queue theming that tells a story', points: 10, difficulty: 'medium' },
  { id: 'find-m-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot 3 different character-themed hats', points: 10, difficulty: 'medium' },
  { id: 'find-m-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a themed plant or tree', points: 10, difficulty: 'medium' },
  { id: 'find-m-6', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a costume detail unique to your land', points: 10, difficulty: 'medium' },
  { id: 'find-m-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a water feature with a hidden detail', points: 10, difficulty: 'medium' },
  { id: 'find-m-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice a transition detail between lands', points: 10, difficulty: 'medium' },
  { id: 'find-m-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot theming above your eyeline most miss', points: 10, difficulty: 'medium' },
  { id: 'find-m-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a reference to another attraction in your queue', points: 10, difficulty: 'medium' },

  // Find – Hard (15 pts)
  { id: 'find-h-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a vintage park t-shirt', points: 15, difficulty: 'hard' },
  { id: 'find-h-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Identify the background music in your area', points: 15, difficulty: 'hard' },
  { id: 'find-h-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find 3 hidden details in one queue without moving', points: 15, difficulty: 'hard' },
  { id: 'find-h-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot forced perspective architecture', points: 15, difficulty: 'hard' },
  { id: 'find-h-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a hidden date or year', points: 15, difficulty: 'hard' },
  { id: 'find-h-6', size: 'small', category: 'observation', displayCategory: 'Find', description: "Identify an attraction's scent theming", points: 15, difficulty: 'hard' },
  { id: 'find-h-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a tribute to Walt Disney', points: 15, difficulty: 'hard' },
  { id: 'find-h-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a Main Street window dedication', points: 15, difficulty: 'hard' },
  { id: 'find-h-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice pavement texture signaling a land transition', points: 15, difficulty: 'hard' },
  { id: 'find-h-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a prop referencing a real historical event', points: 15, difficulty: 'hard' },

  // ── Photo 📸 ── 20 tasks ──

  // Photo – Easy (5 pts)
  { id: 'photo-e-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Heroic pose in front of nearest landmark', points: 5, difficulty: 'easy' },
  { id: 'photo-e-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group photo same facial expression', points: 5, difficulty: 'easy' },
  { id: 'photo-e-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo of most colorful thing visible', points: 5, difficulty: 'easy' },
  { id: 'photo-e-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Selfie with a themed trash can', points: 5, difficulty: 'easy' },
  { id: 'photo-e-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group pointing opposite directions', points: 5, difficulty: 'easy' },
  { id: 'photo-e-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Shoes in front of iconic spot', points: 5, difficulty: 'easy' },
  { id: 'photo-e-7', size: 'small', category: 'photo', displayCategory: 'Photo', description: "Photo like you're holding the castle", points: 5, difficulty: 'easy' },

  // Photo – Medium (10 pts)
  { id: 'photo-m-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Recreate classic tourist photo with twist', points: 10, difficulty: 'medium' },
  { id: 'photo-m-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo story using only park props', points: 10, difficulty: 'medium' },
  { id: 'photo-m-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Lowest angle photo possible', points: 10, difficulty: 'medium' },
  { id: 'photo-m-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group mid-jump photo', points: 10, difficulty: 'medium' },
  { id: 'photo-m-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Park detail that looks like a face', points: 10, difficulty: 'medium' },
  { id: 'photo-m-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Dramatic movie-poster photo', points: 10, difficulty: 'medium' },
  { id: 'photo-m-7', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Everyone different character pose', points: 10, difficulty: 'medium' },

  // Photo – Hard (15 pts)
  { id: 'photo-h-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Recreate famous movie scene', points: 15, difficulty: 'hard' },
  { id: 'photo-h-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo that could be a postcard', points: 15, difficulty: 'hard' },
  { id: 'photo-h-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Forced perspective with architecture', points: 15, difficulty: 'hard' },
  { id: 'photo-h-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Timed photo with moving ride behind', points: 15, difficulty: 'hard' },
  { id: 'photo-h-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: '3 photos: beginning-middle-end story', points: 15, difficulty: 'hard' },
  { id: 'photo-h-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Dramatic farewell photo', points: 15, difficulty: 'hard' },

  // ── Act 🎬 (action) ── 20 tasks ──

  // Act – Easy (5 pts)
  { id: 'act-e-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Wave at riders on a nearby ride', points: 5, difficulty: 'easy' },
  { id: 'act-e-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic high-five with group member', points: 5, difficulty: 'easy' },
  { id: 'act-e-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Superhero pose, hold 5 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'Royal wave for 10 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Pretend to be a statue for 15 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'March like a toy soldier 15 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-7', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic bow after finishing a ride', points: 5, difficulty: 'easy' },

  // Act – Medium (10 pts)
  { id: 'act-m-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Villain laugh loud enough for nearby people', points: 10, difficulty: 'medium' },
  { id: 'act-m-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Walk like a pirate 30 seconds', points: 10, difficulty: 'medium' },
  { id: 'act-m-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Narrate line like nature documentary', points: 10, difficulty: 'medium' },
  { id: 'act-m-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'British accent for one full minute', points: 10, difficulty: 'medium' },
  { id: 'act-m-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Act out movie scene silently, group guesses', points: 10, difficulty: 'medium' },
  { id: 'act-m-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'Fake tour guide history of your ride', points: 10, difficulty: 'medium' },
  { id: 'act-m-7', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic slow-motion walk 20 seconds', points: 10, difficulty: 'medium' },

  // Act – Hard (15 pts)
  { id: 'act-h-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Sing any song at least 15 seconds', points: 15, difficulty: 'hard' },
  { id: 'act-h-2', size: 'small', category: 'action', displayCategory: 'Act', description: '30-second interpretive dance of your day', points: 15, difficulty: 'hard' },
  { id: 'act-h-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Acceptance speech for imaginary award', points: 15, difficulty: 'hard' },
  { id: 'act-h-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'Act out ride with body/sound effects', points: 15, difficulty: 'hard' },
  { id: 'act-h-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Play-by-play of group eating snack like cooking competition', points: 15, difficulty: 'hard' },
  { id: 'act-h-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'Convince group member to do synchronized dance move', points: 15, difficulty: 'hard' },
];

// ─── Big Tasks (35 tasks) ───────────────────────────────────────────────────

export const BIG_TASKS: Task[] = [
  // ── Treat 🍦 (food) ── 7 tasks ──
  { id: 'treat-e-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try a classic park treat like a churro or turkey leg', points: 25, difficulty: 'easy' },
  { id: 'treat-e-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Share a themed dessert with your group', points: 25, difficulty: 'easy' },
  { id: 'treat-e-3', size: 'big', category: 'food', displayCategory: 'Treat', description: "Try a food cart you've never visited", points: 25, difficulty: 'easy' },
  { id: 'treat-e-4', size: 'big', category: 'food', displayCategory: 'Treat', description: "Get a snack from a land you've never eaten in", points: 25, difficulty: 'easy' },
  { id: 'treat-m-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Find a seasonal or limited-time menu item', points: 50, difficulty: 'medium' },
  { id: 'treat-m-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try an off-menu order or cast member recommendation', points: 50, difficulty: 'medium' },
  { id: 'treat-m-3', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Get treats from 3 different lands in one day', points: 50, difficulty: 'medium' },

  // ── Pins 📌 (pin) ── 5 tasks ──
  { id: 'pins-e-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Admire a cast member lanyard, pick your favorite pin', points: 25, difficulty: 'easy' },
  { id: 'pins-e-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Trade 1 pin with a cast member', points: 25, difficulty: 'easy' },
  { id: 'pins-e-3', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find a pin of your favorite movie character', points: 25, difficulty: 'easy' },
  { id: 'pins-m-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Trade 2 pins in one visit', points: 50, difficulty: 'medium' },
  { id: 'pins-m-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Spot 3 pins of the same character on different lanyards', points: 50, difficulty: 'medium' },

  // ── Meet 🎭 (character) ── 6 tasks ──
  { id: 'meet-e-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Spot a character walking through the park', points: 25, difficulty: 'easy' },
  { id: 'meet-e-2', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Meet a character and get a photo', points: 25, difficulty: 'easy' },
  { id: 'meet-e-3', size: 'big', category: 'character', displayCategory: 'Meet', description: "Meet a character you've never met before", points: 25, difficulty: 'easy' },
  { id: 'meet-m-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Have a conversation with a face character, 3+ exchanges', points: 50, difficulty: 'medium' },
  { id: 'meet-m-2', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Spot 3 different characters in one land', points: 50, difficulty: 'medium' },
  { id: 'meet-m-3', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Get a character autograph', points: 50, difficulty: 'medium' },

  // ── Explore 🗺️ (exploration) ── 8 tasks ──
  { id: 'explore-e-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: "Find a hidden restroom most don't know about", points: 25, difficulty: 'easy' },
  { id: 'explore-e-2', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Walk a land without looking at your phone', points: 25, difficulty: 'easy' },
  { id: 'explore-e-3', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Read every plaque or sign in a queue', points: 25, difficulty: 'easy' },
  { id: 'explore-e-4', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Find a quiet spot most people walk past', points: 25, difficulty: 'easy' },
  { id: 'explore-e-5', size: 'big', category: 'exploration', displayCategory: 'Explore', description: "Discover a shop you've never been in", points: 25, difficulty: 'easy' },
  { id: 'explore-m-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Explore a new land and find 3 hidden details', points: 50, difficulty: 'medium' },
  { id: 'explore-m-2', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Walk the full park perimeter', points: 50, difficulty: 'medium' },
  { id: 'explore-m-3', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Find 3 water features or fountains', points: 50, difficulty: 'medium' },

  // ── Seek 🎯 (scavenger) ── 9 tasks ──
  { id: 'seek-e-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a non-Mickey character plush in a gift shop', points: 25, difficulty: 'easy' },
  { id: 'seek-e-2', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find an item over $100 in a gift shop', points: 25, difficulty: 'easy' },
  { id: 'seek-e-3', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a Hidden Mickey outside of a ride', points: 25, difficulty: 'easy' },
  { id: 'seek-e-4', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Spot a cast member with a unique name tag placement', points: 25, difficulty: 'easy' },
  { id: 'seek-e-5', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Spot 3 types of Disney transportation', points: 25, difficulty: 'easy' },
  { id: 'seek-m-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find 5 character items in one shop', points: 50, difficulty: 'medium' },
  { id: 'seek-m-2', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find items in 3 shops sharing the same theme', points: 50, difficulty: 'medium' },
  { id: 'seek-m-3', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find merchandise featuring a retired attraction', points: 50, difficulty: 'medium' },
  { id: 'seek-m-4', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: "Find a menu item you've never seen at any park", points: 50, difficulty: 'medium' },
];

// ─── Ride Task Generator ────────────────────────────────────────────────────

export function generateRideTasks(rides: Ride[], disabledRideIds: string[] = []): Task[] {
  return rides
    .filter(r => !disabledRideIds.includes(r.id))
    .map(r => ({
      id: `ride-${r.id}`,
      size: 'big' as const,
      category: 'ride' as const,
      displayCategory: 'Ride',
      description: `Ride ${r.name}`,
      points: r.points,
      difficulty: r.intensity === 'gentle' ? 'easy' as const : r.intensity === 'moderate' ? 'medium' as const : 'hard' as const,
      rideId: r.id,
      parkId: r.parkId,
      heightRequirement: r.heightRequirement,
    }));
}
