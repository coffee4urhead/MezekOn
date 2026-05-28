import ThemeToggleButton from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

export default function DictionaryScreen() {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <View style={styles.content}>
        <Text style={[styles.text, { color: isDark ? '#ffffff' : '#000000' }]}>
          Dictionary content will appear here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
  },
});