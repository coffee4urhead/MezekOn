import ThemeToggleButton from '@/components/CustomHeader';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, Text, View } from 'react-native';

// Create the TopTab navigator instance
const TopTab = createMaterialTopTabNavigator();

// Create the sub-screen components
function SubScreen1() {
  const { isDark } = useTheme();
  return (
            <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📅 Актуални събития
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Следете тази страница за най-новите събития и статии свързани с диалекта на регион Мезек.
          </Text>
        </View>
  );
}

function SubScreen2() {
  const { isDark } = useTheme();
  return (
    <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📰 Последни статии
          </Text>
          <View style={styles.articleCard}>
            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Диалектните думи на Мезек
            </Text>
            <Text style={[styles.articleDate, { color: isDark ? '#888888' : '#999999' }]}>
              15 Март 2024
            </Text>
            <Text style={[styles.articleText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Изследване на уникалните диалектни думи, характерни за региона на Мезек...
            </Text>
          </View>
          
          <View style={styles.articleCard}>
            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Културно наследство
            </Text>
            <Text style={[styles.articleDate, { color: isDark ? '#888888' : '#999999' }]}>
              10 Март 2024
            </Text>
            <Text style={[styles.articleText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Запазване на културното наследство чрез диалектния речник MezekON...
            </Text>
          </View>
        </View>
  );
}

function SubScreen3() {
  const { isDark } = useTheme();
  return (
    <View style={{ padding: 20 }}>
              <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            🎯 Предстоящи събития
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Скоро ще бъдат обявени нови събития. Очаквайте информация!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📚 Минали събития
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Вижте архива с минали събития и статии, свързани с MezekON.
          </Text>
        </View>
    </View>
  );
}

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
        <TopTab.Screen name="Най-ново" component={SubScreen1} />
        <TopTab.Screen name="История" component={SubScreen2} />
        <TopTab.Screen name="Новини" component={SubScreen3} />
        <TopTab.Screen name="Събития" component={SubScreen3} />
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
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