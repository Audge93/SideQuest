import { Park, Ride } from '../types';

export const PARKS: Park[] = [
  {
    id: 'wdw-mk',
    name: 'Magic Kingdom',
    shortName: 'MK',
    theme: 'disney',
    lands: [
      { id: 'wdw-mk-mainstreet', name: 'Main Street, U.S.A.', parkId: 'wdw-mk' },
      { id: 'wdw-mk-adventureland', name: 'Adventureland', parkId: 'wdw-mk' },
      { id: 'wdw-mk-frontierland', name: 'Frontierland', parkId: 'wdw-mk' },
      { id: 'wdw-mk-fantasyland', name: 'Fantasyland', parkId: 'wdw-mk' },
      { id: 'wdw-mk-tomorrowland', name: 'Tomorrowland', parkId: 'wdw-mk' },
    ],
  },
  {
    id: 'wdw-hs',
    name: "Hollywood Studios",
    shortName: 'HS',
    theme: 'disney',
    lands: [
      { id: 'wdw-hs-hollywood', name: 'Hollywood Boulevard', parkId: 'wdw-hs' },
      { id: 'wdw-hs-galaxysedge', name: "Galaxy's Edge", parkId: 'wdw-hs' },
      { id: 'wdw-hs-toybox', name: 'Toy Story Land', parkId: 'wdw-hs' },
    ],
  },
  {
    id: 'wdw-ep',
    name: 'EPCOT',
    shortName: 'EP',
    theme: 'disney',
    lands: [
      { id: 'wdw-ep-worldcelebration', name: 'World Celebration', parkId: 'wdw-ep' },
      { id: 'wdw-ep-worldnature', name: 'World Nature', parkId: 'wdw-ep' },
      { id: 'wdw-ep-worlddiscovery', name: 'World Discovery', parkId: 'wdw-ep' },
      { id: 'wdw-ep-worldshowcase', name: 'World Showcase', parkId: 'wdw-ep' },
    ],
  },
  {
    id: 'wdw-ak',
    name: 'Animal Kingdom',
    shortName: 'AK',
    theme: 'disney',
    lands: [
      { id: 'wdw-ak-discovery', name: 'Discovery Island', parkId: 'wdw-ak' },
      { id: 'wdw-ak-pandora', name: 'Pandora', parkId: 'wdw-ak' },
      { id: 'wdw-ak-africa', name: 'Africa', parkId: 'wdw-ak' },
    ],
  },
  {
    id: 'dl-dl',
    name: 'Disneyland',
    shortName: 'DL',
    theme: 'disney',
    lands: [
      { id: 'dl-dl-mainstreet', name: 'Main Street, U.S.A.', parkId: 'dl-dl' },
      { id: 'dl-dl-adventureland', name: 'Adventureland', parkId: 'dl-dl' },
      { id: 'dl-dl-fantasyland', name: 'Fantasyland', parkId: 'dl-dl' },
      { id: 'dl-dl-tomorrowland', name: 'Tomorrowland', parkId: 'dl-dl' },
    ],
  },
  {
    id: 'uor-us',
    name: 'Universal Studios Florida',
    shortName: 'USF',
    theme: 'universal',
    lands: [
      { id: 'uor-us-springfield', name: 'Springfield', parkId: 'uor-us' },
      { id: 'uor-us-wizworld', name: 'Wizarding World', parkId: 'uor-us' },
      { id: 'uor-us-nyc', name: 'New York', parkId: 'uor-us' },
    ],
  },
  {
    id: 'uor-ioa',
    name: 'Islands of Adventure',
    shortName: 'IOA',
    theme: 'universal',
    lands: [
      { id: 'uor-ioa-marvel', name: 'Marvel Super Hero Island', parkId: 'uor-ioa' },
      { id: 'uor-ioa-hogsmeade', name: 'Hogsmeade', parkId: 'uor-ioa' },
      { id: 'uor-ioa-jurassic', name: 'Jurassic World', parkId: 'uor-ioa' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Park',
    shortName: 'MY',
    theme: 'custom',
    lands: [
      { id: 'custom-land', name: 'The Park', parkId: 'custom' },
    ],
  },
];

export const RIDES: Ride[] = [
  // Magic Kingdom
  { id: 'mk-spacemtn', name: 'Space Mountain', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-mk', landId: 'wdw-mk-tomorrowland' },
  { id: 'mk-splash', name: 'Splash Mountain', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-mk', landId: 'wdw-mk-frontierland' },
  { id: 'mk-bm', name: 'Big Thunder Mountain', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-mk', landId: 'wdw-mk-frontierland' },
  { id: 'mk-pirates', name: 'Pirates of the Caribbean', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk', landId: 'wdw-mk-adventureland' },
  { id: 'mk-7dwarfs', name: '7 Dwarfs Mine Train', heightRequirement: 38, intensity: 'moderate', points: 50, parkId: 'wdw-mk', landId: 'wdw-mk-fantasyland' },
  { id: 'mk-haunted', name: 'Haunted Mansion', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-mk', landId: 'wdw-mk-fantasyland' },
  // Hollywood Studios
  { id: 'hs-slinky', name: 'Slinky Dog Dash', heightRequirement: 38, intensity: 'gentle', points: 25, parkId: 'wdw-hs', landId: 'wdw-hs-toybox' },
  { id: 'hs-rise', name: 'Rise of the Resistance', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'wdw-hs', landId: 'wdw-hs-galaxysedge' },
  { id: 'hs-tower', name: 'Tower of Terror', heightRequirement: 40, intensity: 'thrill', points: 75, parkId: 'wdw-hs', landId: 'wdw-hs-hollywood' },
  { id: 'hs-rocknroll', name: "Rock 'n' Roller Coaster", heightRequirement: 48, intensity: 'thrill', points: 75, parkId: 'wdw-hs', landId: 'wdw-hs-hollywood' },
  // EPCOT
  { id: 'ep-guardians', name: 'Guardians of the Galaxy', heightRequirement: 40, intensity: 'thrill', points: 75, parkId: 'wdw-ep', landId: 'wdw-ep-worlddiscovery' },
  { id: 'ep-spaceship', name: 'Spaceship Earth', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep', landId: 'wdw-ep-worldcelebration' },
  { id: 'ep-frozen', name: 'Frozen Ever After', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ep', landId: 'wdw-ep-worldshowcase' },
  // Animal Kingdom
  { id: 'ak-flight', name: 'Flight of Passage', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-ak', landId: 'wdw-ak-pandora' },
  { id: 'ak-safari', name: 'Kilimanjaro Safaris', heightRequirement: 0, intensity: 'gentle', points: 25, parkId: 'wdw-ak', landId: 'wdw-ak-africa' },
  { id: 'ak-everest', name: 'Expedition Everest', heightRequirement: 44, intensity: 'thrill', points: 75, parkId: 'wdw-ak', landId: 'wdw-ak-africa' },
  // Universal
  { id: 'uor-veloci', name: 'VelociCoaster', heightRequirement: 51, intensity: 'thrill', points: 75, parkId: 'uor-ioa', landId: 'uor-ioa-jurassic' },
  { id: 'uor-hagrids', name: "Hagrid's Motorbike", heightRequirement: 48, intensity: 'thrill', points: 75, parkId: 'uor-ioa', landId: 'uor-ioa-hogsmeade' },
  { id: 'uor-spiderman', name: 'Amazing Adventures of Spider-Man', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'uor-ioa', landId: 'uor-ioa-marvel' },
  { id: 'uor-minions', name: 'Minion Mayhem', heightRequirement: 40, intensity: 'moderate', points: 50, parkId: 'uor-us', landId: 'uor-us-springfield' },
];

export function getParkById(id: string): Park | undefined {
  return PARKS.find(p => p.id === id);
}

export function getRidesByPark(parkId: string): Ride[] {
  return RIDES.filter(r => r.parkId === parkId);
}
