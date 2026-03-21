import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigation/AppNavigator';
import SplashAnimation from './src/components/SplashAnimation';
import { useGameStore } from './src/store/gameStore';

enableScreens();

function AppLoader() {
  const loadFromStorage = useGameStore(s => s.loadFromStorage);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <View style={styles.root}>
      <AppNavigator />
      {showSplash && <SplashAnimation onFinish={() => setShowSplash(false)} />}
    </View>
  );
}

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
