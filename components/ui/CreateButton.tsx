import { useTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

export default function CreateButton() {
  const { isDark } = useTheme();
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const createButtonImage = require('@/assets/icons/pencil.png');

  const handleOptionPress = (option: string) => {
    setIsPopoverVisible(false);
    console.log(`Selected: ${option}`);
  };

  return (
    <Popover
      isVisible={isPopoverVisible}
      onRequestClose={() => setIsPopoverVisible(false)}
      from={(
        <TouchableOpacity 
          style={styles.createButtonContainer} 
          activeOpacity={0.7}
          onPress={() => setIsPopoverVisible(true)}
          accessibilityLabel="Create new item"
        >
          <Image
            source={createButtonImage}
            style={styles.pencilImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      placement={PopoverPlacement.TOP}
      popoverStyle={[
        styles.popoverContainer,
        { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }
      ]}
    >
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionItem} 
          onPress={() => handleOptionPress('Add Post')}
        >
          <Text style={[styles.optionText, { color: isDark ? '#ffffff' : '#333333' }]}>
            📝 Добави статия
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem} 
          onPress={() => handleOptionPress('Add Event')}
        >
          <Text style={[styles.optionText, { color: isDark ? '#ffffff' : '#333333' }]}>
            📅 Добави събитие
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem} 
          onPress={() => handleOptionPress('Add Word')}
        >
          <Text style={[styles.optionText, { color: isDark ? '#ffffff' : '#333333' }]}>
            📖 Добави дума
          </Text>
        </TouchableOpacity>
      </View>
    </Popover>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0347F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  pencilImage: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  },
  popoverContainer: {
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionsContainer: {
    minWidth: 180,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});