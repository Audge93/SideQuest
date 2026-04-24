import { Task, Ride } from '../types';

/**
 * Static scavenger-hunt content library.
 *
 * `SMALL_TASKS` feeds the player's hand carousel.
 * `BIG_TASKS` feeds the top challenge board.
 * `generateRideTasks()` converts ride metadata into challenge tasks so ride
 * challenges stay synchronized with the central ride catalog.
 */

// ─── Small Tasks ───────────────────────────────────────────────────────────
// tag: 'disney' = Disney parks only
// tag: 'universal' = Universal parks only
// tag: undefined = works at any park

export const SMALL_TASKS: Task[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ── Find 🔍 (observation) ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'find-e-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a family wearing matching outfits', points: 5, difficulty: 'easy' },
  { id: 'find-e-3', size: 'small', category: 'find', displayCategory: 'Find', description: 'Count trash cans visible from your spot', points: 5, difficulty: 'easy' },
  { id: 'find-e-4', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a stroller with a balloon', points: 5, difficulty: 'easy' },
  { id: 'find-e-7', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a water fountain', points: 5, difficulty: 'easy' },
  { id: 'find-e-9', size: 'small', category: 'find', displayCategory: 'Find', description: 'Notice a hidden security camera in theming', points: 5, difficulty: 'easy' },
  { id: 'find-m-2', size: 'small', category: 'find', displayCategory: 'Find', description: "Spot an animatronic you've never noticed", points: 10, difficulty: 'medium' },
  { id: 'find-m-3', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find queue theming that tells a story', points: 10, difficulty: 'medium' },
  { id: 'find-m-4', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot 3 different character-themed hats', points: 10, difficulty: 'medium' },
  { id: 'find-m-5', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a themed plant or tree', points: 10, difficulty: 'medium' },
  { id: 'find-m-6', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a costume detail unique to your land', points: 10, difficulty: 'medium' },
  { id: 'find-m-7', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a water feature with a hidden detail', points: 10, difficulty: 'medium' },
  { id: 'find-m-8', size: 'small', category: 'find', displayCategory: 'Find', description: 'Notice a transition detail between lands', points: 10, difficulty: 'medium' },
  { id: 'find-m-9', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot theming above your eyeline most miss', points: 10, difficulty: 'medium' },
  { id: 'find-m-10', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a reference to another attraction in your queue', points: 10, difficulty: 'medium' },
  { id: 'find-h-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a vintage park t-shirt', points: 15, difficulty: 'hard' },
  { id: 'find-h-2', size: 'small', category: 'find', displayCategory: 'Find', description: 'Identify the background music in your area', points: 15, difficulty: 'hard' },
  { id: 'find-h-3', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find 3 hidden details in one queue without moving', points: 15, difficulty: 'hard' },
  { id: 'find-h-4', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot forced perspective architecture', points: 15, difficulty: 'hard' },
  { id: 'find-h-5', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a hidden date or year', points: 15, difficulty: 'hard' },
  { id: 'find-h-6', size: 'small', category: 'find', displayCategory: 'Find', description: "Identify an attraction's scent theming", points: 15, difficulty: 'hard' },
  { id: 'find-h-9', size: 'small', category: 'find', displayCategory: 'Find', description: 'Notice pavement texture signaling a land transition', points: 15, difficulty: 'hard' },
  { id: 'find-h-10', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a prop referencing a real historical event', points: 15, difficulty: 'hard' },

  // ── Disney-only Find ──
  { id: 'find-e-2', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find someone wearing Mickey ears', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-5', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a cast member name tag from another state/country', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-6', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot someone carrying a turkey leg', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-8', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a dog in a pet-friendly area', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-10', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find someone wearing a birthday button', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-m-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a Hidden Mickey in your surroundings', points: 10, difficulty: 'medium', tag: 'disney' },
  { id: 'find-h-7', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a tribute to Walt Disney', points: 15, difficulty: 'hard', tag: 'disney' },
  { id: 'find-h-8', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a Main Street window dedication', points: 15, difficulty: 'hard', tag: 'disney' },

  // ── Universal-only Find ──
  { id: 'find-u-e-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find someone wearing a Hogwarts robe', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-2', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a team member with a unique name tag', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-3', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find someone carrying a Butterbeer', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-4', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot someone with a wand from Ollivanders', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-5', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find someone wearing a Universal birthday button', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-m-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a hidden movie reference in your surroundings', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'find-u-m-2', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot an interactive wand spot in the Wizarding World', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'find-u-h-1', size: 'small', category: 'find', displayCategory: 'Find', description: 'Find a tribute plaque to a Universal film', points: 15, difficulty: 'hard', tag: 'universal' },
  { id: 'find-u-h-2', size: 'small', category: 'find', displayCategory: 'Find', description: 'Spot a hidden detail referencing a retired attraction', points: 15, difficulty: 'hard', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Photo 📸 ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'photo-e-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Heroic pose in front of nearest landmark', points: 5, difficulty: 'easy' },
  { id: 'photo-e-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group photo same facial expression', points: 5, difficulty: 'easy' },
  { id: 'photo-e-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo of most colorful thing visible', points: 5, difficulty: 'easy' },
  { id: 'photo-e-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Selfie with a themed trash can', points: 5, difficulty: 'easy' },
  { id: 'photo-e-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group pointing opposite directions', points: 5, difficulty: 'easy' },
  { id: 'photo-e-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Shoes in front of iconic spot', points: 5, difficulty: 'easy' },
  { id: 'photo-m-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Recreate classic tourist photo with twist', points: 10, difficulty: 'medium' },
  { id: 'photo-m-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo story using only park props', points: 10, difficulty: 'medium' },
  { id: 'photo-m-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Lowest angle photo possible', points: 10, difficulty: 'medium' },
  { id: 'photo-m-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Group mid-jump photo', points: 10, difficulty: 'medium' },
  { id: 'photo-m-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Park detail that looks like a face', points: 10, difficulty: 'medium' },
  { id: 'photo-m-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Dramatic movie-poster photo', points: 10, difficulty: 'medium' },
  { id: 'photo-m-7', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Everyone different character pose', points: 10, difficulty: 'medium' },
  { id: 'photo-h-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Recreate famous movie scene', points: 15, difficulty: 'hard' },
  { id: 'photo-h-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo that could be a postcard', points: 15, difficulty: 'hard' },
  { id: 'photo-h-3', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Forced perspective with architecture', points: 15, difficulty: 'hard' },
  { id: 'photo-h-4', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Timed photo with moving ride behind', points: 15, difficulty: 'hard' },
  { id: 'photo-h-5', size: 'small', category: 'photo', displayCategory: 'Photo', description: '3 photos: beginning-middle-end story', points: 15, difficulty: 'hard' },
  { id: 'photo-h-6', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Dramatic farewell photo', points: 15, difficulty: 'hard' },

  // ── Disney-only Photo ──
  { id: 'photo-e-7', size: 'small', category: 'photo', displayCategory: 'Photo', description: "Photo like you're holding the castle", points: 5, difficulty: 'easy', tag: 'disney' },

  // ── Universal-only Photo ──
  { id: 'photo-u-e-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo like you\'re casting a spell with a wand', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'photo-u-m-1', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Photo posing with the Universal globe', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'photo-u-m-2', size: 'small', category: 'photo', displayCategory: 'Photo', description: 'Take a photo that looks like a movie poster from a Universal film', points: 10, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Act 🎬 (action) ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'act-e-1', size: 'small', category: 'act', displayCategory: 'Act', description: 'Wave at riders on a nearby ride', points: 5, difficulty: 'easy' },
  { id: 'act-e-2', size: 'small', category: 'act', displayCategory: 'Act', description: 'Dramatic high-five with group member', points: 5, difficulty: 'easy' },
  { id: 'act-e-3', size: 'small', category: 'act', displayCategory: 'Act', description: 'Superhero pose, hold 5 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-5', size: 'small', category: 'act', displayCategory: 'Act', description: 'Pretend to be a statue for 15 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-7', size: 'small', category: 'act', displayCategory: 'Act', description: 'Dramatic bow after finishing a ride', points: 5, difficulty: 'easy' },
  { id: 'act-m-1', size: 'small', category: 'act', displayCategory: 'Act', description: 'Villain laugh loud enough for nearby people', points: 10, difficulty: 'medium' },
  { id: 'act-m-2', size: 'small', category: 'act', displayCategory: 'Act', description: 'Walk like a pirate 30 seconds', points: 10, difficulty: 'medium' },
  { id: 'act-m-3', size: 'small', category: 'act', displayCategory: 'Act', description: 'Narrate line like nature documentary', points: 10, difficulty: 'medium' },
  { id: 'act-m-4', size: 'small', category: 'act', displayCategory: 'Act', description: 'British accent for one full minute', points: 10, difficulty: 'medium' },
  { id: 'act-m-5', size: 'small', category: 'act', displayCategory: 'Act', description: 'Act out movie scene silently, group guesses', points: 10, difficulty: 'medium' },
  { id: 'act-m-6', size: 'small', category: 'act', displayCategory: 'Act', description: 'Fake tour guide history of your ride', points: 10, difficulty: 'medium' },
  { id: 'act-m-7', size: 'small', category: 'act', displayCategory: 'Act', description: 'Dramatic slow-motion walk 20 seconds', points: 10, difficulty: 'medium' },
  { id: 'act-h-1', size: 'small', category: 'act', displayCategory: 'Act', description: 'Sing any song at least 15 seconds', points: 15, difficulty: 'hard' },
  { id: 'act-h-2', size: 'small', category: 'act', displayCategory: 'Act', description: '30-second interpretive dance of your day', points: 15, difficulty: 'hard' },
  { id: 'act-h-3', size: 'small', category: 'act', displayCategory: 'Act', description: 'Acceptance speech for imaginary award', points: 15, difficulty: 'hard' },
  { id: 'act-h-4', size: 'small', category: 'act', displayCategory: 'Act', description: 'Act out ride with body/sound effects', points: 15, difficulty: 'hard' },
  { id: 'act-h-5', size: 'small', category: 'act', displayCategory: 'Act', description: 'Play-by-play of group eating snack like cooking competition', points: 15, difficulty: 'hard' },
  { id: 'act-h-6', size: 'small', category: 'act', displayCategory: 'Act', description: 'Convince group member to do synchronized dance move', points: 15, difficulty: 'hard' },

  // ── Disney-only Act ──
  { id: 'act-e-4', size: 'small', category: 'act', displayCategory: 'Act', description: 'Royal wave for 10 seconds', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'act-e-6', size: 'small', category: 'act', displayCategory: 'Act', description: 'March like a toy soldier 15 seconds', points: 5, difficulty: 'easy', tag: 'disney' },

  // ── Universal-only Act ──
  { id: 'act-u-e-1', size: 'small', category: 'act', displayCategory: 'Act', description: 'Practice your best wizard spell-casting gesture', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'act-u-e-2', size: 'small', category: 'act', displayCategory: 'Act', description: 'Hulk smash pose, hold 5 seconds', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'act-u-m-1', size: 'small', category: 'act', displayCategory: 'Act', description: 'Say "I\'m gonna wreck it!" in your best villain voice', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'act-u-m-2', size: 'small', category: 'act', displayCategory: 'Act', description: 'Walk like a Minion for 30 seconds', points: 10, difficulty: 'medium', tag: 'universal' },
];

// ─── Big Tasks ──────────────────────────────────────────────────────────────

export const BIG_TASKS: Task[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ── Treat 🍦 (food) ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'treat-e-2', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Share a themed dessert with your group', points: 25, difficulty: 'easy' },
  { id: 'treat-e-3', size: 'big', category: 'treat', displayCategory: 'Treat', description: "Try a food cart you've never visited", points: 25, difficulty: 'easy' },
  { id: 'treat-e-4', size: 'big', category: 'treat', displayCategory: 'Treat', description: "Get a snack from a land you've never eaten in", points: 25, difficulty: 'easy' },
  { id: 'treat-m-1', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Find a seasonal or limited-time menu item', points: 50, difficulty: 'medium' },
  { id: 'treat-m-3', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Get treats from 3 different lands in one day', points: 50, difficulty: 'medium' },

  // ── Disney-only Treat ──
  { id: 'treat-e-1', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Try a classic Disney treat like a churro or turkey leg', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'treat-m-2', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Try an off-menu order or cast member recommendation', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Treat ──
  { id: 'treat-u-e-1', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Try a frozen or warm Butterbeer', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'treat-u-e-2', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Get a snack from a themed IP restaurant', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'treat-u-m-1', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Try a team member recommendation at any restaurant', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'treat-u-m-2', size: 'big', category: 'treat', displayCategory: 'Treat', description: 'Try a themed dessert from the Wizarding World', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Pins 📌 (pin) — Disney only ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'pins-e-1', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Admire a cast member lanyard, pick your favorite pin', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-e-2', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Trade 1 pin with a cast member', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-e-3', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Find a pin of your favorite movie character', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-m-1', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Trade 2 pins in one visit', points: 50, difficulty: 'medium', tag: 'disney' },
  { id: 'pins-m-2', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Spot 3 pins of the same character on different lanyards', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal Collectibles (replaces pins for Universal) ──
  { id: 'collect-u-e-1', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Find a wand at Ollivanders that chose you', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-e-2', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Find your favorite themed souvenir in a gift shop', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-e-3', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Find a collectible from your favorite Universal franchise', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-m-1', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Find themed merchandise in 3 different lands', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'collect-u-m-2', size: 'big', category: 'pins', displayCategory: 'Pins', description: 'Spot a rare or limited-edition collectible item', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Meet 🎭 (character) ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'meet-e-1', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Spot a character walking through the park', points: 25, difficulty: 'easy' },
  { id: 'meet-e-2', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Meet a character and get a photo', points: 25, difficulty: 'easy' },
  { id: 'meet-e-3', size: 'big', category: 'meet', displayCategory: 'Meet', description: "Meet a character you've never met before", points: 25, difficulty: 'easy' },
  { id: 'meet-m-2', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Spot 3 different characters in one land', points: 50, difficulty: 'medium' },

  // ── Disney-only Meet ──
  { id: 'meet-m-1', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Have a conversation with a face character, 3+ exchanges', points: 50, difficulty: 'medium', tag: 'disney' },
  { id: 'meet-m-3', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Get a character autograph', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Meet ──
  { id: 'meet-u-e-1', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Meet a Marvel superhero', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'meet-u-m-1', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Have a conversation with a Wizarding World character', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'meet-u-m-2', size: 'big', category: 'meet', displayCategory: 'Meet', description: 'Get a photo with characters from 2 different franchises', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Explore 🗺️ (exploration) ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'explore-e-1', size: 'big', category: 'explore', displayCategory: 'Explore', description: "Find a hidden restroom most don't know about", points: 25, difficulty: 'easy' },
  { id: 'explore-e-2', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Walk a land without looking at your phone', points: 25, difficulty: 'easy' },
  { id: 'explore-e-3', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Read every plaque or sign in a queue', points: 25, difficulty: 'easy' },
  { id: 'explore-e-4', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Find a quiet spot most people walk past', points: 25, difficulty: 'easy' },
  { id: 'explore-e-5', size: 'big', category: 'explore', displayCategory: 'Explore', description: "Discover a shop you've never been in", points: 25, difficulty: 'easy' },
  { id: 'explore-m-1', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Explore a new land and find 3 hidden details', points: 50, difficulty: 'medium' },
  { id: 'explore-m-2', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Walk the full park perimeter', points: 50, difficulty: 'medium' },
  { id: 'explore-m-3', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Find 3 water features or fountains', points: 50, difficulty: 'medium' },

  // ── Universal-only Explore ──
  { id: 'explore-u-e-1', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Find all interactive wand windows in Diagon Alley or Hogsmeade', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'explore-u-m-1', size: 'big', category: 'explore', displayCategory: 'Explore', description: 'Ride the Hogwarts Express in both directions', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Seek 🎯 (scavenger) ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'seek-e-4', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Spot a staff member with a unique name tag placement', points: 25, difficulty: 'easy' },
  { id: 'seek-m-1', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find 5 character items in one shop', points: 50, difficulty: 'medium' },
  { id: 'seek-m-2', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find items in 3 shops sharing the same theme', points: 50, difficulty: 'medium' },
  { id: 'seek-m-4', size: 'big', category: 'seek', displayCategory: 'Seek', description: "Find a menu item you've never seen at any park", points: 50, difficulty: 'medium' },

  // ── Disney-only Seek ──
  { id: 'seek-e-1', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find a non-Mickey character plush in a gift shop', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-2', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find an item over $100 in a gift shop', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-3', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find a Hidden Mickey outside of a ride', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-5', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Spot 3 types of Disney transportation', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-m-3', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find merchandise featuring a retired attraction', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Seek ──
  { id: 'seek-u-e-1', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find a character plush from a Universal franchise', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-2', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find an item over $100 in a Universal gift shop', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-3', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find a hidden movie prop in a themed queue', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-4', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Spot a Daily Prophet headline in the Wizarding World', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-m-1', size: 'big', category: 'seek', displayCategory: 'Seek', description: 'Find themed candy from 3 different franchise shops', points: 50, difficulty: 'medium', tag: 'universal' },
];

// ─── Ride Activity Tasks ────────────────────────────────────────────────────
// Tasks tied to specific rides that require meeting that ride's height
// requirement. Unlike generated ride tasks ("Ride X"), these set specific
// in-ride objectives. Filtered at runtime by park selection and height filter.

export const RIDE_ACTIVITY_TASKS: Task[] = [

  // ── Magic Kingdom ──────────────────────────────────────────────────────────
  { id: 'rideact-buzz-mk-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Score higher than 100,000 on Buzz Lightyear's Space Ranger Spin", points: 75, difficulty: 'hard', rideId: 'wdw-mk-buzz-lightyears-space-ranger-spin', parkId: 'wdw-mk', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-buzz-mk-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Target only Z targets on Buzz Lightyear's Space Ranger Spin", points: 50, difficulty: 'medium', rideId: 'wdw-mk-buzz-lightyears-space-ranger-spin', parkId: 'wdw-mk', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-pirates-mk-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Count every time you hear 'Yo ho, yo ho' on Pirates of the Caribbean", points: 50, difficulty: 'medium', rideId: 'wdw-mk-pirates-of-the-caribbean', parkId: 'wdw-mk', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-spacemtn-mk-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Keep your hands up for the entire Space Mountain ride', points: 50, difficulty: 'medium', rideId: 'wdw-mk-space-mountain', parkId: 'wdw-mk', heightRequirement: 44, tag: 'disney' },
  { id: 'rideact-bigthunder-mk-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Spot the hidden skull on Big Thunder Mountain Railroad', points: 50, difficulty: 'medium', rideId: 'wdw-mk-big-thunder-mountain-railroad', parkId: 'wdw-mk', heightRequirement: 40, tag: 'disney' },
  { id: 'rideact-speedway-mk-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Complete Tomorrowland Speedway without touching the guide rail', points: 75, difficulty: 'hard', rideId: 'wdw-mk-tomorrowland-speedway', parkId: 'wdw-mk', heightRequirement: 32, tag: 'disney' },

  // ── Hollywood Studios ──────────────────────────────────────────────────────
  { id: 'rideact-tsm-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Score higher than 100,000 points on Toy Story Mania!', points: 75, difficulty: 'hard', rideId: 'wdw-hs-toy-story-mania', parkId: 'wdw-hs', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-tsm-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Beat everyone in your group's score on Toy Story Mania!", points: 50, difficulty: 'medium', rideId: 'wdw-hs-toy-story-mania', parkId: 'wdw-hs', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-tot-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Keep your hands raised for the entire Tower of Terror drop sequence', points: 50, difficulty: 'medium', rideId: 'wdw-hs-tower-of-terror', parkId: 'wdw-hs', heightRequirement: 40, tag: 'disney' },
  { id: 'rideact-tot-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count the exact number of elevator drops on Tower of Terror', points: 75, difficulty: 'hard', rideId: 'wdw-hs-tower-of-terror', parkId: 'wdw-hs', heightRequirement: 40, tag: 'disney' },
  { id: 'rideact-falcon-hs-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Claim the pilot seat on Millennium Falcon: Smugglers Run', points: 50, difficulty: 'medium', rideId: 'wdw-hs-millennium-falcon-smugglers-run', parkId: 'wdw-hs', heightRequirement: 38, tag: 'disney' },
  { id: 'rideact-falcon-hs-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Complete Millennium Falcon: Smugglers Run with no failed shots', points: 75, difficulty: 'hard', rideId: 'wdw-hs-millennium-falcon-smugglers-run', parkId: 'wdw-hs', heightRequirement: 38, tag: 'disney' },
  { id: 'rideact-rotr-hs-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count every stormtrooper you encounter on Rise of the Resistance', points: 50, difficulty: 'medium', rideId: 'wdw-hs-star-wars-rise-of-the-resistance', parkId: 'wdw-hs', heightRequirement: 40, tag: 'disney' },

  // ── EPCOT ──────────────────────────────────────────────────────────────────
  { id: 'rideact-testtrack-ep-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Design a car on Test Track that scores 100% in all categories', points: 75, difficulty: 'hard', rideId: 'wdw-ep-test-track', parkId: 'wdw-ep', heightRequirement: 40, tag: 'disney' },
  { id: 'rideact-soarin-ep-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Spot 5 different landmarks on Soarin' Around the World", points: 50, difficulty: 'medium', rideId: 'wdw-ep-soarin-around-the-world', parkId: 'wdw-ep', heightRequirement: 40, tag: 'disney' },
  { id: 'rideact-sse-ep-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count the number of scenes on Spaceship Earth', points: 75, difficulty: 'hard', rideId: 'wdw-ep-spaceship-earth', parkId: 'wdw-ep', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-mspace-ep-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Complete Mission: SPACE orange mission with zero team errors', points: 75, difficulty: 'hard', rideId: 'wdw-ep-mission-space', parkId: 'wdw-ep', heightRequirement: 40, tag: 'disney' },

  // ── Animal Kingdom ─────────────────────────────────────────────────────────
  { id: 'rideact-safari-ak-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Spot 10 different animals on Kilimanjaro Safaris', points: 50, difficulty: 'medium', rideId: 'wdw-ak-kilimanjaro-safaris', parkId: 'wdw-ak', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-everest-ak-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Keep your hands up through the backwards section of Expedition Everest', points: 50, difficulty: 'medium', rideId: 'wdw-ak-expedition-everest', parkId: 'wdw-ak', heightRequirement: 44, tag: 'disney' },
  { id: 'rideact-kali-ak-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Correctly predict which seat gets the most wet on Kali River Rapids', points: 25, difficulty: 'easy', rideId: 'wdw-ak-kali-river-rapids', parkId: 'wdw-ak', heightRequirement: 38, tag: 'disney' },

  // ── Disneyland ─────────────────────────────────────────────────────────────
  { id: 'rideact-indy-dl-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count every skull you spot in the Indiana Jones Adventure queue', points: 50, difficulty: 'medium', rideId: 'dl-dl-indiana-jones-adventure', parkId: 'dl-dl', heightRequirement: 46, tag: 'disney' },
  { id: 'rideact-buzz-dl-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Score higher than 100,000 on Buzz Lightyear Astro Blasters', points: 75, difficulty: 'hard', rideId: 'dl-dl-buzz-lightyear-astro-blasters', parkId: 'dl-dl', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-pirates-dl-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count every time you spot Captain Jack Sparrow on Pirates of the Caribbean', points: 50, difficulty: 'medium', rideId: 'dl-dl-pirates-of-the-caribbean', parkId: 'dl-dl', heightRequirement: 0, tag: 'disney' },

  // ── Disney California Adventure ────────────────────────────────────────────
  { id: 'rideact-webslinger-dca-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Score higher than 80,000 on WEB SLINGERS: A Spider-Man Adventure', points: 75, difficulty: 'hard', rideId: 'dl-dca-web-slingers-a-spider-man-adventure', parkId: 'dl-dca', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-tsm-dca-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Score higher than 100,000 on Toy Story Midway Mania!', points: 75, difficulty: 'hard', rideId: 'dl-dca-toy-story-midway-mania', parkId: 'dl-dca', heightRequirement: 0, tag: 'disney' },
  { id: 'rideact-rsr-dca-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Win your race car heat on Radiator Springs Racers', points: 50, difficulty: 'medium', rideId: 'dl-dca-radiator-springs-racers', parkId: 'dl-dca', heightRequirement: 40, tag: 'disney' },

  // ── Universal Studios Florida ──────────────────────────────────────────────
  { id: 'rideact-mib-usf-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Score higher than 100,000 on MEN IN BLACK: Alien Attack', points: 75, difficulty: 'hard', rideId: 'uor-us-men-in-black-alien-attack', parkId: 'uor-us', heightRequirement: 42, tag: 'universal' },
  { id: 'rideact-mib-usf-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Hit the spinning target on MEN IN BLACK: Alien Attack', points: 50, difficulty: 'medium', rideId: 'uor-us-men-in-black-alien-attack', parkId: 'uor-us', heightRequirement: 42, tag: 'universal' },

  // ── Islands of Adventure ───────────────────────────────────────────────────
  { id: 'rideact-spidey-ioa-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: 'Count every villain on The Amazing Adventures of Spider-Man', points: 50, difficulty: 'medium', rideId: 'uor-ioa-amazing-adventures-of-spider-man', parkId: 'uor-ioa', heightRequirement: 40, tag: 'universal' },

  // ── Epic Universe ──────────────────────────────────────────────────────────
  { id: 'rideact-mariokart-eu-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Score higher than 5,000 points on Mario Kart: Bowser's Challenge", points: 50, difficulty: 'medium', rideId: 'uor-eu-mario-kart-bowsers-challenge', parkId: 'uor-eu', heightRequirement: 40, tag: 'universal' },
  { id: 'rideact-mariokart-eu-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Beat Bowser's score on Mario Kart: Bowser's Challenge", points: 75, difficulty: 'hard', rideId: 'uor-eu-mario-kart-bowsers-challenge', parkId: 'uor-eu', heightRequirement: 40, tag: 'universal' },

  // ── Universal Studios Hollywood ────────────────────────────────────────────
  { id: 'rideact-mariokart-ush-1', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Score higher than 5,000 points on Mario Kart: Bowser's Challenge", points: 50, difficulty: 'medium', rideId: 'ush-us-mario-kart-bowsers-challenge', parkId: 'ush-us', heightRequirement: 40, tag: 'universal' },
  { id: 'rideact-mariokart-ush-2', size: 'big', category: 'ride', displayCategory: 'Ride', description: "Beat Bowser's score on Mario Kart: Bowser's Challenge", points: 75, difficulty: 'hard', rideId: 'ush-us-mario-kart-bowsers-challenge', parkId: 'ush-us', heightRequirement: 40, tag: 'universal' },
];

// ─── Ride Task Generator ────────────────────────────────────────────────────

// Generates standardized ride challenge tasks while respecting any ride-level
// disables chosen by the player in Settings.
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
