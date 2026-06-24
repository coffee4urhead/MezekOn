import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

export default function Events() {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
});