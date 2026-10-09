import { Settings, Task } from '../types';

// Explicitly reviewed observation/gesture tasks. Unknown content is excluded
// from restrictive modes until reviewed; ride height is not accessibility data.
const nearby = new Set([
  'find-e-1', 'find-e-2', 'find-e-3', 'find-e-6', 'find-e-10', 'find-m-4', 'find-h-1', 'find-h-3',
  'photo-e-2', 'photo-e-3', 'photo-e-5', 'photo-m-5',
  'act-e-1', 'act-e-2', 'act-e-4', 'act-e-8', 'act-e-9', 'act-e-10', 'act-e-11', 'act-e-12', 'act-e-13', 'act-e-14',
  'explore-e-1',
]);
const oneArea = new Set([
  'find-e-7', 'find-e-9', 'find-m-3', 'find-m-5', 'find-m-6', 'find-m-7', 'find-m-9', 'find-h-4', 'find-h-5',
  'photo-e-4', 'photo-m-2', 'photo-h-2', 'photo-h-3',
  'seek-e-1', 'seek-e-2', 'seek-m-1', 'seek-m-3', 'seek-m-4', 'pins-e-1', 'pins-e-3', 'explore-e-3',
  ...Array.from({ length: 13 }, (_, i) => `treat-expansion-${i + 1}`),
  'photo-expansion-2', 'photo-expansion-3', 'photo-expansion-4', 'photo-expansion-5', 'photo-expansion-6', 'photo-expansion-7', 'photo-expansion-8',
]);
const quietPhotos = new Set([
  'photo-e-3','photo-e-4','photo-e-6','photo-m-3','photo-m-5','photo-h-2','photo-h-3','photo-h-4','photo-h-5',
  ...Array.from({ length: 7 }, (_, i) => `photo-expansion-${i + 2}`),
]);
const spokenActivities = new Set([
  'pins-expansion-15','rideact-spacemtn-mk-1','rideact-speedway-mk-1','rideact-falcon-hs-2','rideact-testtrack-ep-1','rideact-everest-ak-1',
  'rideact-expansion-wdw-mk-its-a-small-world-1',
  'rideact-expansion-wdw-hs-mickey-minnies-runaway-railway-2','rideact-expansion-wdw-hs-mickey-minnies-runaway-railway-3',
  'rideact-expansion-wdw-hs-toy-story-mania-1','rideact-expansion-wdw-hs-star-tours-1','rideact-expansion-wdw-hs-star-tours-3',
  'rideact-expansion-wdw-hs-alien-swirling-saucers-2','rideact-expansion-wdw-hs-slinky-dog-dash-2','rideact-expansion-wdw-hs-rock-n-roller-coaster-2',
  'rideact-expansion-wdw-ep-spaceship-earth-1','rideact-expansion-wdw-ep-living-with-the-land-2','rideact-expansion-wdw-ep-seas-with-nemo-and-friends-2',
  'rideact-expansion-wdw-ep-frozen-ever-after-1','rideact-expansion-wdw-ep-remys-ratatouille-adventure-2','rideact-expansion-wdw-ep-gran-fiesta-tour-2',
  'rideact-expansion-wdw-ep-journey-into-imagination-with-figment-2','rideact-expansion-wdw-ak-kilimanjaro-safaris-3','rideact-expansion-wdw-ak-kilimanjaro-safaris-5',
  'rideact-expansion-wdw-ak-flight-of-passage-2','rideact-expansion-wdw-ak-flight-of-passage-4','rideact-expansion-wdw-ak-navi-river-journey-4',
  'rideact-expansion-wdw-ak-navi-river-journey-5','rideact-expansion-wdw-ak-expedition-everest-3','rideact-expansion-wdw-ak-kali-river-rapids-2','rideact-expansion-wdw-ak-kali-river-rapids-3',
]);
export const COMFORT_TASKS: Task[] = [
  ['explore', 'Study a park map and pick three places you would like to visit'],
  ['explore', 'From your current spot, notice three details that help tell the story of this area'],
  ['explore', 'Choose a favorite color in your surroundings and notice three examples without moving'],
  ['explore', 'From your current spot, compare two decorations and notice how they differ'],
  ['explore', 'Use a park map to plan an imaginary afternoon with your party'],
  ['explore', 'Notice the shapes around you and pick one that fits this land’s theme'],
  ['seek', 'From your current spot, spot three different accessories worn by your own party'],
  ['seek', 'Look for three different colors in the belongings your party already has'],
  ['seek', 'Without moving, look for a repeated symbol or shape in your surroundings'],
  ['seek', 'Find two matching details on the belongings your party already has'],
  ['seek', 'From your current spot, spot three different materials in the surrounding decorations'],
].map(([category, description], i) => ({
  id: `comfort-${i + 1}`, size: 'big', category: category as 'explore' | 'seek',
  displayCategory: category === 'seek' ? 'Seek' : 'Explore', description,
  flavorText: 'Stay in your current spot. You may point, type, or think your answer; speaking is optional.',
  points: 25, difficulty: 'easy',
}));

export function matchesActivityPreferences(task: Task, settings: Settings) {
  if (settings.noPerforming && (task.category === 'act' || task.category === 'meet'
    || (task.category === 'photo' && !quietPhotos.has(task.id)) || spokenActivities.has(task.id))) return false;
  if (!settings.seatedOnly && !settings.lessWalking) return true;
  return task.category === 'trivia' || nearby.has(task.id) || task.id.startsWith('comfort-')
    || (!settings.seatedOnly && oneArea.has(task.id));
}
