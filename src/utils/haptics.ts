import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { playSound } from './sounds';

type HapticKind = 'tap' | 'select' | 'success' | 'thud';

export function haptic(kind: HapticKind) {
  playSound(kind);
  if (Platform.OS === 'web' || !useGameStore.getState().settings.hapticsEnabled) return;
  switch (kind) {
    case 'tap':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'select':
      Haptics.selectionAsync();
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'thud':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
  }
}
