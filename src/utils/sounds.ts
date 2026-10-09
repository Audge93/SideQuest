export type SoundKind = 'tap' | 'select' | 'success' | 'thud';
let listener: ((kind: SoundKind) => void) | null = null;

export function registerSoundPlayer(play: (kind: SoundKind) => void) {
  listener = play;
  return () => { if (listener === play) listener = null; };
}

export function playSound(kind: SoundKind) { listener?.(kind); }
