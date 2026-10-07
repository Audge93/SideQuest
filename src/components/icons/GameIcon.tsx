import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ICON_SVG, IconName } from './iconData';

export type { IconName } from './iconData';

interface Props {
  name: IconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function GameIcon({ name, size = 28, style }: Props) {
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <SvgXml xml={ICON_SVG[name]} width={size} height={size} />
    </View>
  );
}

export default React.memo(GameIcon);

const CATEGORY_BADGES: Record<string, IconName> = {
  'sharp-eye': 'find',
  shutterbug: 'photo',
  'brain-box': 'trivia',
  'scene-stealer': 'act',
  'thrill-seeker': 'ride',
  foodie: 'treat',
  'pin-pro': 'pins',
  'star-struck': 'meet',
  trailblazer: 'explore',
  'treasure-hunter': 'seek',
};

const SCORE_BADGES: Record<string, IconName> = {
  'score-bronze': 'coin',
  'score-silver': 'gem',
  'score-gold': 'star',
  'score-platinum': 'crown',
};

// Badge icons are chosen by id so older saves (which stored emoji) get the new art too.
export function badgeIconName(badgeId: string): IconName {
  const base = badgeId.replace(/-(bronze|silver|gold|platinum)$/, '');
  if (CATEGORY_BADGES[base]) return CATEGORY_BADGES[base];
  if (SCORE_BADGES[badgeId]) return SCORE_BADGES[badgeId];
  if (base === 'first-steps') return 'flag';
  if (base === 'streak') return 'flame';
  if (base === 'hopper') return 'park-mk';
  if (base === 'completionist') return 'trophy';
  return 'medal';
}
