import { useTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const alphabeticalIcon = require('@/assets/icons/home.png');
const dictionaryWordsIcon = require('@/assets/icons/menu.png');
const avatarIcon = require('@/assets/icons/avatar.png');
const mainFeedIcon = require('@/assets/icons/main-feed.png');

export default function TabLayout() {
  const { isDark } = useTheme(); 
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }} edges={['top', 'left', 'right']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#333333' : '#e0e0e0',
            height: 70 + (Platform.OS === 'android' ? insets.bottom : 0),
            paddingBottom: Platform.OS === 'android' ? insets.bottom : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            fontFamily: 'System',
            marginTop: 4,
          },
          tabBarActiveTintColor: '#0347F2',
          tabBarInactiveTintColor: isDark ? '#888888' : '#999999',
        }}>
        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Начало',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                <Image 
                  source={alphabeticalIcon}
                  style={[
                    styles.icon, 
                    { tintColor: focused ? '#0347F2' : color }
                  ]}
                />
              </View>
            ),
          }}
        />
        
        <Tabs.Screen
          name="dictionary"
          options={{
            title: 'Думи',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                <Image 
                  source={dictionaryWordsIcon}
                  style={[
                    styles.icon, 
                    { tintColor: focused ? '#0347F2' : color }
                  ]}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="main-feed"
          options={{
            title: 'Събития',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                <Image 
                  source={mainFeedIcon}
                  style={[
                    styles.icon, 
                    { tintColor: focused ? '#0347F2' : color }
                  ]}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: 'Профил',
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                <Image 
                  source={avatarIcon}
                  style={[
                    styles.icon, 
                    { tintColor: focused ? '#0347F2' : color }
                  ]}
                />
              </View>
            ),
          }}
        />
        
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  activeIconContainer: {
    backgroundColor: '#0347F220', 
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});