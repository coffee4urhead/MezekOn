import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity 
      onPress={toggleTheme} 
      style={[
        styles.themeButton,
        {
          top: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 20,
        }
      ]}
    >
      <Text style={{ fontSize: 24, color: isDark ? '#ffffff' : '#000000' }}>
        {isDark ? '☀️' : '🌙'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  themeButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#706d6d18', 
    zIndex: 999, 
  },
});