// Flat pictograms: solid fills and consistent outlines on a 48 x 48 grid.
const INK = '#2A1E3F';
const C = { gold: '#F5C84C', blue: '#4383D5', green: '#48A770', red: '#D95C62', purple: '#8C79B5', cream: '#FFF8EC', steel: '#B9C0D4', pink: '#D678A5' };
const outline = `stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"`;
const path = (d: string, fill = 'none') => `<path d="${d}" fill="${fill}" ${outline}/>`;
const circle = (x: number, y: number, r: number, fill: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${outline}/>`;
const rect = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" ${outline}/>`;
const star = () => path('M24 5l5.5 12 13 1.5-9.5 9 2.5 13L24 34l-11.5 6.5 2.5-13-9.5-9 13-1.5Z', C.gold);
const BODIES = {
 controller: path('M13 13h22c5 0 8 20 5 24-3 4-9-5-11-5H19c-2 0-8 9-11 5-3-4 0-24 5-24Z',C.purple) + path('M12 23h10M17 18v10') + circle(31,21,2,C.gold) + circle(36,26,2,C.gold),
 find: path('M32 32l10 10') + circle(20,20,14,C.gold) + circle(20,20,9,C.cream),
 photo: path('M7 15h9l3-6h10l3 6h9v25H7Z',C.purple) + circle(24,27,8,C.cream) + path('M35 20h2'),
 trivia: path('M7 7h34v28H23l-10 8v-8H7Z',C.cream) + path('M19 17a5 5 0 1 1 8 4c-3 2-3 3-3 5') + circle(24,30,1,INK),
 act: rect(7,20,34,22,C.purple) + path('M7 19V9h34v10Z',C.cream) + path('M14 9l-5 10M25 9l-5 10M36 9l-5 10M15 28h18M15 34h12'),
 ride: path('M5 40h38M6 34C13 9 35 9 42 34M18 26v14M31 25v15') + rect(11,17,16,8,C.red) + circle(15,27,2,INK) + circle(23,27,2,INK),
 treat: path('M15 25h18l-9 18Z',C.gold) + path('M10 25c-4-6 0-13 7-13 0-11 14-11 14 0 7 0 11 7 7 13Z',C.pink),
 pins: path('M24 30v12') + circle(24,19,14,C.gold) + path('M24 10l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',C.red),
 meet: rect(7,7,27,35,C.pink) + path('M13 7v35M19 16h9M19 23h9M19 30h6') + path('M36 17l6 3-10 20-6 3v-7Z',C.gold),
 explore: path('M5 10l12-4 14 4 12-4v32l-12 4-14-4-12 4Z',C.cream) + path('M17 6v32M31 10v32M10 30l5-5 9 3 12-11M33 15l6 6M39 15l-6 6'),
 seek: path('M7 32V12h12v20M29 32V12h12v20',C.purple) + rect(19,18,10,8,C.purple) + circle(13,33,9,C.purple) + circle(35,33,9,C.purple) + circle(13,33,5,C.cream) + circle(35,33,5,C.cream),
 'park-mk': path('M7 42V21h9v21h16V21h9v21Z',C.cream) + path('M16 42V17h16v25Z',C.cream) + path('M5 21l6.5-11L18 21ZM14 17L24 4l10 13ZM30 21l6.5-11L43 21Z',C.blue) + path('M21 42v-8a3 3 0 0 1 6 0v8',INK),
 'park-hs': circle(14,13,8,C.purple) + circle(31,13,8,C.purple) + circle(14,13,2,C.cream) + circle(31,13,2,C.cream) + path('M35 28l8-5v17l-8-5Z',C.blue) + rect(5,23,30,18,C.purple),
 'park-ep': circle(24,24,19,C.steel) + `<path d="M14 9h20M8 16h32M5 24h38M8 32h32M14 39h20M24 5l-10 4 5 7-5 8 5 8-5 7 10 4M24 5l10 4-5 7 5 8-5 8 5 7-10 4M14 9l-6 7 6 8-6 8 6 7M34 9l6 7-6 8 6 8-6 7M24 9l-5 7 5 8-5 8 5 7M24 9l5 7-5 8 5 8-5 7" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
 'park-ak': path('M20 26h8v17h-8Z',C.gold) + path('M24 5c7 0 11 4 12 10 11 1 12 15 1 17H11C0 30 1 16 12 15 13 9 17 5 24 5Z',C.green),
 flame: path('M25 4c0 9 11 14 11 25 0 8-5 14-12 14S11 37 11 29c0-7 4-10 7-15l3 9c4-5 5-11 4-19Z',C.red),
 check: circle(24,24,18,C.green) + `<path d="M14 24l7 7 13-14" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
 cards: rect(7,13,23,29,C.purple) + rect(18,6,23,29,C.cream) + path('M29.5 13l6 7.5-6 7.5-6-7.5Z',C.gold),
 draft: path('M6 14l15-4 8 29-15 4Z',C.blue) + path('M27 10l15 4-8 29-15-4Z',C.red) + rect(15,5,18,31,C.cream) + path('M24 13l5 7-5 7-5-7Z',C.gold),
 gear: path('M20 4h8l1 6 5 3 6-2 4 7-5 4v5l5 4-4 7-6-2-5 3-1 6h-8l-1-6-5-3-6 2-4-7 5-4v-5l-5-4 4-7 6 2 5-3Z',C.steel) + circle(24,24,7,C.purple),
 profile: path('M7 43c0-10 7-16 17-16s17 6 17 16Z',C.blue) + circle(24,15,9,C.gold),
 'chevron-down': `<path d="M13 19l11 11 11-11" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
 trophy: path('M13 12H6v6c0 6 5 9 10 9M35 12h7v6c0 6-5 9-10 9') + path('M13 6h22v14a11 11 0 0 1-22 0ZM24 31v9',C.gold) + rect(13,39,22,5,C.purple),
 medal: path('M12 5h9l9 19h-9ZM36 5h-9l-9 19h9Z',C.blue) + circle(24,31,13,C.gold) + path('M24 23l2.5 5 5.5 1-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-1Z',C.cream),
 coin: circle(24,24,18,C.gold) + path('M24 13l3.5 7 7.5 1-5.5 5.5 1.5 7.5-7-3.5-7 3.5 1.5-7.5-5.5-5.5 7.5-1Z',C.cream),
 gem: path('M13 7h22l8 12-19 24L5 19Z',C.blue) + path('M5 19h38M13 7l5 12 6-12 6 12 5-12M18 19l6 24 6-24'),
 star: star(),
 crown: path('M7 13l10 9 7-13 7 13 10-9-3 27H10Z',C.gold) + path('M10 33h28'),
 flag: path('M10 43V6M10 7h29v20H10Z',C.red),
 sparkle: path('M24 5l5 14 14 5-14 5-5 14-5-14-14-5 14-5Z',C.gold),
 ruler: rect(15,4,18,40,C.gold) + path('M15 11h8M15 18h5M15 25h8M15 32h5M15 39h8'),
 speaker: path('M6 18h9l11-9v30l-11-9H6Z',C.purple) + path('M32 18a8 8 0 0 1 0 12M37 12a16 16 0 0 1 0 24'),
 vibrate: rect(15,5,18,38,C.purple) + rect(19,11,10,23,C.cream) + path('M22 38h4M8 16l-3 8 3 8M40 16l3 8-3 8'),
 bulb: path('M18 31h12v9H18ZM18 36h12',C.steel) + path('M24 5a13 13 0 0 1 8 23c-2 1-2 2-2 3H18c0-1 0-2-2-3a13 13 0 0 1 8-23Z',C.gold) + path('M20 21l4 5 4-5M24 26v5'),
 sun: path('M24 3v5M24 40v5M3 24h5M40 24h5M9 9l4 4M35 35l4 4M9 39l4-4M35 13l4-4') + circle(24,24,11,C.gold),
 moon: path('M29 5a19 19 0 1 0 14 26A16 16 0 0 1 29 5Z',C.gold),
 pencil: path('M10 31L31 10l8 8-21 21-11 3Z',C.gold) + path('M31 10l4-4 8 8-4 4Z',C.pink) + path('M10 31l8 8M7 42l3-11'),
 trash: path('M12 14h24l-2 28H14Z',C.steel) + path('M8 14h32M18 14V7h12v7M20 21v14M28 21v14'),
 swap: path('M8 16h31l-7-7M40 32H9l7 7M39 16l-7 7M9 32l7-7'),
};
export type IconName = keyof typeof BODIES;
export const ICON_NAMES = Object.keys(BODIES) as IconName[];
export const ICON_SVG = Object.fromEntries(Object.entries(BODIES).map(([name,body]) => [name,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${body}</svg>`])) as Record<IconName,string>;
