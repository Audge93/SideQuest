import { Task } from '../types';

// ─── Small Tasks ─────────────────────────────────────────────────────────────

export const SMALL_TASKS: Task[] = [
  // Observation – Easy (5 pts)
  { id: 'obs-e-1', size: 'small', category: 'observation', description: 'Spot a family wearing matching outfits', points: 5, difficulty: 'easy' },
  { id: 'obs-e-2', size: 'small', category: 'observation', description: 'Find someone carrying a souvenir cup', points: 5, difficulty: 'easy' },
  { id: 'obs-e-3', size: 'small', category: 'observation', description: 'Spot a cast member with an unusual name tag hometown', points: 5, difficulty: 'easy' },
  { id: 'obs-e-4', size: 'small', category: 'observation', description: 'Find a guest wearing Mickey ears', points: 5, difficulty: 'easy' },
  { id: 'obs-e-5', size: 'small', category: 'observation', description: 'Spot someone using a park map (paper version)', points: 5, difficulty: 'easy' },
  { id: 'obs-e-6', size: 'small', category: 'observation', description: 'Find a child wearing a character costume', points: 5, difficulty: 'easy' },
  { id: 'obs-e-7', size: 'small', category: 'observation', description: 'Spot a stroller with more than one child', points: 5, difficulty: 'easy' },
  { id: 'obs-e-8', size: 'small', category: 'observation', description: "Count how many people are on their phones right now — remember the number", points: 5, difficulty: 'easy' },

  // Observation – Medium (10 pts)
  { id: 'obs-m-1', size: 'small', category: 'observation', description: 'Find a hidden Mickey somewhere in your surroundings', points: 10, difficulty: 'medium' },
  { id: 'obs-m-2', size: 'small', category: 'observation', description: 'Spot a cast member doing something you\'ve never noticed before', points: 10, difficulty: 'medium' },
  { id: 'obs-m-3', size: 'small', category: 'observation', description: 'Find a piece of theming detail most guests walk right past', points: 10, difficulty: 'medium' },
  { id: 'obs-m-4', size: 'small', category: 'observation', description: 'Spot someone from a different country (look for language, flag pins, etc.)', points: 10, difficulty: 'medium' },
  { id: 'obs-m-5', size: 'small', category: 'observation', description: 'Find an attraction poster or artwork and read every word on it', points: 10, difficulty: 'medium' },
  { id: 'obs-m-6', size: 'small', category: 'observation', description: 'Spot something purple that isn\'t merchandise', points: 10, difficulty: 'medium' },

  // Observation – Hard (15 pts)
  { id: 'obs-h-1', size: 'small', category: 'observation', description: 'Spot someone wearing a vintage (10+ year old) park t-shirt', points: 15, difficulty: 'hard' },
  { id: 'obs-h-2', size: 'small', category: 'observation', description: 'Find three different types of flowers or plants within 50 feet', points: 15, difficulty: 'hard' },
  { id: 'obs-h-3', size: 'small', category: 'observation', description: 'Spot a reference to a different park or land hidden in this area\'s theming', points: 15, difficulty: 'hard' },
  { id: 'obs-h-4', size: 'small', category: 'observation', description: 'Identify the background music playing right now — name the song or movie', points: 15, difficulty: 'hard' },

  // Photo – Easy (5 pts)
  { id: 'photo-e-1', size: 'small', category: 'photo', description: 'Strike a heroic pose in front of the nearest landmark', points: 5, difficulty: 'easy' },
  { id: 'photo-e-2', size: 'small', category: 'photo', description: 'Take a group selfie with everyone making a surprised face', points: 5, difficulty: 'easy' },
  { id: 'photo-e-3', size: 'small', category: 'photo', description: 'Get a photo with someone you don\'t know (with their permission!)', points: 5, difficulty: 'easy' },
  { id: 'photo-e-4', size: 'small', category: 'photo', description: 'Take a photo looking straight up at the sky', points: 5, difficulty: 'easy' },

  // Photo – Medium (10 pts)
  { id: 'photo-m-1', size: 'small', category: 'photo', description: 'Recreate a classic tourist photo pose', points: 10, difficulty: 'medium' },
  { id: 'photo-m-2', size: 'small', category: 'photo', description: 'Get a photo with your group in alphabetical order by first name', points: 10, difficulty: 'medium' },
  { id: 'photo-m-3', size: 'small', category: 'photo', description: 'Capture a photo where something in the background perfectly frames you', points: 10, difficulty: 'medium' },

  // Photo – Hard (15 pts)
  { id: 'photo-h-1', size: 'small', category: 'photo', description: 'Recreate a famous movie scene with your group', points: 15, difficulty: 'hard' },
  { id: 'photo-h-2', size: 'small', category: 'photo', description: 'Get a photo with a cast member (ask nicely, they may be busy)', points: 15, difficulty: 'hard' },
  { id: 'photo-h-3', size: 'small', category: 'photo', description: 'Arrange everyone in your group to spell out a word with your bodies', points: 15, difficulty: 'hard' },

  // Trivia – Easy (5 pts)
  { id: 'tri-e-1', size: 'small', category: 'trivia', description: 'Name 3 Disney animated films from the 1990s', points: 5, difficulty: 'easy' },
  { id: 'tri-e-2', size: 'small', category: 'trivia', description: 'What does "Imagineering" stand for at Disney?', points: 5, difficulty: 'easy' },
  { id: 'tri-e-3', size: 'small', category: 'trivia', description: 'Name the 4 Walt Disney World theme parks', points: 5, difficulty: 'easy' },
  { id: 'tri-e-4', size: 'small', category: 'trivia', description: "What year did Walt Disney World open? (1971 — honor system!)", points: 5, difficulty: 'easy' },

  // Trivia – Medium (10 pts)
  { id: 'tri-m-1', size: 'small', category: 'trivia', description: 'What was the original name of EPCOT Center\'s flagship ride? (Spaceship Earth)', points: 10, difficulty: 'medium' },
  { id: 'tri-m-2', size: 'small', category: 'trivia', description: 'Name 5 countries represented in EPCOT\'s World Showcase', points: 10, difficulty: 'medium' },
  { id: 'tri-m-3', size: 'small', category: 'trivia', description: 'What movie inspired Tomorrowland\'s original design concept?', points: 10, difficulty: 'medium' },
  { id: 'tri-m-4', size: 'small', category: 'trivia', description: 'What does the acronym EPCOT stand for?', points: 10, difficulty: 'medium' },

  // Trivia – Hard (15 pts)
  { id: 'tri-h-1', size: 'small', category: 'trivia', description: 'Name the imagineers who created the Haunted Mansion attraction (at least 2)', points: 15, difficulty: 'hard' },
  { id: 'tri-h-2', size: 'small', category: 'trivia', description: 'What was the working title of the ride now known as Pirates of the Caribbean?', points: 15, difficulty: 'hard' },
  { id: 'tri-h-3', size: 'small', category: 'trivia', description: 'In what year did Disneyland originally open? (1955 — honor system!)', points: 15, difficulty: 'hard' },
];

