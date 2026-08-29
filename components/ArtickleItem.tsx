import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUserFiles } from '@/hooks/use-user-files';
import useLikes from '@/hooks/use-user-likes';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useArtickleStore } from './stores/artickleStore';
import { useUserLikesStore } from './stores/useUserLikesStore';

export interface ArtickleItemInfo {
  $id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  title: string;
  $createdAt: string;
  $updatedAt: string;
}

type IconType = 'likes_filled_icon' | 'likes_icon' | 'views_icon' | 'comments_icon';

const iconMap = {
  'likes_filled_icon': require('@/assets/icons/artickleIcons/heart-filled.png'),
  'likes_icon': require('@/assets/icons/artickleIcons/heart.png'),
  'comments_icon': require('@/assets/icons/artickleIcons/comment.png'),
  'views_icon': require('@/assets/icons/artickleIcons/views.png'),
};

export default function ArtickleItem({
  $id,
  author_id,
  content,
  media_urls,
  likes_count,
  comments_count,
  views_count,
  title,
  $createdAt,
  $updatedAt,
}: ArtickleItemInfo) {
  const { getUserById, user } = useUser();
  const { profilePhoto } = useUserFiles(author_id || '');
  const { isDark } = useTheme();
  const router = useRouter();

  const { toggleLike, checkIfUserLiked } = useLikes();

  const storeArtickle = useArtickleStore((state) =>
    state.artickles.find((a) => a.$id === $id)
  );

  const isLiked = useUserLikesStore((state) => state.likedArtickles[$id] ?? false);
  const setLiked = useUserLikesStore((state) => state.setLiked);

  const displayLikesCount = storeArtickle?.likes_count ?? likes_count;
  const displayCommentsCount = storeArtickle?.comments_count ?? comments_count;
  const displayViewsCount = storeArtickle?.views_count ?? views_count;

  const [authorName, setAuthorName] = useState<string>('Author');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (author_id) {
        const author = await getUserById(author_id);
        if (author) {
          setAuthorName(author.name || 'Unknown User');
        }
      }
    };
    fetchAuthor();
  }, [author_id, getUserById]);

  const checkLikeStatus = useCallback(async () => {
    if (user?.$id && $id) {
      try {
        const liked = await checkIfUserLiked(user.$id, $id);
        setLiked($id, liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [user?.$id, $id, checkIfUserLiked, setLiked]);

  useEffect(() => {
    checkLikeStatus();
  }, [checkLikeStatus]);

  useFocusEffect(
    useCallback(() => {
      if (user?.$id && $id) {
        checkLikeStatus();
      }
      return () => {};
    }, [user?.$id, $id, checkLikeStatus])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLikeToggle = async () => {
    if (!user?.$id) {
      console.log('User not logged in');
      return;
    }

    const newLikedState = !isLiked;
    setLiked($id, newLikedState);

    try {
      await toggleLike(user.$id, $id);
    } catch (error) {
      setLiked($id, !newLikedState);
      console.error('Failed to toggle like:', error);
    }
  };

  const navigateToArtickleModalComponent = (artickleId: string) => {
    router.push({
      pathname: '/ArtickleViewer',
      params: { id: artickleId },
    });
  };

  const handleStatButtonPress = async (iconType: IconType) => {
    switch (iconType) {
      case 'likes_icon':
      case 'likes_filled_icon':
        handleLikeToggle();
        break;
      case 'comments_icon':
        navigateToArtickleModalComponent($id);
        break;
      case 'views_icon':
        navigateToArtickleModalComponent($id);
        break;
      default:
        break;
    }
  };

  const renderStatIcon = (iconType: IconType, stat: number) => {
    let iconKey: IconType = iconType;
    if (iconType === 'likes_icon' || iconType === 'likes_filled_icon') {
      iconKey = isLiked ? 'likes_filled_icon' : 'likes_icon';
    }

    return (
      <TouchableOpacity
        style={styles.statIconHolder}
        onPress={() => handleStatButtonPress(iconType)}
        activeOpacity={0.7}
      >
        <Image
          source={iconMap[iconKey]}
          style={[
            styles.statIcon,
            isLiked &&
              (iconType === 'likes_icon' || iconType === 'likes_filled_icon') &&
              styles.likedIcon,
          ]}
        />
        <Text
          style={[
            styles.statStyle,
            isLiked &&
              (iconType === 'likes_icon' || iconType === 'likes_filled_icon') &&
              styles.likedText,
          ]}
        >
          {stat}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.artickleContainer,
          {
            backgroundColor: isDark ? '#2a2a2a' : '#f8f9ff',
            borderColor: isDark ? '#333' : '#e8edff',
            opacity: 0.7,
          },
        ]}
      >
        <Text style={{ color: isDark ? '#888' : '#666' }}>Зареждане...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.artickleContainer,
        {
          backgroundColor: isDark ? '#2a2a2a' : '#f8f9ff',
          borderColor: isDark ? '#333' : '#e8edff',
        },
      ]}
      onPress={() => navigateToArtickleModalComponent($id)}
      activeOpacity={0.7}
    >
      <View style={styles.authorSection}>
        <View style={styles.avatarContainer}>
          {profilePhoto ? (
            <Image
              source={{ uri: profilePhoto.coverPhotoUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
            {authorName}
          </Text>
          <Text style={[styles.dateString, { color: isDark ? '#888' : '#888' }]}>
            {formatDate($createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={[styles.artickleTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
        <Text
          style={[styles.contentText, { color: isDark ? '#ccc' : '#444' }]}
          numberOfLines={4}
        >
          {content}
        </Text>
      </View>

      {media_urls && media_urls.length > 0 && (
        <View
          style={[
            styles.mediaSection,
            { backgroundColor: isDark ? '#333' : '#f0f4ff' },
          ]}
        >
          <Text style={[styles.mediaCount, { color: isDark ? '#888' : '#0347F2' }]}>
            📷 {media_urls.length} media files
          </Text>
        </View>
      )}

      <View
        style={[
          styles.statsSection,
          { borderTopColor: isDark ? '#333' : '#e8edff' },
        ]}
      >
        {renderStatIcon('likes_icon', displayLikesCount)}
        {renderStatIcon('comments_icon', displayCommentsCount)}
        {renderStatIcon('views_icon', displayViewsCount)}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  artickleContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  likedText: {
    color: '#e74c3c',
  },
  likedIcon: {
    tintColor: '#e74c3c',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#0347F2',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateString: {
    fontSize: 12,
    marginTop: 2,
  },
  contentSection: {
    marginBottom: 12,
  },
  artickleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
  },
  mediaSection: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
  },
  mediaCount: {
    fontSize: 12,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  statIconHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
  },
  statStyle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
});