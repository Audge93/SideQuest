// Custom card-game icon set: flat color, thick ink outline, white highlight.
// Every icon is drawn on a 48×48 grid and stored as SVG markup so it stays
// crisp at any size and costs no network request on a phone.

const INK = '#2A1E3F';
const S = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
const T = `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
const HI = 'fill="#FFFFFF" fill-opacity="0.5"';

const C = {
  gold: '#FFD45C',
  goldDeep: '#F2B830',
  red: '#E8484F',
  blue: '#4C8DFF',
  blueDeep: '#3D6FE0',
  green: '#3DBE6E',
  leaf: '#4CB86A',
  purple: '#7B5FE0',
  pink: '#E9539F',
  orange: '#F58A2E',
  cream: '#FFF8EC',
  steel: '#B9C0D4',
  slate: '#7A6FA0',
  slateDeep: '#5E5384',
  sky: '#8FD3FF',
  wood: '#A0643A',
};

const r1 = (n: number) => Math.round(n * 10) / 10;

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    out.push(`${r1(cx + rad * Math.cos(a))},${r1(cy + rad * Math.sin(a))}`);
  }
  return out.join(' ');
}

const star = (cx: number, cy: number, outer: number, inner: number, fill: string, stroke = S) =>
  `<polygon points="${starPoints(cx, cy, outer, inner)}" fill="${fill}" ${stroke}/>`;

// Thick outlined stroke: an ink pass underneath a colored pass.
const tube = (d: string, color: string, width = 4) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 4}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Several circles merged into one outlined silhouette.
const blob = (circles: [number, number, number][], color: string) =>
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.25}" fill="${INK}"/>`).join('') +
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.25}" fill="${color}"/>`).join('');

function gearPath(cx: number, cy: number, teeth: number, outer: number, inner: number) {
  const parts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [inner, a - step * 0.5],
      [inner, a - step * 0.22],
      [outer, a - step * 0.16],
      [outer, a + step * 0.16],
      [inner, a + step * 0.22],
    ];
    for (const [rad, ang] of pts) {
      parts.push(`${parts.length === 0 ? 'M' : 'L'}${r1(cx + rad * Math.cos(ang))} ${r1(cy + rad * Math.sin(ang))}`);
    }
  }
  return parts.join(' ') + 'Z';
}

function rays(cx: number, cy: number, from: number, to: number, count: number, color: string) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    d += `M${r1(cx + from * Math.cos(a))} ${r1(cy + from * Math.sin(a))}L${r1(cx + to * Math.cos(a))} ${r1(cy + to * Math.sin(a))}`;
  }
  return tube(d, color, 3.5);
}

const BIG_STAR = starPoints(24, 25, 20, 8.5).split(' ');

