import { PARKS } from '../data/parks';

export function defaultGameName(parkId: string, date = new Date()) {
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  return `${month} ${date.getDate()} - ${PARKS.find(park => park.id === parkId)?.name ?? 'Unknown Park'}`;
}
