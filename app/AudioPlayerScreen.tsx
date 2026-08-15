import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AudioPlayerScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const audio = useAudio();

  const params = useLocalSearchParams<{
    fileUrl: string;
    fileName: string;
    fileId: string;
    coverPhotoUrl?: string;
    initialPosition?: string;
  }>();

  const { fileUrl, fileName, fileId, coverPhotoUrl, initialPosition } = params;

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (fileUrl && fileName && fileId) {
      audio.playAudio(fileUrl, fileName, fileId, coverPhotoUrl);
    }

    if (initialPosition && audio.isLoaded) {
      const position = parseFloat(initialPosition);
      if (position > 0) {
        audio.seekTo(position);
      }
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && audio.isLoaded) {
    }
  }, [audio.position, isInitialized]);

  useEffect(() => {
    if (audio.isPlaying) {
      startSpinAnimation();
    } else {
      stopSpinAnimation();
    }
  }, [audio.isPlaying]);

  const startSpinAnimation = () => {
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }

    spinAnimation.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinAnimation.current.start();
  };

  const stopSpinAnimation = () => {
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
  };

  const handleStopAndClose = () => {
    audio.stopAudio();
    navigation.goBack();
  };

  const togglePlayback = () => {
    if (audio.isPlaying) {
      audio.pauseAudio();
    } else {
      audio.resumeAudio();
    }
  };

  const handleSliderChange = (value: number) => {
    setIsSeeking(true);
    setSeekPosition(value);
  };

  const handleSliderComplete = (value: number) => {
    audio.seekTo(value);
    setIsSeeking(false);
    setSeekPosition(value);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this audio: ${fileName}`,
        url: fileUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const skipForward = () => {
    const newPosition = Math.min(audio.position + 10, audio.duration);
    audio.seekTo(newPosition);
    setSeekPosition(newPosition);
  };

  const skipBackward = () => {
    const newPosition = Math.max(audio.position - 10, 0);
    audio.seekTo(newPosition);
    setSeekPosition(newPosition);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const displayPosition = isSeeking ? seekPosition : (audio.position || 0);
  const isLoading = !audio.isLoaded;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
            borderBottomColor: isDark ? '#333' : '#e0e0e0',
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]} numberOfLines={1}>
          {fileName}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStopAndClose} style={styles.shareButton}>
          <Ionicons name="close-circle" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={[styles.loadingText, { color: isDark ? '#ccc' : '#666' }]}>
              Зареждане на аудио...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.coverContainer}>
              <Animated.View style={[styles.coverWrapper, { transform: [{ rotate: spin }] }]}>
                {coverPhotoUrl ? (
                  <Image source={{ uri: coverPhotoUrl }} style={styles.coverArt} resizeMode="cover" />
                ) : (
                  <View
                    style={[
                      styles.coverPlaceholder,
                      { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' },
                    ]}
                  >
                    <Ionicons name="musical-notes" size={80} color={isDark ? '#666' : '#ccc'} />
                  </View>
                )}
              </Animated.View>
              <View style={styles.vinylCenter}>
                <View style={styles.vinylCenterInner} />
              </View>
              {audio.isPlaying && (
                <View style={styles.playingRing}>
                  <View style={styles.playingRingInner} />
                </View>
              )}
            </View>

            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color: isDark ? '#fff' : '#333' }]}>
                {fileName}
              </Text>
              <Text style={[styles.trackArtist, { color: isDark ? '#999' : '#666' }]}>
                History Archive
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <Text style={[styles.timeText, { color: isDark ? '#999' : '#666' }]}>
                {formatTime(displayPosition)}
              </Text>
              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={audio.duration || 1}
                value={displayPosition}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor={isDark ? '#333' : '#e0e0e0'}
                thumbTintColor="#1DB954"
                disabled={!audio.isLoaded}
              />
              <Text style={[styles.timeText, { color: isDark ? '#999' : '#666' }]}>
                {formatTime(audio.duration)}
              </Text>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
                <Ionicons name="play-skip-back" size={32} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: '#1DB954' }]}
                onPress={togglePlayback}
              >
                <Ionicons name={audio.isPlaying ? 'pause' : 'play'} size={36} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
                <Ionicons name="play-skip-forward" size={32} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            <View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={20} color={isDark ? '#999' : '#666'} />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#1DB954"
                maximumTrackTintColor={isDark ? '#333' : '#e0e0e0'}
                thumbTintColor="#1DB954"
              />
              <Ionicons name="volume-high" size={20} color={isDark ? '#999' : '#666'} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  coverWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  coverArt: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  vinylCenterInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1DB954',
  },
  playingRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -((width * 0.6) / 2 + 8),
    marginTop: -((width * 0.6) / 2 + 8),
    width: width * 0.6 + 16,
    height: width * 0.6 + 16,
    borderRadius: width * 0.3 + 8,
    borderWidth: 2,
    borderColor: '#1DB954',
    opacity: 0.6,
  },
  playingRingInner: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1DB954',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    minWidth: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  controlButton: {
    padding: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
});