const BODIES = {
  // ── Card categories ─────────────────────────────────────────
  find:
    tube('M31 31L41 41', C.wood, 5) +
    `<circle cx="20" cy="20" r="14" fill="${C.gold}" ${S}/>` +
    `<circle cx="20" cy="20" r="9.5" fill="${C.sky}" ${T}/>` +
    `<path d="M14 18a7 7 0 0 1 5-5.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,

  photo:
    `<path d="M15 15l3-6h12l3 6z" fill="${C.slate}" ${S}/>` +
    `<rect x="5" y="14" width="38" height="27" rx="5" fill="${C.slate}" ${S}/>` +
    `<rect x="5" y="19" width="38" height="5" fill="${C.red}" ${T}/>` +
    `<circle cx="24" cy="28" r="10" fill="${C.steel}" ${S}/>` +
    `<circle cx="24" cy="28" r="6" fill="${C.blue}" ${T}/>` +
    `<circle cx="21.5" cy="25.5" r="2" fill="#fff"/>` +
    `<rect x="34" y="15.5" width="6" height="3" rx="1" fill="${C.gold}" ${T}/>`,

  trivia:
    `<path d="M9 7h30a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H23l-9 8v-8H9a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z" fill="${C.cream}" ${S}/>` +
    tube('M18.5 16a5.5 5.5 0 1 1 8 5c-2 1-2.5 2-2.5 3.5', C.goldDeep, 3.5) +
    `<circle cx="24" cy="30" r="2.6" fill="${C.goldDeep}" ${T}/>`,

  act:
    `<rect x="6" y="20" width="36" height="22" rx="3" fill="${C.slateDeep}" ${S}/>` +
    `<g transform="rotate(-14 6 19)">` +
    `<rect x="6" y="11" width="36" height="8" rx="1.5" fill="#fff" ${S}/>` +
    `<polygon points="12,11.5 18,11.5 15,18.5 9,18.5" fill="${INK}"/>` +
    `<polygon points="24,11.5 30,11.5 27,18.5 21,18.5" fill="${INK}"/>` +
    `<polygon points="36,11.5 41,11.5 39,18.5 33,18.5" fill="${INK}"/>` +
    `</g>` +
    star(24, 31.5, 7, 3, C.gold, T),

  ride:
    tube('M4 41H44', C.red, 3.5) +
    tube('M19 33V41M33 33V41', C.steel, 2.5) +
    tube('M26 33a10.5 10.5 0 1 1 0.1 0', C.red, 3.5) +
    `<rect x="4" y="29" width="14" height="8" rx="2.5" fill="${C.gold}" ${S}/>` +
    `<rect x="6.5" y="25" width="4" height="5" rx="1.5" fill="${C.blue}" ${T}/>` +
    `<circle cx="8" cy="38.5" r="2.3" fill="${INK}"/><circle cx="14" cy="38.5" r="2.3" fill="${INK}"/>`,

  treat:
    `<polygon points="15,24 33,24 24,45" fill="#E8A85C" ${S}/>` +
    `<path d="M19 28.5L26.5 36M26 27L20.5 33M23 26l6 6" fill="none" ${T}/>` +
    `<circle cx="17" cy="21" r="7.5" fill="#F59AC0" ${S}/>` +
    `<circle cx="31" cy="21" r="7.5" fill="#8FE0B8" ${S}/>` +
    `<circle cx="24" cy="14" r="8" fill="#FFF1D6" ${S}/>` +
    `<path d="M27 5c1-2 3-3 5-3" fill="none" ${T}/>` +
    `<circle cx="27" cy="6.5" r="3" fill="${C.red}" ${T}/>` +
    `<circle cx="21" cy="11" r="2" ${HI}/>`,

  pins:
    `<rect x="21" y="30" width="6" height="11" rx="2" fill="${C.steel}" ${S}/>` +
    `<rect x="15" y="38" width="18" height="6" rx="3" fill="${C.goldDeep}" ${S}/>` +
    `<circle cx="24" cy="19" r="16" fill="${C.orange}" ${S}/>` +
    `<circle cx="24" cy="19" r="11.5" fill="${C.cream}" ${T}/>` +
    star(24, 19.5, 8, 3.5, C.red, T) +
    `<path d="M12 13a13 13 0 0 1 7-6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`,

  meet:
    `<rect x="6" y="7" width="28" height="35" rx="3.5" fill="${C.pink}" ${S}/>` +
    `<rect x="6" y="7" width="7" height="35" rx="2" fill="#B93A7E" ${S}/>` +
    `<rect x="16" y="13" width="15" height="9" rx="1.5" fill="${C.cream}" ${T}/>` +
    `<path d="M18 19c2-4 3 1 5-2s2.5 2 6-1" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>` +
    star(23.5, 31.5, 6, 2.6, C.gold, T) +
    `<g transform="rotate(32 39 26)">` +
    `<rect x="36" y="9" width="6.5" height="25" rx="2" fill="${C.blue}" ${S}/>` +
    `<polygon points="36,34 42.5,34 39.25,41" fill="#FFD9B5" ${S}/>` +
    `<rect x="36" y="9" width="6.5" height="5" rx="1.5" fill="${C.gold}" ${T}/>` +
    `</g>`,

  explore:
    `<polygon points="5,10 17,6 31,10 43,6 43,38 31,42 17,38 5,42" fill="#FFE9B8" ${S}/>` +
    `<polygon points="17,6 31,10 31,42 17,38" fill="#F2D18A"/>` +
    `<path d="M17 6V38M31 10V42" fill="none" ${T}/>` +
    `<polygon points="5,10 17,6 31,10 43,6 43,38 31,42 17,38 5,42" fill="none" ${S}/>` +
    `<path d="M10 35c6-3 4-10 11-11s9-6 13-10" fill="none" stroke="${C.red}" stroke-width="2.6" stroke-dasharray="3.2 3.2" stroke-linecap="round"/>` +
    tube('M33.5 9.5l6 6M39.5 9.5l-6 6', C.red, 2.5),

  seek:
    `<rect x="19.5" y="16" width="9" height="11" rx="2" fill="${C.slate}" ${S}/>` +
    `<rect x="6" y="9" width="14" height="23" rx="4.5" fill="#6A5F8A" ${S}/>` +
    `<rect x="28" y="9" width="14" height="23" rx="4.5" fill="#6A5F8A" ${S}/>` +
    `<circle cx="13" cy="34" r="8.5" fill="${C.slate}" ${S}/>` +
    `<circle cx="35" cy="34" r="8.5" fill="${C.slate}" ${S}/>` +
    `<circle cx="13" cy="34" r="5.2" fill="${C.sky}" ${T}/>` +
    `<circle cx="35" cy="34" r="5.2" fill="${C.sky}" ${T}/>` +
    `<circle cx="11.5" cy="32.5" r="1.7" fill="#fff"/><circle cx="33.5" cy="32.5" r="1.7" fill="#fff"/>` +
    `<rect x="9" y="11.5" width="3" height="10" rx="1.5" ${HI}/>`,

  // ── Parks ───────────────────────────────────────────────────
  'park-mk':
    `<path d="M10 43V24h28v19z" fill="#DDD6F7" ${S}/>` +
    `<path d="M5.5 43V19h9.5v24z" fill="#DDD6F7" ${S}/>` +
    `<path d="M33 43V19h9.5v24z" fill="#DDD6F7" ${S}/>` +
    `<path d="M18 43V15h12v28z" fill="#F1EDFF" ${S}/>` +
    `<path d="M4 19.5L10.25 7l6.25 12.5z" fill="${C.blue}" ${S}/>` +
    `<path d="M31.5 19.5L37.75 7 44 19.5z" fill="${C.blue}" ${S}/>` +
    `<path d="M16 15.5L24 2.5l8 13z" fill="#6A8FFF" ${S}/>` +
    `<path d="M21 43v-6a3 3 0 0 1 6 0v6z" fill="${INK}"/>` +
    `<circle cx="24" cy="23.5" r="2.3" fill="${C.gold}" ${T}/>` +
    `<path d="M7.5 17L10.25 11" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`,

  'park-hs':
    `<circle cx="15" cy="14" r="8" fill="${C.slate}" ${S}/>` +
    `<circle cx="31" cy="14" r="8" fill="${C.slate}" ${S}/>` +
    `<circle cx="15" cy="14" r="2.5" fill="${C.steel}" ${T}/><circle cx="31" cy="14" r="2.5" fill="${C.steel}" ${T}/>` +
    `<polygon points="35,27 44,22 44,42 35,37" fill="${C.blue}" ${S}/>` +
    `<rect x="5" y="22" width="31" height="20" rx="3.5" fill="${C.slateDeep}" ${S}/>` +
    star(20.5, 32, 7, 3, C.gold, T),

  'park-ep':
    tube('M15 35L11 44M33 35L37 44', C.steel, 3) +
    `<rect x="7" y="41.5" width="34" height="4" rx="2" fill="#8E86A8" ${S}/>` +
    `<circle cx="24" cy="21" r="16" fill="#D3DCEE" ${S}/>` +
    `<path d="M10 14L24 8 38 14 38 28 24 34 10 28Z M10 14L24 21 38 14 M10 28L24 21 38 28 M24 8V34" fill="none" stroke="#8A93B0" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<circle cx="24" cy="21" r="16" fill="none" ${S}/>` +
    `<path d="M13 13a13 13 0 0 1 9-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,

  'park-ak':
    `<path d="M19.5 44c1.5-5 1.5-11 0.5-18h8c-1 7-1 13 0.5 18z" fill="${C.wood}" ${S}/>` +
    blob(
      [
        [13, 22, 9],
        [35, 22, 9],
        [24, 14, 12],
        [24, 25, 8],
      ],
      C.leaf,
    ) +
    `<circle cx="19" cy="10" r="3" ${HI}/>` +
    `<circle cx="31" cy="18" r="2" fill="#2E8F4E"/><circle cx="16" cy="24" r="2" fill="#2E8F4E"/>`,

  // ── HUD / navigation ────────────────────────────────────────
  flame:
    `<path d="M24 3c2 7 9 11 12 18 4 9-1 23-12 23S8 34 12 24c2-5 5-6 6-12 3 3 4 6 4 9 2-5 2-11 2-18z" fill="${C.orange}" ${S}/>` +
    `<path d="M24 23c3 4 7 7 7 13a7 7 0 0 1-14 0c0-4 3-6 4-10 1 2 2 3 2 5 1-3 1-5 1-8z" fill="${C.gold}"/>`,

  check:
    `<circle cx="24" cy="24" r="18" fill="${C.green}" ${S}/>` +
    tube('M15.5 24.5l6 6 11-12', '#fff', 4) +
    `<path d="M12 17a14 14 0 0 1 8-7" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>`,

  cards:
    `<g transform="rotate(-14 18 26)"><rect x="8" y="10" width="20" height="28" rx="3.5" fill="${C.purple}" ${S}/>` +
    `<rect x="11.5" y="13.5" width="13" height="21" rx="2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/></g>` +
    `<g transform="rotate(10 30 24)"><rect x="20" y="9" width="20" height="28" rx="3.5" fill="${C.cream}" ${S}/>` +
    `<polygon points="30,15.5 35.5,23 30,30.5 24.5,23" fill="${C.gold}" ${T}/></g>`,

  draft:
    `<g transform="rotate(-22 24 42)"><rect x="14" y="10" width="20" height="28" rx="3.5" fill="${C.blue}" ${S}/></g>` +
    `<g transform="rotate(22 24 42)"><rect x="14" y="10" width="20" height="28" rx="3.5" fill="${C.red}" ${S}/></g>` +
    `<rect x="14" y="7" width="20" height="29" rx="3.5" fill="${C.cream}" ${S}/>` +
    star(24, 21.5, 7, 3, C.gold, T),

  gear:
    `<path d="${gearPath(24, 24, 9, 20, 15.5)}" fill="${C.steel}" ${S}/>` +
    `<circle cx="24" cy="24" r="7" fill="${C.slate}" ${S}/>` +
    `<path d="M13 19a12 12 0 0 1 6-6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`,

  profile:
    `<path d="M7 44c0-10 7-16 17-16s17 6 17 16z" fill="${C.blue}" ${S}/>` +
    `<circle cx="24" cy="17" r="9.5" fill="#FFD9B5" ${S}/>` +
    `<path d="M14.5 16c0-6.5 4.2-10 9.5-10s9.5 3.5 9.5 10c-3-2.2-6-3.2-9.5-3.2s-6.5 1-9.5 3.2z" fill="#7A4A2E" ${S}/>` +
    `<path d="M12 37a10 10 0 0 1 5-5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>`,

  'chevron-down': tube('M15 19l9 9 9-9', '#fff', 4),

  // ── Rewards ─────────────────────────────────────────────────
  trophy:
    tube('M14 12H8c0 8 3 11 8 11M34 12h6c0 8-3 11-8 11', C.goldDeep, 3) +
    `<path d="M13 6h22v12c0 7-5 12-11 12s-11-5-11-12z" fill="${C.gold}" ${S}/>` +
    `<path d="M21 30h6v6h-6z" fill="${C.goldDeep}" ${S}/>` +
    `<rect x="13" y="36" width="22" height="7.5" rx="2" fill="${C.purple}" ${S}/>` +
    `<path d="M17.5 10v8c0 3 1 5 3 7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`,

  medal:
    `<path d="M13 3h8l7 17h-8z" fill="${C.red}" ${S}/>` +
    `<path d="M35 3h-8l-7 17h8z" fill="${C.blue}" ${S}/>` +
    `<circle cx="24" cy="31" r="13" fill="${C.gold}" ${S}/>` +
    `<circle cx="24" cy="31" r="8.5" fill="${C.goldDeep}" stroke="#B07E12" stroke-width="1.5"/>` +
    star(24, 31.5, 5.5, 2.4, C.cream, T),

  coin:
    `<circle cx="24" cy="24" r="18" fill="${C.gold}" ${S}/>` +
    `<circle cx="24" cy="24" r="12.5" fill="none" stroke="#B07E12" stroke-width="2"/>` +
    star(24, 24.5, 7, 3, C.goldDeep, T) +
    `<path d="M12 17a13 13 0 0 1 7-6" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/>`,

  gem:
    `<polygon points="24,43 5,18 13,7 35,7 43,18" fill="${C.blue}" ${S}/>` +
    `<polygon points="13,7 18.5,18 5,18" ${HI}/>` +
    `<path d="M5 18H43M13 7l5.5 11L24 7l5.5 11L35 7M18.5 18L24 43l5.5-25" fill="none" ${T}/>`,

  star: star(24, 25, 20, 8.5, C.gold) + `<polygon points="${BIG_STAR[9]} 24,25 ${BIG_STAR[0]}" ${HI}/>`,

  crown:
    `<path d="M6 36L8 14l9 9 7-14 7 14 9-9 2 22z" fill="${C.gold}" ${S}/>` +
    `<rect x="6" y="34" width="36" height="8" rx="2" fill="${C.goldDeep}" ${S}/>` +
    `<circle cx="8" cy="13.5" r="3" fill="${C.red}" ${T}/><circle cx="40" cy="13.5" r="3" fill="${C.red}" ${T}/>` +
    `<circle cx="24" cy="8.5" r="3.3" fill="${C.blue}" ${T}/>` +
    `<circle cx="24" cy="38" r="2.6" fill="${C.red}" ${T}/>`,

  flag:
    `<rect x="9" y="5" width="4.5" height="39" rx="2" fill="#8E86A8" ${S}/>` +
    `<path d="M13.5 8c6-3 12 3 18 0 3-1.5 6-1 8.5 0v17c-3-1.5-6-1.5-8.5 0-6 3-12-3-18 0z" fill="${C.red}" ${S}/>` +
    star(25.5, 16.5, 5, 2.2, C.gold, T),

  sparkle:
    `<path d="M24 3c2 14 7 19 21 21-14 2-19 7-21 21-2-14-7-19-21-21 14-2 19-7 21-21z" fill="${C.gold}" ${S}/>` +
    `<path d="M24 12c1 6 3 9 7 11" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>`,

  // ── Settings / profile actions ──────────────────────────────
  ruler:
    `<rect x="15" y="3" width="18" height="42" rx="3" fill="${C.gold}" ${S}/>` +
    `<path d="M15 9h8M15 15h5M15 21h8M15 27h5M15 33h8M15 39h5" fill="none" ${T}/>`,

  speaker:
    `<path d="M7 18h8l10-8v28l-10-8H7z" fill="${C.purple}" ${S}/>` +
    tube('M31 18a8 8 0 0 1 0 12M36 13a15 15 0 0 1 0 22', C.blue, 2.5),

  vibrate:
    `<rect x="15" y="5" width="18" height="38" rx="4" fill="${C.slate}" ${S}/>` +
    `<rect x="18.5" y="10" width="11" height="24" rx="1.5" fill="${C.sky}" ${T}/>` +
    `<circle cx="24" cy="38.5" r="1.8" fill="${C.steel}"/>` +
    tube('M9 17v14M41 17v14', C.orange, 2.5) +
    tube('M4 21v6M44 21v6', C.orange, 2),

  bulb:
    `<path d="M18 31h12v5H18z" fill="${C.steel}" ${S}/>` +
    `<path d="M19 36h10v3a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" fill="#8E86A8" ${S}/>` +
    `<path d="M24 4a13 13 0 0 1 8 23.3c-1.4 1.1-2 2.2-2 3.7H18c0-1.5-0.6-2.6-2-3.7A13 13 0 0 1 24 4z" fill="${C.gold}" ${S}/>` +
    `<path d="M20 23l2-4 2 4 2-4 2 4" fill="none" stroke="#E07A16" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="M16 14a9 9 0 0 1 5-6" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/>`,

  sun:
    rays(24, 24, 15, 20.5, 8, C.goldDeep) +
    `<circle cx="24" cy="24" r="10" fill="${C.gold}" ${S}/>` +
    `<path d="M18 21a7 7 0 0 1 4-4" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.2" stroke-linecap="round"/>`,

  moon:
    `<path d="M29 5a19 19 0 1 0 14 26A15 15 0 0 1 29 5z" fill="#FFE08A" ${S}/>` +
    `<circle cx="19" cy="30" r="3" fill="#F2C94C"/><circle cx="25" cy="38" r="2" fill="#F2C94C"/>`,

  pencil:
    `<g transform="rotate(40 24 24)">` +
    `<rect x="19" y="4" width="10" height="7" rx="2" fill="#F09090" ${S}/>` +
    `<rect x="19" y="10" width="10" height="24" fill="${C.gold}" ${S}/>` +
    `<polygon points="19,34 29,34 24,44" fill="#FFD9B5" ${S}/>` +
    `<polygon points="22.6,41 25.4,41 24,44" fill="${INK}"/>` +
    `</g>`,

  trash:
    `<rect x="19" y="5" width="10" height="5" rx="2" fill="${C.steel}" ${S}/>` +
    `<path d="M12 15h24l-2.2 27H14.2z" fill="#8E86A8" ${S}/>` +
    `<rect x="8" y="10" width="32" height="6" rx="2.5" fill="${C.steel}" ${S}/>` +
    `<path d="M20 21v15M28 21v15" fill="none" ${S}/>`,

  swap:
    tube('M11.8 19.6A13 13 0 0 1 34 15.6', C.blue, 4) +
    `<polygon points="39.1,21.7 38.4,10.6 28.4,19" fill="${C.blue}" ${S}/>` +
    tube('M36.2 28.4A13 13 0 0 1 14 32.4', C.blue, 4) +
    `<polygon points="8.9,26.3 9.6,37.4 19.6,29" fill="${C.blue}" ${S}/>`,
};

export type IconName = keyof typeof BODIES;

export const ICON_NAMES = Object.keys(BODIES) as IconName[];

export const ICON_SVG = Object.fromEntries(
  Object.entries(BODIES).map(([name, body]) => [
    name,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${body}</svg>`,
  ]),
) as Record<IconName, string>;
