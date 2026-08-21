import { useAudio } from '@/context/AudioContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NowPlayingBar() {
  const audio = useAudio();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!audio.currentAudio) {
    return null;
  }

 const handlePress = () => {
  try {
    if (!audio.currentAudio) return;
    
    router.push({
      pathname: '/AudioPlayerScreen',
      params: {
        fileUrl: audio.currentAudio.fileUrl,
        fileName: audio.currentAudio.fileName,
        fileId: audio.currentAudio.fileId,
        coverPhotoUrl: audio.currentAudio.coverPhotoUrl || '',
        initialPosition: audio.position.toString(),
      },
    });
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert('Грешка', 'Не може да се отвори аудио файлът.');
  }
};

  const tabBarHeight = Platform.OS === 'ios' ? 70 : 60;
  const bottomPosition = insets.bottom + tabBarHeight;

  return (
    <View style={[styles.container, { bottom: bottomPosition }]}>
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.leftContent}>
          <Ionicons name="musical-note" size={24} color="#1DB954" />
          <Text style={styles.title} numberOfLines={1}>
            {audio.currentAudio.fileName}
          </Text>
        </View>
        <View style={styles.actions}>
          {audio.isPlaying && (
            <Ionicons name="volume-high" size={20} color="#1DB954" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
});