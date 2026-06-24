import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionsProvider } from '../hooks/useSessions';
import { ProgramsProvider } from '../hooks/usePrograms';
import { colors } from '../constants/theme';

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Layout racine de l'app : englobe tout dans `GestureHandlerRootView`
 * (requis par `react-native-gesture-handler`/`Swipeable`), fournit les
 * contextes des séances et des programmes (`SessionsProvider`,
 * `ProgramsProvider`), et configure le Stack natif (thème sombre, header
 * masqué pour les tabs, header natif minimal pour les écrans de détail).
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionsProvider>
        <ProgramsProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="session/[id]" options={{ title: '' }} />
            <Stack.Screen name="exercise/[name]" options={{ title: '' }} />
            <Stack.Screen name="program/[id]" options={{ title: '' }} />
          </Stack>
        </ProgramsProvider>
      </SessionsProvider>
    </GestureHandlerRootView>
  );
}
