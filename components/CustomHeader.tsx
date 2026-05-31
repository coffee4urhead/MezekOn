import { useTheme } from '@/context/ThemeContext';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const position = useRef({
    x: SCREEN_WIDTH - 60,
    y: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 20
  });
  
  const pan = useRef(new Animated.ValueXY(position.current)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      setDragStartTime(Date.now());
      pan.setOffset({
        x: position.current.x,
        y: position.current.y
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, gestureState) => {
      setIsDragging(false);
      
      let newX = position.current.x + gestureState.dx;
      let newY = position.current.y + gestureState.dy;
      
      const buttonSize = 44;
      newX = Math.max(16, Math.min(SCREEN_WIDTH - buttonSize - 16, newX));
      newY = Math.max(
        Platform.OS === 'ios' ? insets.top + 10 : insets.top + 20,
        Math.min(SCREEN_HEIGHT - buttonSize - (Platform.OS === 'ios' ? insets.bottom + 10 : 30), newY)
      );
      
      position.current = { x: newX, y: newY };
      
      pan.setOffset({ x: newX, y: newY });
      pan.setValue({ x: 0, y: 0 });
      
      const isTap = Date.now() - dragStartTime < 200 && 
                    Math.abs(gestureState.dx) < 5 && 
                    Math.abs(gestureState.dy) < 5;
      
      if (isTap) {
        toggleTheme();
      }
    },
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.themeButton,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          opacity: isDragging ? 0.8 : 1,
        }
      ]}
    >
      <Text style={{ fontSize: 24, color: isDark ? '#ffffff' : '#000000' }}>
        {isDark ? '☀️' : '🌙'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  themeButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#706d6d18',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});