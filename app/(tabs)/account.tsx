import ThemeToggleButton from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: '#0347F2' }]}>За проекта</Text>
          <Text style={[styles.description, { color: isDark ? '#888888' : '#666666' }]}>
            MezekON е речник на диалектни думи от региона на Мезек.
          </Text>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>Цел на проекта</Text>
          <Text style={[styles.text, { color: isDark ? '#888888' : '#666666' }]}>
            Да съхрани и популяризира уникалния диалект на региона.
          </Text>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>Версия</Text>
          <Text style={[styles.text, { color: isDark ? '#888888' : '#666666' }]}>1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});