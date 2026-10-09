import { useMemo, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { COLORS, TABLE } from './theme';

const DARK_COLORS: typeof COLORS = {
  ...COLORS,
  bg: '#171222', bgLight: '#171222', surface: '#292136', surfaceSecondary: '#352B44',
  cardBg: '#292136', textDark: '#FFF8EC', textBody: '#E4DCEC', textMuted: '#B9ACC9', textLight: '#B9ACC9',
  borderLight: '#473B56', borderMedium: '#625373', borderPanel: '#625373',
  greenDark: '#90E0B1', blueDark: '#A9CAFF', goldDark: '#E7CA72',
};
const LIGHT_COLORS: typeof COLORS = { ...COLORS, textMuted: '#626C7B', textLight: '#626C7B' };
const LIGHT_TABLE: typeof TABLE = { ...TABLE, felt: '#F4EFE7', panel: '#FFF8EC', panelLight: '#E9E1F0' };

const webSystemSnapshot = () => Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
function subscribeWebSystem(listener: () => void) {
  if (typeof window === 'undefined' || Platform.OS !== 'web') return () => {};
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

export function useAppTheme() {
  const preference = useGameStore(s => s.settings.darkMode);
  const system = useColorScheme();
  const webSystemDark = useSyncExternalStore(subscribeWebSystem, webSystemSnapshot, () => false);
  const systemDark = Platform.OS === 'web' ? webSystemDark : system === 'dark';
  const dark = preference === 'dark' || (preference === 'system' && systemDark);
  return { dark, colors: dark ? DARK_COLORS : LIGHT_COLORS, table: dark ? TABLE : LIGHT_TABLE };
}

// Recolor existing shared styles without changing card artwork or action colors.
// Text placed on saturated action surfaces stays white via keepWhite.
export function useThemedStyles<T extends Record<string, any>>(base: T, table = false, keepWhite: string[] = []): T {
  const { dark, colors } = useAppTheme();
  return useMemo(() => StyleSheet.create(Object.fromEntries(Object.entries(base).map(([name, style]) => {
    const next = { ...style };
    for (const key of ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderBottomColor']) {
      const value = style[key];
      if (typeof value !== 'string') continue;
      if (!table) {
        const tokens = key === 'color' ? ['textDark', 'textBody', 'textMuted', 'textLight']
          : ['bg', 'bgLight', 'surface', 'surfaceSecondary', 'cardBg', 'borderLight', 'borderMedium', 'borderPanel'];
        const token = tokens.find(t => COLORS[t as keyof typeof COLORS] === value);
        if (token) next[key] = colors[token as keyof typeof COLORS];
        if (key === 'color' && value === COLORS.greenDark) next[key] = dark ? '#90E0B1' : '#237749';
        if (key === 'color' && value === COLORS.blue) next[key] = dark ? '#A9CAFF' : '#2257B3';
        if (key === 'color' && value === COLORS.goldDark) next[key] = dark ? '#E7CA72' : '#806012';
      } else if (!dark) {
        if (key === 'backgroundColor') {
          if (value === TABLE.panel) next[key] = LIGHT_TABLE.panel;
          if (value === TABLE.panelLight) next[key] = LIGHT_TABLE.panelLight;
          if (value === TABLE.felt) next[key] = LIGHT_TABLE.felt;
        }
        if (key === 'color' && !keepWhite.includes(name)) {
          if (/^#fff(?:fff)?$/i.test(value) || value.startsWith('rgba(255, 255, 255,')) next[key] = COLORS.textDark;
          if (value === TABLE.gold) next[key] = '#806012';
        }
        if (style.textShadowColor && !keepWhite.includes(name)) next.textShadowColor = 'transparent';
      }
    }
    if (table && name === 'backgroundTint') next.backgroundColor = dark ? 'rgba(18, 11, 36, 0.64)' : 'rgba(255, 248, 236, 0.9)';
    return [name, next];
  }))) as T, [base, dark, table, colors, keepWhite.join(',')]);
}
