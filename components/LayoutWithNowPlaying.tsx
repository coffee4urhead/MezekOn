import NowPlayingBar from '@/app/NowPlaying';
import { AudioProvider } from '@/context/AudioContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function LayoutWithNowPlaying() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AudioProvider>
          <ThemeProvider>
            <View style={styles.container}>
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
                  name="ArtickleViewer" 
                  options={{ 
                    presentation: 'modal',
                    headerShown: false,
                  }}
                />
                <Stack.Screen 
                  name="AudioPlayerScreen" 
                  options={{ 
                    presentation: 'card',
                    headerShown: false,
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
              <NowPlayingBar />
            </View>
          </ThemeProvider>
        </AudioProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});