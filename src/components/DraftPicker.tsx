import { useReducedMotion } from '../theme/useAccessibility';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { Task } from '../types';
import { CATEGORY_FRAME_COLORS, FONTS, INK, RARITY, TABLE } from '../theme/theme';
import { haptic } from '../utils/haptics';
import CardFace, { CARD_ASPECT } from './CardFace';
import GameButton from './GameButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GAP = 10;
const CARD_W = Math.round(Math.min((Math.min(SCREEN_W, 480) - 32 - GAP * 2) / 3, 140));
const CARD_H = Math.round(CARD_W * CARD_ASPECT);

// Spread from -1 (left) to 1 (right) so the fan stays symmetric for 1–3 cards.
function fanPosition(index: number, count: number) {
  return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1;
}

function DraftCard({
  task,
  index,
  count,
  selected,
  dimmed,
  leaving,
  chosen,
  onPress,
}: {
  task: Task;
  index: number;
  count: number;
  selected: boolean;
  dimmed: boolean;
  leaving: boolean;
  chosen: boolean;
  onPress: () => void;
}) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES, true, []);

  const deal = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) { deal.setValue(1); sway.setValue(0.5); return; }
    const entrance = Animated.sequence([
      Animated.delay(120 + index * 110),
      Animated.spring(deal, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]); entrance.start(() => haptic('tap'));
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1500 + index * 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1500 + index * 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { entrance.stop(); loop.stop(); };
  }, [reduced]);

  useEffect(() => {
    if (reduced) { lift.setValue(selected ? 1 : 0); return; }
    const animation = Animated.spring(lift, { toValue: selected ? 1 : 0, friction: 5, tension: 180, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [selected, reduced]);

  useEffect(() => {
    if (!leaving) return;
    if (reduced) { exit.setValue(1); return; }
    Animated.timing(exit, {
      toValue: 1,
      duration: chosen ? 460 : 300,
      easing: chosen ? Easing.in(Easing.back(1.4)) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [leaving, reduced]);

  const fan = fanPosition(index, count);
  const baseRot = fan * 6;
  const baseLift = Math.abs(fan) * 10;

  const rotate = Animated.add(
    sway.interpolate({ inputRange: [0, 1], outputRange: [baseRot - 1.5, baseRot + 1.5] }),
    lift.interpolate({ inputRange: [0, 1], outputRange: [0, -baseRot] }),
  ).interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

  const translateY = Animated.add(
    Animated.add(
      deal.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.6, baseLift] }),
      sway.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }),
    ),
    Animated.add(
      lift.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }),
      exit.interpolate({ inputRange: [0, 1], outputRange: [0, chosen ? SCREEN_H * 0.55 : -40] }),
    ),
  );

  const scale = Animated.multiply(
    lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
    exit.interpolate({ inputRange: [0, 1], outputRange: [1, chosen ? 0.75 : 0.6] }),
  );

  return (
    <Pressable testID="draft-option" accessibilityRole="button" accessibilityLabel={`${task.displayCategory}: ${task.description}, ${task.points} points`} accessibilityState={{ selected }} onPress={onPress} disabled={leaving}>
      <Animated.View
        style={[
          {
            opacity: Animated.multiply(
              deal.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
              exit.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, chosen ? 1 : 0, 0] }),
            ),
            transform: [
              { perspective: 900 },
              { translateY },
              { rotateY: deal.interpolate({ inputRange: [0, 1], outputRange: ['100deg', '0deg'] }) },
              { rotate },
              { scale },
            ],
          },
          selected && styles.cardGlow,
          dimmed && !leaving && styles.cardDimmed,
        ]}
      >
        <CardFace task={task} width={CARD_W} descriptionLines={4} highlighted={selected} />
      </Animated.View>
    </Pressable>
  );
}

