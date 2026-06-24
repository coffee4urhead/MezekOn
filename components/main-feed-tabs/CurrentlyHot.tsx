import { useTheme } from '@/context/ThemeContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CreateButton from '../ui/CreateButton';

export default function CurrentlyHot() {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📅 Актуални събития
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Следете тази страница за най-новите събития и статии свързани с диалекта на регион Мезек.
          </Text>
        </View>

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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📚 Исторически статии
          </Text>
          <View style={styles.articleCard}>
            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Историята на диалекта
            </Text>
            <Text style={[styles.articleDate, { color: isDark ? '#888888' : '#999999' }]}>
              5 Март 2024
            </Text>
            <Text style={[styles.articleText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Проследяване на развитието на диалекта в региона през последните 100 години...
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            🎯 Предстоящи събития
          </Text>
          <View style={styles.articleCard}>
            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Работилница за диалект
            </Text>
            <Text style={[styles.articleDate, { color: isDark ? '#888888' : '#999999' }]}>
              25 Март 2024
            </Text>
            <Text style={[styles.articleText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Заповядайте на работилница за изучаване и запазване на диалекта...
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📖 Нови публикации
          </Text>
          <View style={styles.articleCard}>
            <Text style={[styles.articleTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Речник на диалектните думи
            </Text>
            <Text style={[styles.articleDate, { color: isDark ? '#888888' : '#999999' }]}>
              1 Март 2024
            </Text>
            <Text style={[styles.articleText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Нова версия на речника с над 500 нови думи и изрази...
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <CreateButton />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  bottomSpacing: {
    height: 50,
  },
});