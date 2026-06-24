import ThemeToggleButton from '@/components/CustomHeader';
import CurrentlyHot from '@/components/main-feed-tabs/CurrentlyHot';
import Events from '@/components/main-feed-tabs/Events';
import History from '@/components/main-feed-tabs/History';
import News from '@/components/main-feed-tabs/News';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View } from 'react-native';

const TopTab = createMaterialTopTabNavigator();

export default function EventsScreen() {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <TopTab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#0347F2',
          },
          tabBarLabelStyle: {
            fontWeight: '600',
            fontSize: 14,
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
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: Fonts.rounded,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  articleCard: {
    backgroundColor: 'rgba(3, 71, 242, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  articleText: {
    fontSize: 14,
    lineHeight: 20,
  },
});