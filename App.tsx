/**
 * App.tsx — Root entry point for Side Quest
 *
 * Sets up gesture handling, loads persisted state from AsyncStorage,
 * and renders the splash animation overlay on top of the main navigator.
 * The splash plays once on launch, then unmounts to reveal the app.
 */

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { useFonts, FontDisplay } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import SplashAnimation from './src/components/SplashAnimation';
import { useGameStore } from './src/store/gameStore';
import { useSoundEffects } from './src/utils/useSoundEffects';

enableScreens();

/**
 * AppLoader — Hydrates saved game state and manages the splash screen lifecycle.
 * The splash overlay sits above the navigator via absolute positioning so the
 * app is ready underneath when the animation finishes.
 */
function AppLoader() {
  useSoundEffects();
  const loadFromStorage = useGameStore(s => s.loadFromStorage);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne_400Regular: { uri: LilitaOne_400Regular, display: FontDisplay.SWAP },
  });
  // On web, never block on the font: Safari can be slow or skip web fonts entirely,
  // which left a blank screen. Text swaps to the game font when it arrives.
  const ready = Platform.OS === 'web' || fontsLoaded || !!fontError;

  // Load persisted game state on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <View style={styles.root}>
      {ready && <AppNavigator />}
      {/* Splash animation overlay — unmounts after animation completes */}
      {showSplash && <SplashAnimation onFinish={() => setShowSplash(false)} />}
    </View>
  );
}

/** Root component — wraps everything in GestureHandlerRootView for react-native-gesture-handler */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppLoader />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
