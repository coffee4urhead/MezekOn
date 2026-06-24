import { useTheme } from '@/context/ThemeContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CreateButton, { CreationScreen } from '../ui/CreateButton';

export default function News() {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
      <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
          📰 Новини
        </Text>
        <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
          Актуални новини и събития, свързани с MezekON и диалекта на регион Мезек.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
          📢 Обявления
        </Text>
        <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
          Следете за нови обявления, събития и инициативи, свързани с 
          опазването и популяризирането на местния диалект.
        </Text>
      </View>
      </ScrollView>

    <CreateButton creationScreen={CreationScreen.News}/>
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
    scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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