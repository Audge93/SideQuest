import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform, Modal, View, Text, ScrollView } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { useReadingPreferences, useReducedMotion } from '../theme/useAccessibility';
import GameButton from './GameButton';

export function FocusHeading({ title }: { title: string }) {
  const ref = useRef<Text>(null);
  const { colors } = useAppTheme();
  const { scale } = useReadingPreferences();
  useEffect(() => {
    const previous = Platform.OS === 'web' && typeof document !== 'undefined' ? document.activeElement as HTMLElement : null;
    const frame = requestAnimationFrame(() => {
      if (Platform.OS === 'web') (ref.current as any)?.focus?.();
      else { const node = findNodeHandle(ref.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }
    });
    return () => { cancelAnimationFrame(frame); if (previous?.isConnected) previous.focus?.(); };
  }, [title]);
  return <Text ref={ref} accessibilityRole="header" accessible {...(Platform.OS === 'web' ? { tabIndex: -1 } as any : {})}
    style={{ fontSize: 24 * scale, fontWeight: '700', color: colors.textDark }}>{title}</Text>;
}
export default function ReadingModal({ title, children, onClose, testID = 'reading-panel' }: {
  title: string; children: React.ReactNode; onClose: () => void; testID?: string;
}) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  return <Modal transparent visible animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <View testID={testID} accessibilityViewIsModal style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 18, maxHeight: '92%', gap: 16 }}>
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
          <FocusHeading title={title} />{children}
        </ScrollView>
        <GameButton testID="reading-close" label="Close" onPress={onClose} tone="blue" style={{ flexGrow: 0 }} />
      </View>
    </View>
  </Modal>;
}
