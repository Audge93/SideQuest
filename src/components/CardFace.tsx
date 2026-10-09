import React from 'react';
import { useReadingPreferences } from '../theme/useAccessibility';
import { View, Text, StyleSheet } from 'react-native';
import { Task } from '../types';
import GameIcon, { IconName } from './icons/GameIcon';
import {
  CATEGORY_COLORS,
  CATEGORY_FRAME_COLORS,
  FONTS,
  INK,
  RARITY,
  TABLE,
} from '../theme/theme';

const PARCHMENT = '#FFF8EC';
const RAY_COUNT = 12;

export const CARD_ASPECT = 1.36;

interface Props {
  task: Task;
  width: number;
  // 'full' shows the task text; 'compact' is art-only for small slots like challenges.
  variant?: 'full' | 'compact';
  descriptionLines?: number;
  highlighted?: boolean;
  children?: React.ReactNode;
}

export default function CardFace({ task, width, variant = 'full', descriptionLines = 5, highlighted, children }: Props) {
  const { highContrast, readableFont } = useReadingPreferences();
  const height = Math.round(width * (variant === 'compact' ? 1.22 : CARD_ASPECT));
  const s = width / 260;
  const frame = CATEGORY_FRAME_COLORS[task.category] ?? '#666';
  const art = CATEGORY_COLORS[task.category] ?? '#AAA';
  const rarity = RARITY[task.difficulty];
  const compact = variant === 'compact';
  const artHeight = Math.round(height * (compact ? 0.62 : 0.42));
  const gem = Math.max(30, Math.round((compact ? 64 : 58) * s));
  const showCoinLabel = gem >= 40;
  const border = Math.max(2, Math.round(3 * s));

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          backgroundColor: frame,
          borderRadius: Math.round(18 * s),
          borderWidth: border,
          borderBottomWidth: border + Math.max(2, Math.round(4 * s)),
          borderColor: highlighted ? TABLE.gold : INK,
          padding: Math.max(3, Math.round(6 * s)),
        },
      ]}
    >
      <View style={[styles.inner, { borderRadius: Math.round(12 * s) }]}>
        <View style={[styles.art, { height: artHeight, backgroundColor: art }]}>
          {Array.from({ length: RAY_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.ray,
                {
                  width: Math.round(22 * s),
                  height: artHeight * 2.4,
                  marginLeft: -Math.round(11 * s),
                  marginTop: -artHeight * 1.2,
                  transform: [{ rotate: `${(i * 180) / RAY_COUNT}deg` }],
                },
              ]}
            />
          ))}
          <View style={[styles.artShade, { height: artHeight * 0.35 }]} />
          <View
            style={[
              styles.iconWell,
              {
                width: Math.round(artHeight * 0.66),
                height: Math.round(artHeight * 0.66),
                borderRadius: Math.round(artHeight * 0.18),
                borderWidth: Math.max(2, Math.round(3 * s)),
                backgroundColor: art,
              },
            ]}
          >
            <GameIcon name={task.category as IconName} size={Math.round(artHeight * 0.56)} />
          </View>
        </View>

        <View style={[styles.ribbonRow, { marginTop: -Math.round(15 * s) }]}>
          <View
            style={[
              styles.ribbon,
              {
                backgroundColor: highContrast ? INK : frame,
                borderWidth: Math.max(1.5, 2.5 * s),
                borderRadius: Math.round(8 * s),
                paddingHorizontal: Math.round(14 * s),
                paddingVertical: Math.round(2 * s),
              },
            ]}
          >
            <Text
              style={[styles.ribbonText, { fontSize: Math.max(10, Math.round(19 * s)), letterSpacing: 1.2 * s }, readableFont && { fontFamily: 'System', fontWeight: '700' }, highContrast && { textShadowColor: 'transparent' }]}
              numberOfLines={1}
            >
              {task.displayCategory.toUpperCase()}
            </Text>
          </View>
        </View>

        {!compact && (
          <View style={[styles.body, { paddingHorizontal: Math.round(12 * s), paddingVertical: Math.round(6 * s) }]}>
            <Text
              style={[styles.description, { fontSize: Math.max(10, Math.round(17 * s)), lineHeight: Math.max(13, Math.round(22 * s)) }]}
              numberOfLines={descriptionLines}
            >
              {task.description}
            </Text>
          </View>
        )}

        <View style={[styles.footer, { paddingHorizontal: Math.round(10 * s), paddingBottom: Math.round(6 * s), gap: Math.round(5 * s) }]}>
          <View
            style={[
              styles.rarityGem,
              {
                width: Math.max(7, Math.round(11 * s)),
                height: Math.max(7, Math.round(11 * s)),
                backgroundColor: rarity.color,
                borderWidth: Math.max(1, 1.5 * s),
              },
            ]}
          />
          {!compact && (
            <Text style={[styles.footerText, { fontSize: Math.max(8, Math.round(12 * s)) }, highContrast && { color: INK }]}>{rarity.label}</Text>
          )}
          {!compact && task.heightRequirement ? (
            <Text style={[styles.footerText, styles.footerRight, { fontSize: Math.max(8, Math.round(12 * s)) }]}>
              {task.heightRequirement}" min
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.coin,
          {
            width: gem,
            height: gem,
            borderRadius: gem / 2,
            borderWidth: border,
            top: -Math.round(10 * s),
            left: -Math.round(10 * s),
          },
        ]}
      >
        <View style={[styles.coinShine, { borderRadius: gem / 2 }]} />
        <Text
          style={[
            styles.coinValue,
            highContrast && { color: INK, textShadowColor: 'transparent' },
            showCoinLabel
              ? { fontSize: Math.round(gem * 0.42), lineHeight: Math.round(gem * 0.46) }
              : { fontSize: Math.round(gem * 0.5), lineHeight: Math.round(gem * 0.6) },
          ]}
        >
          {task.points}
        </Text>
        {showCoinLabel && <Text style={[styles.coinLabel, { fontSize: Math.round(gem * 0.15) }]}>PTS</Text>}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'visible',
  },
  inner: {
    flex: 1,
    backgroundColor: PARCHMENT,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(42, 30, 63, 0.35)',
  },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(42, 30, 63, 0.35)',
  },
  ray: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  artShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42, 30, 63, 0.10)',
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: INK,
  },
  ribbonRow: {
    alignItems: 'center',
  },
  ribbon: {
    borderColor: INK,
    maxWidth: '90%',
  },
  ribbonText: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    color: INK,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  rarityGem: {
    borderColor: INK,
    transform: [{ rotate: '45deg' }],
  },
  footerText: {
    color: 'rgba(42, 30, 63, 0.6)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footerRight: {
    marginLeft: 'auto',
  },
  coin: {
    position: 'absolute',
    backgroundColor: TABLE.gold,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinShine: {
    position: 'absolute',
    top: '8%',
    left: '14%',
    width: '46%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ rotate: '-20deg' }],
  },
  coinValue: {
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  coinLabel: {
    fontFamily: FONTS.display,
    color: INK,
    marginTop: -2,
    letterSpacing: 0.5,
  },
});
