import { useEffect } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useGameStore } from '../store/gameStore';
import { registerSoundPlayer } from './sounds';

export function useSoundEffects() {
  const tap = useAudioPlayer(require('../../assets/sounds/tap.wav'));
  const select = useAudioPlayer(require('../../assets/sounds/select.wav'));
  const success = useAudioPlayer(require('../../assets/sounds/success.wav'));
  const thud = useAudioPlayer(require('../../assets/sounds/thud.wav'));
  const enabled = useGameStore(s => s.settings.soundEnabled);

  useEffect(() => {
    const players = { tap, select, success, thud };
    Object.values(players).forEach(player => { player.volume = 0.35; });
    // Short effects respect silent mode and don't interrupt the player's music.
    void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
    const unregister = registerSoundPlayer(kind => {
      if (!useGameStore.getState().settings.soundEnabled || AppState.currentState !== 'active') return;
      const player = players[kind];
      void player.seekTo(0).then(() => {
        if (useGameStore.getState().settings.soundEnabled && AppState.currentState === 'active') player.play();
      }).catch(() => {});
    });
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') Object.values(players).forEach(player => player.pause());
    });
    return () => { unregister(); subscription.remove(); };
  }, [tap, select, success, thud]);

  useEffect(() => {
    if (!enabled) [tap, select, success, thud].forEach(player => player.pause());
  }, [enabled, tap, select, success, thud]);
}
