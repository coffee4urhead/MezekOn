// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              navigationBarColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen 
              name="PDFViewerScreen" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AudioPlayerScreen" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}