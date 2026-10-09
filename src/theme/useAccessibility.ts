import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

const query = () => Platform.OS === 'web' && typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const snapshot = () => query()?.matches ?? false;
function subscribe(listener: () => void) {
  const media = query(); media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}
export function useReducedMotion() {
  const preference = useGameStore(s => s.settings.reduceMotion);
  const webReduced = useSyncExternalStore(subscribe, snapshot, () => false);
  // Avoid a moving first frame before the native device preference is known.
  const [nativeReduced, setNativeReduced] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setNativeReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setNativeReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return preference === 'on' || (preference !== 'off' && (Platform.OS === 'web' ? webReduced : nativeReduced));
}
export function useReadingPreferences() {
  const { textSize, readableFont, highContrast } = useGameStore(s => s.settings);
  return { readableFont, highContrast, scale: textSize === 'extra-large' ? 1.35 : textSize === 'large' ? 1.18 : 1 };
}
