import { Task, Ride } from '../types';

// ─── Small Tasks ───────────────────────────────────────────────────────────
// tag: 'disney' = Disney parks only
// tag: 'universal' = Universal parks only
// tag: undefined = works at any park

export const SMALL_TASKS: Task[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ── Find 🔍 (observation) ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'find-e-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a family wearing matching outfits', points: 5, difficulty: 'easy' },
  { id: 'find-e-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Count trash cans visible from your spot', points: 5, difficulty: 'easy' },
  { id: 'find-e-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a stroller with a balloon', points: 5, difficulty: 'easy' },
  { id: 'find-e-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a water fountain', points: 5, difficulty: 'easy' },
  { id: 'find-e-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice a hidden security camera in theming', points: 5, difficulty: 'easy' },
  { id: 'find-m-2', size: 'small', category: 'observation', displayCategory: 'Find', description: "Spot an animatronic you've never noticed", points: 10, difficulty: 'medium' },
  { id: 'find-m-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find queue theming that tells a story', points: 10, difficulty: 'medium' },
  { id: 'find-m-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot 3 different character-themed hats', points: 10, difficulty: 'medium' },
  { id: 'find-m-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a themed plant or tree', points: 10, difficulty: 'medium' },
  { id: 'find-m-6', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a costume detail unique to your land', points: 10, difficulty: 'medium' },
  { id: 'find-m-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a water feature with a hidden detail', points: 10, difficulty: 'medium' },
  { id: 'find-m-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice a transition detail between lands', points: 10, difficulty: 'medium' },
  { id: 'find-m-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot theming above your eyeline most miss', points: 10, difficulty: 'medium' },
  { id: 'find-m-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a reference to another attraction in your queue', points: 10, difficulty: 'medium' },
  { id: 'find-h-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a vintage park t-shirt', points: 15, difficulty: 'hard' },
  { id: 'find-h-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Identify the background music in your area', points: 15, difficulty: 'hard' },
  { id: 'find-h-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find 3 hidden details in one queue without moving', points: 15, difficulty: 'hard' },
  { id: 'find-h-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot forced perspective architecture', points: 15, difficulty: 'hard' },
  { id: 'find-h-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a hidden date or year', points: 15, difficulty: 'hard' },
  { id: 'find-h-6', size: 'small', category: 'observation', displayCategory: 'Find', description: "Identify an attraction's scent theming", points: 15, difficulty: 'hard' },
  { id: 'find-h-9', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Notice pavement texture signaling a land transition', points: 15, difficulty: 'hard' },
  { id: 'find-h-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a prop referencing a real historical event', points: 15, difficulty: 'hard' },

  // ── Disney-only Find ──
  { id: 'find-e-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing Mickey ears', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a cast member name tag from another state/country', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-6', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot someone carrying a turkey leg', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a dog in a pet-friendly area', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-e-10', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing a birthday button', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'find-m-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a Hidden Mickey in your surroundings', points: 10, difficulty: 'medium', tag: 'disney' },
  { id: 'find-h-7', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a tribute to Walt Disney', points: 15, difficulty: 'hard', tag: 'disney' },
  { id: 'find-h-8', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a Main Street window dedication', points: 15, difficulty: 'hard', tag: 'disney' },

  // ── Universal-only Find ──
  { id: 'find-u-e-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing a Hogwarts robe', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a team member with a unique name tag', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-3', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone carrying a Butterbeer', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-4', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot someone with a wand from Ollivanders', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-e-5', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find someone wearing a Universal birthday button', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'find-u-m-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a hidden movie reference in your surroundings', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'find-u-m-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot an interactive wand spot in the Wizarding World', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'find-u-h-1', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Find a tribute plaque to a Universal film', points: 15, difficulty: 'hard', tag: 'universal' },
  { id: 'find-u-h-2', size: 'small', category: 'observation', displayCategory: 'Find', description: 'Spot a hidden detail referencing a retired attraction', points: 15, difficulty: 'hard', tag: 'universal' },

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
  { id: 'act-e-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Wave at riders on a nearby ride', points: 5, difficulty: 'easy' },
  { id: 'act-e-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic high-five with group member', points: 5, difficulty: 'easy' },
  { id: 'act-e-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Superhero pose, hold 5 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Pretend to be a statue for 15 seconds', points: 5, difficulty: 'easy' },
  { id: 'act-e-7', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic bow after finishing a ride', points: 5, difficulty: 'easy' },
  { id: 'act-m-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Villain laugh loud enough for nearby people', points: 10, difficulty: 'medium' },
  { id: 'act-m-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Walk like a pirate 30 seconds', points: 10, difficulty: 'medium' },
  { id: 'act-m-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Narrate line like nature documentary', points: 10, difficulty: 'medium' },
  { id: 'act-m-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'British accent for one full minute', points: 10, difficulty: 'medium' },
  { id: 'act-m-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Act out movie scene silently, group guesses', points: 10, difficulty: 'medium' },
  { id: 'act-m-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'Fake tour guide history of your ride', points: 10, difficulty: 'medium' },
  { id: 'act-m-7', size: 'small', category: 'action', displayCategory: 'Act', description: 'Dramatic slow-motion walk 20 seconds', points: 10, difficulty: 'medium' },
  { id: 'act-h-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Sing any song at least 15 seconds', points: 15, difficulty: 'hard' },
  { id: 'act-h-2', size: 'small', category: 'action', displayCategory: 'Act', description: '30-second interpretive dance of your day', points: 15, difficulty: 'hard' },
  { id: 'act-h-3', size: 'small', category: 'action', displayCategory: 'Act', description: 'Acceptance speech for imaginary award', points: 15, difficulty: 'hard' },
  { id: 'act-h-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'Act out ride with body/sound effects', points: 15, difficulty: 'hard' },
  { id: 'act-h-5', size: 'small', category: 'action', displayCategory: 'Act', description: 'Play-by-play of group eating snack like cooking competition', points: 15, difficulty: 'hard' },
  { id: 'act-h-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'Convince group member to do synchronized dance move', points: 15, difficulty: 'hard' },

  // ── Disney-only Act ──
  { id: 'act-e-4', size: 'small', category: 'action', displayCategory: 'Act', description: 'Royal wave for 10 seconds', points: 5, difficulty: 'easy', tag: 'disney' },
  { id: 'act-e-6', size: 'small', category: 'action', displayCategory: 'Act', description: 'March like a toy soldier 15 seconds', points: 5, difficulty: 'easy', tag: 'disney' },

  // ── Universal-only Act ──
  { id: 'act-u-e-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Practice your best wizard spell-casting gesture', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'act-u-e-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Hulk smash pose, hold 5 seconds', points: 5, difficulty: 'easy', tag: 'universal' },
  { id: 'act-u-m-1', size: 'small', category: 'action', displayCategory: 'Act', description: 'Say "I\'m gonna wreck it!" in your best villain voice', points: 10, difficulty: 'medium', tag: 'universal' },
  { id: 'act-u-m-2', size: 'small', category: 'action', displayCategory: 'Act', description: 'Walk like a Minion for 30 seconds', points: 10, difficulty: 'medium', tag: 'universal' },
];

// ─── Big Tasks ──────────────────────────────────────────────────────────────

export const BIG_TASKS: Task[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ── Treat 🍦 (food) ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'treat-e-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Share a themed dessert with your group', points: 25, difficulty: 'easy' },
  { id: 'treat-e-3', size: 'big', category: 'food', displayCategory: 'Treat', description: "Try a food cart you've never visited", points: 25, difficulty: 'easy' },
  { id: 'treat-e-4', size: 'big', category: 'food', displayCategory: 'Treat', description: "Get a snack from a land you've never eaten in", points: 25, difficulty: 'easy' },
  { id: 'treat-m-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Find a seasonal or limited-time menu item', points: 50, difficulty: 'medium' },
  { id: 'treat-m-3', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Get treats from 3 different lands in one day', points: 50, difficulty: 'medium' },

  // ── Disney-only Treat ──
  { id: 'treat-e-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try a classic Disney treat like a churro or turkey leg', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'treat-m-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try an off-menu order or cast member recommendation', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Treat ──
  { id: 'treat-u-e-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try a frozen or warm Butterbeer', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'treat-u-e-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Get a snack from a themed IP restaurant', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'treat-u-m-1', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try a team member recommendation at any restaurant', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'treat-u-m-2', size: 'big', category: 'food', displayCategory: 'Treat', description: 'Try a themed dessert from the Wizarding World', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Pins 📌 (pin) — Disney only ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'pins-e-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Admire a cast member lanyard, pick your favorite pin', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-e-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Trade 1 pin with a cast member', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-e-3', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find a pin of your favorite movie character', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'pins-m-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Trade 2 pins in one visit', points: 50, difficulty: 'medium', tag: 'disney' },
  { id: 'pins-m-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Spot 3 pins of the same character on different lanyards', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal Collectibles (replaces pins for Universal) ──
  { id: 'collect-u-e-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find a wand at Ollivanders that chose you', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-e-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find your favorite themed souvenir in a gift shop', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-e-3', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find a collectible from your favorite Universal franchise', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'collect-u-m-1', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Find themed merchandise in 3 different lands', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'collect-u-m-2', size: 'big', category: 'pin', displayCategory: 'Pins', description: 'Spot a rare or limited-edition collectible item', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Meet 🎭 (character) ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'meet-e-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Spot a character walking through the park', points: 25, difficulty: 'easy' },
  { id: 'meet-e-2', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Meet a character and get a photo', points: 25, difficulty: 'easy' },
  { id: 'meet-e-3', size: 'big', category: 'character', displayCategory: 'Meet', description: "Meet a character you've never met before", points: 25, difficulty: 'easy' },
  { id: 'meet-m-2', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Spot 3 different characters in one land', points: 50, difficulty: 'medium' },

  // ── Disney-only Meet ──
  { id: 'meet-m-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Have a conversation with a face character, 3+ exchanges', points: 50, difficulty: 'medium', tag: 'disney' },
  { id: 'meet-m-3', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Get a character autograph', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Meet ──
  { id: 'meet-u-e-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Meet a Marvel superhero', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'meet-u-m-1', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Have a conversation with a Wizarding World character', points: 50, difficulty: 'medium', tag: 'universal' },
  { id: 'meet-u-m-2', size: 'big', category: 'character', displayCategory: 'Meet', description: 'Get a photo with characters from 2 different franchises', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Explore 🗺️ (exploration) ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'explore-e-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: "Find a hidden restroom most don't know about", points: 25, difficulty: 'easy' },
  { id: 'explore-e-2', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Walk a land without looking at your phone', points: 25, difficulty: 'easy' },
  { id: 'explore-e-3', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Read every plaque or sign in a queue', points: 25, difficulty: 'easy' },
  { id: 'explore-e-4', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Find a quiet spot most people walk past', points: 25, difficulty: 'easy' },
  { id: 'explore-e-5', size: 'big', category: 'exploration', displayCategory: 'Explore', description: "Discover a shop you've never been in", points: 25, difficulty: 'easy' },
  { id: 'explore-m-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Explore a new land and find 3 hidden details', points: 50, difficulty: 'medium' },
  { id: 'explore-m-2', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Walk the full park perimeter', points: 50, difficulty: 'medium' },
  { id: 'explore-m-3', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Find 3 water features or fountains', points: 50, difficulty: 'medium' },

  // ── Universal-only Explore ──
  { id: 'explore-u-e-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Find all interactive wand windows in Diagon Alley or Hogsmeade', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'explore-u-m-1', size: 'big', category: 'exploration', displayCategory: 'Explore', description: 'Ride the Hogwarts Express in both directions', points: 50, difficulty: 'medium', tag: 'universal' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Seek 🎯 (scavenger) ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Generic (any park) ──
  { id: 'seek-e-4', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Spot a staff member with a unique name tag placement', points: 25, difficulty: 'easy' },
  { id: 'seek-m-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find 5 character items in one shop', points: 50, difficulty: 'medium' },
  { id: 'seek-m-2', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find items in 3 shops sharing the same theme', points: 50, difficulty: 'medium' },
  { id: 'seek-m-4', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: "Find a menu item you've never seen at any park", points: 50, difficulty: 'medium' },

  // ── Disney-only Seek ──
  { id: 'seek-e-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a non-Mickey character plush in a gift shop', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-2', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find an item over $100 in a gift shop', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-3', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a Hidden Mickey outside of a ride', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-e-5', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Spot 3 types of Disney transportation', points: 25, difficulty: 'easy', tag: 'disney' },
  { id: 'seek-m-3', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find merchandise featuring a retired attraction', points: 50, difficulty: 'medium', tag: 'disney' },

  // ── Universal-only Seek ──
  { id: 'seek-u-e-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a character plush from a Universal franchise', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-2', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find an item over $100 in a Universal gift shop', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-3', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find a hidden movie prop in a themed queue', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-e-4', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Spot a Daily Prophet headline in the Wizarding World', points: 25, difficulty: 'easy', tag: 'universal' },
  { id: 'seek-u-m-1', size: 'big', category: 'scavenger', displayCategory: 'Seek', description: 'Find themed candy from 3 different franchise shops', points: 50, difficulty: 'medium', tag: 'universal' },
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
