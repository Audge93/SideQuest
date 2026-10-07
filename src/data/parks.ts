import { Park, Ride } from '../types';

// Canonical list of selectable parks. These ids are referenced by settings,
// sessions, ride data, and saved games throughout the app.
export const PARKS: Park[] = [
  { id: 'wdw-mk', name: 'Magic Kingdom', shortName: 'MK', icon: 'park-mk', theme: 'disney' },
  { id: 'wdw-hs', name: 'Hollywood Studios', shortName: 'HS', icon: 'park-hs', theme: 'disney' },
  { id: 'wdw-ep', name: 'EPCOT', shortName: 'EP', icon: 'park-ep', theme: 'disney' },
  { id: 'wdw-ak', name: 'Animal Kingdom', shortName: 'AK', icon: 'park-ak', theme: 'disney' },
];

// Master attraction catalog. The store turns these into ride tasks at runtime
// so ride metadata only has to be maintained in one place.
export const RIDES: Ride[] = [
  // ── Magic Kingdom (23) ──────────────────────────────────────────────
  { id: 'wdw-mk-space-mountain', name: 'Space Mountain', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-mk' },
  { id: 'wdw-mk-tianas-bayou-adventure', name: "Tiana's Bayou Adventure", heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-mk' },
  { id: 'wdw-mk-big-thunder-mountain-railroad', name: 'Big Thunder Mountain Railroad', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-mk' },
  { id: 'wdw-mk-pirates-of-the-caribbean', name: 'Pirates of the Caribbean', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-seven-dwarfs-mine-train', name: 'Seven Dwarfs Mine Train', heightRequirement: 38, intensity: 'moderate', points: 50, parkId: 'wdw-mk' },
  { id: 'wdw-mk-haunted-mansion', name: 'Haunted Mansion', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-tron-lightcycle-run', name: 'TRON Lightcycle Run', heightRequirement: 48, intensity: 'thrill', points: 75, parkId: 'wdw-mk' },
  { id: 'wdw-mk-jungle-cruise', name: 'Jungle Cruise', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-peter-pans-flight', name: "Peter Pan's Flight", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-its-a-small-world', name: "it's a small world", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-buzz-lightyears-space-ranger-spin', name: "Buzz Lightyear's Space Ranger Spin", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-many-adventures-of-winnie-the-pooh', name: 'The Many Adventures of Winnie the Pooh', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-little-mermaid-ariels-undersea-adventure', name: "The Little Mermaid: Ariel's Undersea Adventure", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-mad-tea-party', name: 'Mad Tea Party', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-dumbo-the-flying-elephant', name: 'Dumbo the Flying Elephant', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-prince-charming-regal-carrousel', name: 'Prince Charming Regal Carrousel', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-astro-orbiter', name: 'Astro Orbiter', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-tomorrowland-speedway', name: 'Tomorrowland Speedway', heightRequirement: 32, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-magic-carpets-of-aladdin', name: 'Magic Carpets of Aladdin', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-peoplemover', name: 'PeopleMover', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-barnstormer', name: 'Barnstormer', heightRequirement: 35, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-mickey-minnies-runaway-railway', name: "Mickey & Minnie's Runaway Railway", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },
  { id: 'wdw-mk-monsters-inc-laugh-floor', name: 'Monsters Inc. Laugh Floor', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk' },

  // ── Hollywood Studios (9) ───────────────────────────────────────────
  { id: 'wdw-hs-slinky-dog-dash', name: 'Slinky Dog Dash', heightRequirement: 38, intensity: 'moderate', points: 50, parkId: 'wdw-hs' },
  { id: 'wdw-hs-star-wars-rise-of-the-resistance', name: 'Star Wars: Rise of the Resistance', heightRequirement: 40, intensity: 'thrill', points: 75, parkId: 'wdw-hs' },
  { id: 'wdw-hs-tower-of-terror', name: 'Tower of Terror', heightRequirement: 40, intensity: 'thrill', points: 75, parkId: 'wdw-hs' },
  { id: 'wdw-hs-rock-n-roller-coaster', name: "Rock 'n' Roller Coaster", heightRequirement: 48, intensity: 'thrill', points: 75, parkId: 'wdw-hs' },
  { id: 'wdw-hs-millennium-falcon-smugglers-run', name: 'Millennium Falcon: Smugglers Run', heightRequirement: 38, intensity: 'moderate', points: 50, parkId: 'wdw-hs' },
  { id: 'wdw-hs-mickey-minnies-runaway-railway', name: "Mickey & Minnie's Runaway Railway", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-hs' },
  { id: 'wdw-hs-toy-story-mania', name: 'Toy Story Mania!', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-hs' },
  { id: 'wdw-hs-alien-swirling-saucers', name: 'Alien Swirling Saucers', heightRequirement: 32, intensity: 'gentle', points: 25, parkId: 'wdw-hs' },
  { id: 'wdw-hs-star-tours', name: 'Star Tours', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-hs' },

  // ── EPCOT (12) ──────────────────────────────────────────────────────
  { id: 'wdw-ep-guardians-of-the-galaxy-cosmic-rewind', name: 'Guardians of the Galaxy: Cosmic Rewind', heightRequirement: 42, intensity: 'thrill', points: 75, parkId: 'wdw-ep' },
  { id: 'wdw-ep-spaceship-earth', name: 'Spaceship Earth', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-frozen-ever-after', name: 'Frozen Ever After', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-test-track', name: 'Test Track', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-ep' },
  { id: 'wdw-ep-remys-ratatouille-adventure', name: "Remy's Ratatouille Adventure", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-soarin-around-the-world', name: "Soarin' Around the World", heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-ep' },
  { id: 'wdw-ep-mission-space', name: 'Mission: SPACE', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-ep' },
  { id: 'wdw-ep-living-with-the-land', name: 'Living with the Land', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-journey-of-water', name: 'Journey of Water', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-seas-with-nemo-and-friends', name: 'The Seas with Nemo & Friends', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-gran-fiesta-tour', name: 'Gran Fiesta Tour', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },
  { id: 'wdw-ep-journey-into-imagination-with-figment', name: 'Journey Into Imagination with Figment', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep' },

  // ── Animal Kingdom (7) ──────────────────────────────────────────────
  { id: 'wdw-ak-flight-of-passage', name: 'Flight of Passage', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-ak' },
  { id: 'wdw-ak-kilimanjaro-safaris', name: 'Kilimanjaro Safaris', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ak' },
  { id: 'wdw-ak-expedition-everest', name: 'Expedition Everest', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-ak' },
  { id: 'wdw-ak-dinosaur', name: 'DINOSAUR', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-ak' },
  { id: 'wdw-ak-kali-river-rapids', name: 'Kali River Rapids', heightRequirement: 38, intensity: 'moderate', points: 50, parkId: 'wdw-ak' },
  { id: 'wdw-ak-navi-river-journey', name: "Na'vi River Journey", heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ak' },
  { id: 'wdw-ak-triceratop-spin', name: 'TriceraTop Spin', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ak' },
];

// Convenience lookup for turning a stored park id into displayable park metadata.
export function getParkById(id: string): Park | undefined {
  return PARKS.find(p => p.id === id);
}

// Convenience selector for retrieving all rides belonging to one park.
export function getRidesByPark(parkId: string): Ride[] {
  return RIDES.filter(r => r.parkId === parkId);
}
