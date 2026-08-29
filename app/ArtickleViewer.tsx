import { useArtickleStore } from '@/components/stores/artickleStore';
import { useUserLikesStore } from '@/components/stores/useUserLikesStore';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useArtickles } from '@/hooks/use-user-artickles';
import { CommentData, useComments } from '@/hooks/use-user-comments';
import { useUserFiles } from '@/hooks/use-user-files';
import useLikes from '@/hooks/use-user-likes';
import useViews from '@/hooks/user-user-views';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtickleViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const { user } = useUser();

  const artickle = useArtickleStore((state) =>
    state.artickles.find((a) => a.$id === id)
  );

  const isLiked = useUserLikesStore((state) => state.likedArtickles[id] ?? false);
  const setLiked = useUserLikesStore((state) => state.setLiked);

  const optimisticIncrementComments = useArtickleStore((state) => state.optimisticIncrementComments);

  const { getArtickleById, incrementViews } = useArtickles();
  const { toggleLike } = useLikes();
  const { profilePhoto } = useUserFiles(user?.$id || '');
  const { addView, checkIfUserViewed } = useViews();
  const { comments, createComment, fetchCommentsByArticle } = useComments();

  const [localArtickle, setLocalArtickle] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localViewsCount, setLocalViewsCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    const fetchArtickleAndComments = async () => {
      if (!id) return;

      try {
        setLocalLoading(true);

        const data = await getArtickleById(id);
        if (data) {
          setLocalArtickle(data);
          setLocalViewsCount(data.views_count || 0);
        }

        await fetchCommentsByArticle(id);

        if (data && user?.$id && !viewTrackedRef.current) {
          try {
            const hasViewed = await checkIfUserViewed(user.$id, id);

            if (!hasViewed) {
              await addView(user.$id, id);
              await incrementViews(id);
              setLocalViewsCount((prev) => prev + 1);
              viewTrackedRef.current = true;
            } else {
              if (data.views_count !== undefined) {
                setLocalViewsCount(data.views_count);
              }
            }
          } catch (viewError) {
            console.error('Error tracking view:', viewError);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Грешка', 'Възникна проблем при зареждането на статията');
      } finally {
        setLocalLoading(false);
      }
    };

    fetchArtickleAndComments();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoBack();
      return true;
    });

    return () => {
      viewTrackedRef.current = false;
      backHandler.remove();
    };
  }, [id, user?.$id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Току-що';
    if (diffMins < 60) return `${diffMins} мин.`;
    if (diffHours < 24) return `${diffHours} ч.`;
    if (diffDays < 7) return `${diffDays} д.`;
    return date.toLocaleDateString('bg-BG');
  };

  const handleLikeToggle = async () => {
    if (!user?.$id) {
      Alert.alert('Вход', 'Моля, влезте в профила си, за да харесате статия');
      return;
    }

    const newLikedState = !isLiked;
    setLiked(id, newLikedState);

    try {
      await toggleLike(user.$id, id);
    } catch (error) {
      setLiked(id, !newLikedState);
      console.error('Failed to toggle like:', error);
      Alert.alert('Грешка', 'Неуспешно действие. Моля, опитайте отново.');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Грешка', 'Моля, напишете коментар');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Вход', 'Моля, влезте в профила си, за да коментирате');
      return;
    }

    setIsSubmitting(true);
    optimisticIncrementComments(id);
    try {
      await createComment({
        author_id: user.$id,
        artickle_id: id,
        comment_content: commentText.trim(),
      });

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Грешка', 'Неуспешно добавяне на коментар');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: CommentData }) => {
    const isOwnComment = item.author_id === user?.$id;
    const userName = item.author_id || 'Unknown User';

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatarContainer}>
          <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
            <Text style={styles.commentAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentUserName, isOwnComment && styles.ownComment]}>
              {userName}
              {isOwnComment && ' (Вие)'}
            </Text>
            <Text style={styles.commentTime}>{formatDate(item.$createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.comment_content}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.commentActionButton}>
              <Ionicons name="heart-outline" size={14} color="#666" />
              <Text style={styles.commentActionText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentActionButton}>
              <Ionicons name="chatbubble-outline" size={14} color="#666" />
              <Text style={styles.commentActionText}>Отговори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (localLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
        ]}
      >
        <ActivityIndicator size="large" color="#0347F2" />
      </SafeAreaView>
    );
  }

  if (!localArtickle && !artickle) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
        ]}
      >
        <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Статията не беше намерена</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonHeader}>
          <Text style={styles.closeButtonText}>Затвори</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayArtickle = artickle || localArtickle;
  const displayLikesCount = artickle?.likes_count ?? localArtickle?.likes_count ?? 0;

  const ListHeaderComponent = () => (
    <View style={styles.postContainer}>
      <View style={styles.authorSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: 'https://ui-avatars.com/api/?name=Author&background=0347F2&color=fff&size=40',
            }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
            {displayArtickle.author_id || 'Автор'}
          </Text>
          <Text style={[styles.dateString, { color: isDark ? '#888' : '#888' }]}>
            {formatDate(displayArtickle.$createdAt)} · 🌍 Публично
          </Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={[styles.artickleTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
          {displayArtickle.title}
        </Text>
        <Text style={[styles.contentText, { color: isDark ? '#ccc' : '#444' }]}>
          {displayArtickle.content}
        </Text>
      </View>

      {displayArtickle.media_urls && displayArtickle.media_urls.length > 0 && (
        <View style={styles.mediaSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {displayArtickle.media_urls.map((url: string, index: number) => (
              <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.statsSection, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>
            {comments.length} коментара
          </Text>
        </View>
      </View>

      <View style={[styles.actionButtons, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikeToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#e74c3c' : isDark ? '#aaa' : '#666'}
          />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: isLiked ? '#e74c3c' : isDark ? '#aaa' : '#666',
              },
            ]}
          >
            {isLiked ? 'Харесвам' : 'Харесай'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={24} color={isDark ? '#aaa' : '#666'} />
          <Text style={[styles.actionButtonText, { color: isDark ? '#aaa' : '#666' }]}>
            Коментирай
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={24} color={isDark ? '#aaa' : '#666'} />
          <Text style={[styles.actionButtonText, { color: isDark ? '#aaa' : '#666' }]}>
            Сподели
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
    >
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]}>Статия</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.$id}
          renderItem={renderComment}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={<View style={styles.footerSpacer} />}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.commentInputContainer,
            {
              borderTopColor: isDark ? '#333' : '#e8edff',
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            },
          ]}
        >
          <View style={styles.commentInputWrapper}>
            <View style={styles.commentInputAvatar}>
              {profilePhoto?.coverPhotoUrl ? (
                <Image
                  source={{ uri: profilePhoto.coverPhotoUrl }}
                  style={styles.commentInputAvatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.commentInputAvatarImage,
                    styles.commentInputAvatarPlaceholder,
                  ]}
                >
                  <Text style={styles.commentInputAvatarText}>
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#f0f2f5',
                  color: isDark ? '#fff' : '#333',
                },
              ]}
              placeholder="Напиши коментар..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() && !isSubmitting ? '#0347F2' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonHeader: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0347F2',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postContainer: {
    padding: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0347F2',
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
    color: '#888',
  },
  contentSection: {
    marginBottom: 12,
  },
  artickleTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  mediaSection: {
    marginBottom: 12,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  statsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentAvatarContainer: {
    width: 36,
    height: 36,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0347F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarPlaceholder: {
    backgroundColor: '#0347F2',
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  ownComment: {
    color: '#0347F2',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  commentInputAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputAvatarPlaceholder: {
    backgroundColor: '#0347F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footerSpacer: {
    height: 80,
  },
});