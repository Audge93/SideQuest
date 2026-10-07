import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { Task } from '../types';
import { COLORS, CATEGORY_COLORS, CATEGORY_ICON_IMAGES } from '../theme/theme';
import { haptic } from '../utils/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const sw = SCREEN_W / 390;

const GAP = Math.round(10 * sw);
const CARD_W = Math.round(Math.min((Math.min(SCREEN_W, 480) - 32 - GAP * 2) / 3, 140));
const CARD_H = Math.round(CARD_W * 1.5);
// Spread from -1 (left) to 1 (right) so the fan stays symmetric for 1–3 cards.
function fanPosition(index: number, count: number) {
  return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1;
}
const GOLD = '#FFD45C';
const INK = '#2D2140';

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

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
  const color = CATEGORY_COLORS[task.category] ?? '#888';
  const deal = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120 + index * 110),
      Animated.spring(deal, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start(() => haptic('tap'));
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1500 + index * 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1500 + index * 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    Animated.spring(lift, { toValue: selected ? 1 : 0, friction: 5, tension: 180, useNativeDriver: true }).start();
  }, [selected]);

  useEffect(() => {
    if (!leaving) return;
    Animated.timing(exit, {
      toValue: 1,
      duration: chosen ? 460 : 300,
      easing: chosen ? Easing.in(Easing.back(1.4)) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [leaving]);

  const fan = fanPosition(index, count);
  const baseRot = fan * 6;
  const baseLift = Math.abs(fan) * 8;
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
      lift.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }),
      exit.interpolate({ inputRange: [0, 1], outputRange: [0, chosen ? SCREEN_H * 0.55 : -40] }),
    ),
  );

  const scale = Animated.multiply(
    lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
    exit.interpolate({ inputRange: [0, 1], outputRange: [1, chosen ? 0.75 : 0.6] }),
  );

  return (
    <Pressable onPress={onPress} disabled={leaving}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: selected ? GOLD : INK,
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
          selected && styles.cardSelected,
          dimmed && !leaving && styles.cardDimmed,
        ]}
      >
        <View style={[styles.cardHeader, { backgroundColor: color }]}>
          <Text style={styles.cardHeaderText} numberOfLines={1}>{task.displayCategory}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={[styles.iconOuter, { backgroundColor: color }]}>
            <Image source={CATEGORY_ICON_IMAGES[task.category]} style={styles.iconImage} resizeMode="contain" />
          </View>
          <Text style={styles.cardDesc} numberOfLines={4}>{task.description}</Text>
        </View>
        <View style={[styles.ptsBar, { backgroundColor: color }]}>
          <Text style={styles.ptsText}>{task.points}</Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function DraftPicker({ options, onChoose }: { options: Task[]; onChoose: (taskId: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;
  const panel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(panel, { toValue: selectedId ? 1 : 0, friction: 7, tension: 120, useNativeDriver: true }).start();
  }, [selectedId]);

  const selected = options.find(t => t.id === selectedId) ?? null;
  const selectedColor = selected ? CATEGORY_COLORS[selected.category] ?? '#888' : GOLD;

  const handleSelect = (id: string) => {
    if (leaving) return;
    haptic('select');
    setSelectedId(prev => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (!selectedId || leaving) return;
    haptic('thud');
    setLeaving(true);
    Animated.timing(intro, { toValue: 0, duration: 380, delay: 160, useNativeDriver: true }).start();
    setTimeout(() => onChoose(selectedId), 520);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => {}}>
      <Animated.View style={[styles.scrim, { opacity: intro }]} />
      <View style={styles.content} pointerEvents="box-none">
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: intro,
            transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }}
        >
          <Text style={styles.kicker}>A SLOT OPENED UP</Text>
          <Text style={styles.title}>Choose Your Next Quest</Text>
          <Text style={styles.subtitle}>Pick 1 of {options.length}</Text>
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
              <View style={[styles.panelTag, { backgroundColor: selectedColor }]}>
                <Text style={styles.panelTagText}>
                  {selected.displayCategory} · {DIFFICULTY_LABEL[selected.difficulty]} · {selected.points} pts
                </Text>
              </View>
              <Text style={styles.panelDesc}>{selected.description}</Text>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85} disabled={leaving}>
                <Text style={styles.confirmText}>Add to Hand</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {!selected && (
          <Animated.Text style={[styles.hint, { opacity: intro }]}>Tap a card to inspect it</Animated.Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 14, 42, 0.86)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  kicker: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    color: COLORS.white,
    fontSize: Math.round(26 * Math.min(sw, 1.2)),
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginTop: 34,
    marginBottom: 22,
    height: CARD_H + 40,
    alignItems: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 3,
    borderBottomWidth: 6,
    overflow: 'hidden',
  },
  cardSelected: {
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cardDimmed: {
    opacity: 0.55,
  },
  cardHeader: {
    paddingVertical: 5,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    gap: 6,
  },
  iconOuter: {
    width: Math.round(CARD_W * 0.38),
    height: Math.round(CARD_W * 0.38),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: Math.round(CARD_W * 0.31),
    height: Math.round(CARD_W * 0.31),
  },
  cardDesc: {
    color: COLORS.textDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  ptsBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  ptsText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  ptsLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    minHeight: 150,
    alignItems: 'center',
    gap: 10,
  },
  panelTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  panelTagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  panelDesc: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmBtn: {
    marginTop: 4,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: INK,
    borderBottomWidth: 6,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  confirmText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  hint: {
    position: 'absolute',
    bottom: '18%',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '700',
  },
});