export default function DraftPicker({ options, onChoose }: { options: Task[]; onChoose: (taskId: string) => void }) {
  const { colors: COLORS, table: TABLE, dark } = useAppTheme();
  const reduced = useReducedMotion();
  const styles = useThemedStyles(BASE_STYLES, true, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;
  const panel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) { intro.setValue(1); return; }
    const animation = Animated.timing(intro, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [reduced]);

  useEffect(() => {
    if (reduced) { panel.setValue(selectedId ? 1 : 0); return; }
    const animation = Animated.spring(panel, { toValue: selectedId ? 1 : 0, friction: 7, tension: 120, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [selectedId, reduced]);

  const selected = options.find(t => t.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    if (leaving) return;
    haptic('select');
    setSelectedId(prev => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (!selectedId || leaving) return;
    haptic('thud');
    if (reduced) { onChoose(selectedId); return; }
    setLeaving(true);
    Animated.timing(intro, { toValue: 0, duration: 380, delay: 160, useNativeDriver: true }).start();
    setTimeout(() => onChoose(selectedId), 520);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => {}}>
      <Animated.View style={[styles.scrim, { opacity: intro }]} />
      <ScrollView accessibilityViewIsModal contentContainerStyle={[styles.content, { backgroundColor: COLORS.surface, flexGrow: 1, flex: undefined, paddingVertical: 28 }]} style={{ flex: 1 }}>
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: intro,
            transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }}
        >
          <View style={styles.kickerPill}>
            <Text style={styles.kicker}>A SLOT OPENED UP</Text>
          </View>
          <Text style={styles.title}>Choose Your Next Quest</Text>
          <Text style={[styles.subtitle, { color: COLORS.textBody }]}>Pick 1 of {options.length}</Text>
        </Animated.View>

        <View style={styles.row}>
          {options.map((task, i) => (
            <DraftCard
              key={task.id}
              task={task}
              index={i}
              count={options.length}
              selected={task.id === selectedId}
              dimmed={!!selectedId && task.id !== selectedId}
              leaving={leaving}
              chosen={task.id === selectedId}
              onPress={() => handleSelect(task.id)}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.panel,
            {
              opacity: Animated.multiply(panel, intro),
              transform: [{ translateY: panel.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
          pointerEvents={selected ? 'auto' : 'none'}
        >
          {selected && (
            <>
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: CATEGORY_FRAME_COLORS[selected.category] }]}>
                  <Text style={styles.tagText}>{selected.displayCategory}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: RARITY[selected.difficulty].color }]}>
                  <Text style={styles.tagText}>{RARITY[selected.difficulty].label}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: TABLE.gold }]}>
                  <Text style={styles.tagText}>{selected.points} pts</Text>
                </View>
              </View>
              <Text style={styles.panelDesc}>{selected.description}</Text>
              <GameButton testID="add-to-hand" label="Add to Hand" tone="green" size="lg" onPress={handleConfirm} disabled={leaving} style={styles.confirm} />
            </>
          )}
        </Animated.View>

        {!selected && <Animated.Text style={[styles.hint, { opacity: intro, color: COLORS.textBody }]}>Tap a card to inspect it</Animated.Text>}
      </ScrollView>
    </Modal>
  );
}

const BASE_STYLES = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 9, 28, 0.9)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  kickerPill: {
    backgroundColor: TABLE.panel,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 8,
  },
  kicker: {
    fontFamily: FONTS.display,
    color: TABLE.gold,
    fontSize: 13,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 30,
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginTop: 30,
    marginBottom: 18,
    height: CARD_H + 44,
    alignItems: 'center',
  },
  cardGlow: {
    shadowColor: TABLE.gold,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cardDimmed: {
    opacity: 0.5,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    minHeight: 160,
    alignItems: 'center',
    gap: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: INK,
  },
  tagText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 0,
  },
  panelDesc: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirm: {
    flexGrow: 0,
    alignSelf: 'stretch',
    marginHorizontal: 40,
    marginTop: 4,
  },
  hint: {
    position: 'absolute',
    bottom: '16%',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '800',
  },
});
