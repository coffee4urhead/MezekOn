import ThemeToggleButton from '@/components/CustomHeader';
import CurrentlyHot from '@/components/main-feed-tabs/CurrentlyHot';
import Events from '@/components/main-feed-tabs/Events';
import History from '@/components/main-feed-tabs/History';
import News from '@/components/main-feed-tabs/News';
import { useTheme } from '@/context/ThemeContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

const TopTab = createMaterialTopTabNavigator();

export default function EventsScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeToggleButton />
      <TopTab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#0347F2',
            height: 3,
          },
          tabBarLabelStyle: {
            fontWeight: '600',
            fontSize: 14,
            textTransform: 'capitalize',
          },
          tabBarActiveTintColor: '#0347F2',
          tabBarInactiveTintColor: isDark ? '#888888' : '#999999',
        }}
      >
        <TopTab.Screen name="Най-ново" component={CurrentlyHot} />
        <TopTab.Screen name="История" component={History} />
        <TopTab.Screen name="Новини" component={News} />
        <TopTab.Screen name="Събития" component={Events} />
      </TopTab.Navigator>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  // ... rest of your styles
});