import { useTheme } from '@/context/ThemeContext';
import { AnnouncementData } from '@/hooks/use-user-announcements';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiText, MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AnnouncementCard({ 
  title, 
  content, 
  isPinned, 
  isUrgent, 
  tags = [],
  createdAt,
  updatedAt,
  authorID
}: AnnouncementData & { createdAt?: string; updatedAt?: string; authorID?: string }) {
  
  const { isDark } = useTheme();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const rotate = useSharedValue(0);
  

  useEffect(() => {
    if (isUrgent) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isUrgent]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const animatedPinStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          rotate: withTiming(isPinned ? '0deg' : '0deg', { duration: 500 })
        }
      ],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    setIsExpanded(!isExpanded);
  };

   const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isUrgent && isPinned) {
      return ['#FF6B6B', '#EE5A24', '#FF6B6B'] as const;
    } else if (isUrgent) {
      return ['#FF6B6B', '#FF4757'] as const;
    } else if (isPinned) {
      return ['#FFD93D', '#F9A825'] as const;
    } else {
      return isDark ? ['#2C3E50', '#34495E'] as const : ['#FFFFFF', '#F5F5F5'] as const;
    }
  };

  const getTagColors = (tag: string) => {
    const tagMap: Record<string, { bg: string; text: string }> = {
      'важно': { bg: '#FF4757', text: '#FFFFFF' },
      'срочно': { bg: '#FF6B6B', text: '#FFFFFF' },
      'информация': { bg: '#3498DB', text: '#FFFFFF' },
      'обновено': { bg: '#2ECC71', text: '#FFFFFF' },
      'събитие': { bg: '#9B59B6', text: '#FFFFFF' },
    };
    return tagMap[tag.toLowerCase()] || { bg: '#95A5A6', text: '#FFFFFF' };
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchable}
      >
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          {isUrgent && (
            <Animated.View style={[styles.glowEffect, animatedGlowStyle]}>
              <LinearGradient
                colors={['#FF6B6B', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.glowGradient}
              />
            </Animated.View>
          )}

          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientBackground,
              isDark && styles.darkGradient
            ]}
          >

            <BlurView 
              intensity={isDark ? 30 : 20} 
              tint={isDark ? 'dark' : 'light'}
              style={styles.blurContainer}
            >
              <View style={styles.contentContainer}>

                <View style={styles.headerRow}>
                  <View style={styles.titleContainer}>
                    {isPinned && (
                      <Animated.View style={[styles.pinIcon, animatedPinStyle]}>
                        <Ionicons 
                            name="pin" 
                            size={20} 
                            color={isDark ? '#FFD93D' : '#F9A825'} 
                        />
                        </Animated.View>
                    )}
                    
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <MotiText
                          from={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 300 }}
                          style={styles.urgentText}
                        >
                          ⚡ СРОЧНО
                        </MotiText>
                      </View>
                    )}

                    <MotiText
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', delay: 100 }}
                      style={[
                        styles.title,
                        { 
                          color: isDark ? '#FFFFFF' : '#2C3E50',
                          fontSize: isUrgent ? 18 : 16,
                          fontWeight: isUrgent ? '700' : '600'
                        }
                      ]}
                      numberOfLines={isExpanded ? undefined : 2}
                    >
                      {title}
                    </MotiText>
                  </View>

                  <MotiView
                    animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <Ionicons 
                      name="chevron-down" 
                      size={24} 
                      color={isDark ? '#CCCCCC' : '#666666'} 
                    />
                  </MotiView>
                </View>

                {isExpanded && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.expandedContent}
                  >
                    <Text style={[
                      styles.content,
                      { color: isDark ? '#E0E0E0' : '#555555' }
                    ]}>
                      {content}
                    </Text>

                    {tags && tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {tags.map((tag, index) => {
                          const colors = getTagColors(tag);
                          return (
                            <MotiView
                              key={index}
                              from={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 100 }}
                              style={[styles.tag, { backgroundColor: colors.bg }]}
                            >
                              <Text style={[styles.tagText, { color: colors.text }]}>
                                #{tag}
                              </Text>
                            </MotiView>
                          );
                        })}
                      </View>
                    )}

                    {createdAt && (
                      <Text style={[
                        styles.metadata,
                        { color: isDark ? '#888888' : '#999999' }
                      ]}>
                        {new Date(createdAt).toLocaleDateString('bg-BG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                  </MotiView>
                )}
              </View>
            </BlurView>
          </LinearGradient>

          <LinearGradient
            colors={['transparent', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)']}
            style={styles.borderEffect}
          />
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: 0,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    position: 'relative',
    minHeight: 80,
  },
  darkGradient: {
    opacity: 0.8,
  },
  blurContainer: {
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  pinIcon: {
    marginBottom: 4,
  },
  urgentBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metadata: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  borderEffect: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});