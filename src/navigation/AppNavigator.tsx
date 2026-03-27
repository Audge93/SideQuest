/**
 * AppNavigator.tsx — Navigation structure
 *
 * Sets up bottom tab navigation with 4 tabs: Home (🏰), Game (SQ mini card),
 * Settings (⚙️), and Profile (👤). Wrapped in a native stack navigator for
 * potential future screen pushes. The tab bar is semi-transparent and absolute-
 * positioned at the bottom of the screen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/theme';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** Standard emoji-based tab icon with focus highlight */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
    </View>
  );
}

/** Custom SQ card icon for the Game tab — shows a mini playing card with S/Q logo */
function MiniCardIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <View style={[styles.miniCard, focused && styles.miniCardFocused]}>
        <Text style={styles.miniCardS}>S</Text>
        <View style={styles.miniCardLine} />
        <Text style={styles.miniCardQ}>Q</Text>
      </View>
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏰" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{
          tabBarIcon: ({ focused }) => <MiniCardIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Game" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Settings" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 6,
    height: 62,
    position: 'absolute' as const,
  },
  tabIconContainer: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabIconFocused: {
    backgroundColor: 'rgba(76,191,114,0.15)',
  },
  tabEmoji: {
    fontSize: 20,
  },
  miniCard: {
    width: 22,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#F3EEFA',
    borderWidth: 1.5,
    borderColor: '#D4C4EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  miniCardFocused: {
    borderColor: '#9B7FD4',
    backgroundColor: '#EDE5F7',
  },
  miniCardS: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B8A9D4',
    letterSpacing: 1,
    lineHeight: 11,
  },
  miniCardLine: {
    width: 12,
    height: 1,
    backgroundColor: '#D4C4EE',
    marginVertical: 1,
    borderRadius: 1,
  },
  miniCardQ: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9B7FD4',
    letterSpacing: 1,
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelFocused: {
    color: COLORS.green,
    fontWeight: '700',
  },
});
