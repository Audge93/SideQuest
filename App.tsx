/**
 * App.tsx — Root entry point for Side Quest
 *
 * Sets up gesture handling, loads persisted state from AsyncStorage,
 * and renders the splash animation overlay on top of the main navigator.
 * The splash plays once on launch, then unmounts to reveal the app.
 */

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useFonts, LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import AppNavigator from './src/navigation/AppNavigator';
import SplashAnimation from './src/components/SplashAnimation';
import { useGameStore } from './src/store/gameStore';

enableScreens();

/**
 * AppLoader — Hydrates saved game state and manages the splash screen lifecycle.
 * The splash overlay sits above the navigator via absolute positioning so the
 * app is ready underneath when the animation finishes.
 */
function AppLoader() {
  const loadFromStorage = useGameStore(s => s.loadFromStorage);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({ LilitaOne_400Regular });

  // Load persisted game state on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <View style={styles.root}>
      {(fontsLoaded || fontError) && <AppNavigator />}
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
