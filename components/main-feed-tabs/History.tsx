import { useTheme } from '@/context/ThemeContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CreateButton, { CreationScreen } from '../ui/CreateButton';

export default function History() {
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
          📜 История на диалекта
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Историята на диалекта в регион Мезек датира от векове. 
            Тук ще намерите статии и изследвания за развитието на местния говор.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
          📚 Архивни материали
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Разгледайте архивни материали, документи и свидетелства за 
            диалекта на Мезек през различните исторически периоди.
          </Text>
        </View>
        </ScrollView>

        <CreateButton creationScreen={CreationScreen.History}/>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
});