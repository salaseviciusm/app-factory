import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { color, useAppFonts } from '../design';

// The composition root is a module singleton; importing it here wires the app.
import '../context/app-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);
  if (!fontsReady) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pick" />
        <Stack.Screen name="session" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="summary/[sessionId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
