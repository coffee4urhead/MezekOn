import { useTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import UploadAudio from '../modals/AudioUploadComponent';
import UploadHistoryArchive from '../modals/HistoryUploadArchive';

export enum CreationScreen {
    'History', 'News', 'Events'
}

interface CreateButtonProps {
    creationScreen: CreationScreen
}

export default function CreateButton({ creationScreen }: CreateButtonProps) {
  const { isDark } = useTheme();
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [optionModalUploadVisible, setOptionModalVisibilty] = useState<boolean>(false);
  
  const createButtonImage = require('@/assets/icons/pencil.png');

  const handleOptionPress = (option: string) => {
    setIsPopoverVisible(false);
    setSelectedAction(option);
    
    switch(option) {
      case "Add Archive":
        setOptionModalVisibilty(true);
        break;
      case "Add Audio":
        setOptionModalVisibilty(true);
        break;
      default:
        console.log("Something went wrong! Wrong option pressed!");
        break;
    }
    console.log(`Selected: ${option}`);
  };

  const getOptions = () => {
    switch (creationScreen) {
      case CreationScreen.History:
        return [
          { id: 'add_post', label: '📝 Добави архив', action: 'Add Archive' },
          { id: 'add_event', label: '📅 Добави аудио', action: 'Add Audio' },
        ];
      
      case CreationScreen.News:
        return [
          { id: 'add_word', label: '📖 Добави новина', action: 'Add News' },
        ];
      
      case CreationScreen.Events:
        return [
          { id: 'add_event', label: '📅 Добави събитие', action: 'Add Event' },
          { id: 'add_announcement', label: '📢 Добави обявление', action: 'Add Announcement' },
          { id: 'add_gallery', label: '🖼️ Добави галерия', action: 'Add Gallery' },
        ];
      
      default:
        return [
          { id: 'add_post', label: '📝 Добави статия', action: 'Add Post' },
          { id: 'add_event', label: '📅 Добави събитие', action: 'Add Event' },
        ];
    }
  };

  const options = getOptions();

  const renderModal = () => {
    switch (selectedAction) {
      case "Add Archive":
        return (
          <UploadHistoryArchive 
            isModalClicked={optionModalUploadVisible} 
            setModalVisibility={setOptionModalVisibilty}
          />
        );
      case "Add Audio":
      return ( 
        <UploadAudio
          isModalClicked={optionModalUploadVisible}
          setModalVisibility={setOptionModalVisibilty}
        />
      );
      default:
        return null;
    }
  };

  return (
    <>
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
          {options.map((option) => (
            <TouchableOpacity 
              key={option.id}
              style={styles.optionItem} 
              onPress={() => handleOptionPress(option.action)}
            >
              <Text style={[styles.optionText, { color: isDark ? '#ffffff' : '#333333' }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Popover>
      
      {renderModal()}
    </>
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