// ─── Big Tasks ────────────────────────────────────────────────────────────────

export const BIG_TASKS: Task[] = [
  // Food (25 pts)
  { id: 'food-e-1', size: 'big', category: 'food', description: 'Try a classic Dole Whip or park-famous soft-serve', points: 25, difficulty: 'easy' },
  { id: 'food-e-2', size: 'big', category: 'food', description: 'Order a themed treat you\'ve never tried before', points: 25, difficulty: 'easy' },
  { id: 'food-e-3', size: 'big', category: 'food', description: 'Find and try a snack from a food cart', points: 25, difficulty: 'easy' },
  // Food (50 pts)
  { id: 'food-m-1', size: 'big', category: 'food', description: 'Try the current seasonal or limited-time special item at any food location', points: 50, difficulty: 'medium' },
  { id: 'food-m-2', size: 'big', category: 'food', description: 'Order a shareable dessert and split it with your group', points: 50, difficulty: 'medium' },

  // Pin Trading (25 pts)
  { id: 'pin-e-1', size: 'big', category: 'pin', description: 'Find a cast member with a pin lanyard and admire their collection', points: 25, difficulty: 'easy' },
  // Pin Trading (50 pts)
  { id: 'pin-m-1', size: 'big', category: 'pin', description: 'Trade a pin with a cast member', points: 50, difficulty: 'medium' },
  { id: 'pin-m-2', size: 'big', category: 'pin', description: 'Find and trade two different pins in one visit', points: 50, difficulty: 'medium' },

  // Character Meet & Greet (25 pts)
  { id: 'char-e-1', size: 'big', category: 'character', description: 'Spot a character from a distance (no meet required)', points: 25, difficulty: 'easy' },
  // Character Meet & Greet (50 pts)
  { id: 'char-m-1', size: 'big', category: 'character', description: 'Meet and get a photo with any character', points: 50, difficulty: 'medium' },
  { id: 'char-m-2', size: 'big', category: 'character', description: 'Have a full conversation (3+ exchanges) with a face character', points: 50, difficulty: 'medium' },

  // Exploration (25 pts)
  { id: 'exp-e-1', size: 'big', category: 'exploration', description: 'Find a bathroom that most guests don\'t know about', points: 25, difficulty: 'easy' },
  { id: 'exp-e-2', size: 'big', category: 'exploration', description: 'Walk through an entire land without using your phone', points: 25, difficulty: 'easy' },
  // Exploration (50 pts)
  { id: 'exp-m-1', size: 'big', category: 'exploration', description: 'Find and read every plaque or informational sign in one area', points: 50, difficulty: 'medium' },
  { id: 'exp-m-2', size: 'big', category: 'exploration', description: 'Explore a land you haven\'t visited today and find 3 hidden details', points: 50, difficulty: 'medium' },

  // Scavenger (25 pts)
  { id: 'sca-e-1', size: 'big', category: 'scavenger', description: 'Find a plush of a character that isn\'t Mickey or Minnie in a gift shop', points: 25, difficulty: 'easy' },
  { id: 'sca-e-2', size: 'big', category: 'scavenger', description: 'Find a piece of merchandise that costs more than $100', points: 25, difficulty: 'easy' },
  // Scavenger (50 pts)
  { id: 'sca-m-1', size: 'big', category: 'scavenger', description: 'Find 5 different character-themed items in one gift shop without buying anything', points: 50, difficulty: 'medium' },
  { id: 'sca-m-2', size: 'big', category: 'scavenger', description: 'Find items in 3 different gift shops that all share the same character theme', points: 50, difficulty: 'medium' },

  // Ride-based tasks are generated dynamically in the store based on available rides
];

export function getSmallTaskPool(enabledCategories: string[]): Task[] {
  return SMALL_TASKS.filter(t => enabledCategories.includes(t.category));
}

export function getBigTaskPool(enabledCategories: string[]): Task[] {
  return BIG_TASKS.filter(t => enabledCategories.includes(t.category));
}

export function generateRideTasks(rides: import('../types').Ride[], disabledRideIds: string[]): Task[] {
  return rides
    .filter(r => !disabledRideIds.includes(r.id))
    .map(r => ({
      id: `ride-${r.id}`,
      size: 'big' as const,
      category: 'ride' as const,
      description: `Ride ${r.name}`,
      points: r.points,
      difficulty: r.intensity === 'gentle' ? 'easy' as const : r.intensity === 'moderate' ? 'medium' as const : 'hard' as const,
      parkId: r.parkId,
      rideId: r.id,
      heightRequirement: r.heightRequirement,
    }));
}
