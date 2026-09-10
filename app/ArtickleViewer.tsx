import ImageModal from '@/components/modals/ViewImageComponent';
import { useArtickleById, useArtickleStore, useArtickleWithMediaUrls } from '@/components/stores/artickleStore';
import { useUserLikesStore } from '@/components/stores/useUserLikesStore';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
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
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ArtickleViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const { user, getUserById, getUserProfilePhoto } = useUser();

  const artickle = useArtickleById(id);
  const artickleWithMedia = useArtickleWithMediaUrls(id);
  const processedMediaUrls = artickleWithMedia?.media_urls || [];

  const isLiked = useUserLikesStore((state) => state.likedArtickles[id] ?? false);
  const setLiked = useUserLikesStore((state) => state.setLiked);

  const optimisticIncrementComments = useArtickleStore((state) => state.optimisticIncrementComments);

  const { toggleLike } = useLikes();
  const { addView, checkIfUserViewed } = useViews();
  const { comments, createComment, fetchCommentsByArticle } = useComments();

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewTrackedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string>('Автор');
  const [commentAuthors, setCommentAuthors] = useState<Map<string, { name: string; photo: string | null }>>(new Map());
  const { profilePhoto, getProfilePhotoUrl } = useUserFiles(artickle?.author_id || '');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const defaultProfileLogo = require('@/assets/icons/avatar.png');

  useEffect(() => {
    const fetchAuthor = async () => {
      if (artickle?.author_id) {
        const author = await getUserById(artickle.author_id);
        if (author) {
          setAuthorName(author.name || 'Автор');
        }
      }
    };
    fetchAuthor();
  }, [artickle?.author_id, getUserById]);

  const fetchCommentAuthors = async (commentList: CommentData[]) => {
    const authorMap = new Map(commentAuthors);
    
    for (const comment of commentList) {
      if (!authorMap.has(comment.author_id)) {
        try {
          const author = await getUserById(comment.author_id);
          
          if (author) {
            const photoUrl = await getUserProfilePhoto(comment.author_id);
            
            authorMap.set(comment.author_id, {
              name: author.name || 'Unknown User',
              photo: photoUrl
            });
          } else {
            authorMap.set(comment.author_id, {
              name: 'Unknown User',
              photo: null
            });
          }
        } catch (error) {
          console.error('Error fetching comment author:', error);
          authorMap.set(comment.author_id, {
            name: 'Unknown User',
            photo: null
          });
        }
      }
    }
    
    setCommentAuthors(authorMap);
  };

  useEffect(() => {
    if (comments.length > 0) {
      fetchCommentAuthors(comments);
    }
  }, [comments]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        await fetchCommentsByArticle(id);

        if (user?.$id && artickle && !viewTrackedRef.current) {
          try {
            const hasViewed = await checkIfUserViewed(user.$id, id);
            if (!hasViewed) {
              await addView(user.$id, id);
              viewTrackedRef.current = true;
            }
          } catch (viewError) {
            console.error('Error tracking view:', viewError);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Грешка', 'Възникна проблем при зареждането на коментарите');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoBack();
      return true;
    });

    return () => {
      viewTrackedRef.current = false;
      backHandler.remove();
    };
  }, [id, user?.$id, artickle]);

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
    const authorInfo = commentAuthors.get(item.author_id);
    const userName = authorInfo?.name || item.author_id || 'Unknown User';
    const userPhoto = authorInfo?.photo || null;

    return (
      <View style={[styles.commentItem, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.commentAvatarContainer}>
          {userPhoto ? (
            <Image
              source={{ uri: userPhoto }}
              style={styles.commentAvatar}
              onError={(e) => console.log('Failed to load comment avatar')}
            />
          ) : (
            <Image
              source={defaultProfileLogo}
              style={styles.commentAvatar}
            />
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentUserName, { color: isDark ? '#fff' : '#1a1a1a' }, isOwnComment && styles.ownComment]}>
              {userName}
              {isOwnComment && ' (Вие)'}
            </Text>
            <Text style={[styles.commentTime, { color: isDark ? '#888' : '#888' }]}>
              {formatDate(item.$createdAt)}
            </Text>
          </View>
          <Text style={[styles.commentText, { color: isDark ? '#ccc' : '#333' }]}>
            {item.comment_content}
          </Text>
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.commentActionButton}>
              <Ionicons name="heart-outline" size={14} color={isDark ? '#888' : '#666'} />
              <Text style={[styles.commentActionText, { color: isDark ? '#888' : '#666' }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentActionButton}>
              <Ionicons name="chatbubble-outline" size={14} color={isDark ? '#888' : '#666'} />
              <Text style={[styles.commentActionText, { color: isDark ? '#888' : '#666' }]}>Отговори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderImageGrid = () => {
    if (processedMediaUrls.length === 0) return null;

    const totalImages = processedMediaUrls.length;

    return (
      <>
        <View style={styles.mediaGridContainer}>
          <View style={styles.grid}>
            {processedMediaUrls.slice(0, 4).map((url, index) => {
              const showOverlay = index === 3 && totalImages > 4;

              let gridItemStyle = {};

              if (totalImages === 1) {
                gridItemStyle = styles.singleImage;
              } else if (totalImages === 2) {
                gridItemStyle = styles.twoImages;
              } else if (totalImages === 3) {
                gridItemStyle = index === 0 ? styles.firstOfThree : styles.lastOfThree;
              } else if (totalImages >= 4) {
                if (index === 0) gridItemStyle = [styles.fourOrMore, styles.gridTopLeft];
                else if (index === 1) gridItemStyle = [styles.fourOrMore, styles.gridTopRight];
                else if (index === 2) gridItemStyle = [styles.fourOrMore, styles.gridBottomLeft];
                else if (index === 3) gridItemStyle = [styles.fourOrMore, styles.gridBottomRight];
                else gridItemStyle = styles.fourOrMore;
              }

              return (
                <TouchableOpacity
                  key={`media-${index}`}
                  style={[styles.gridItem, gridItemStyle]}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e) => console.log(`Failed to load image ${index}`)}
                  />
                  {showOverlay && (
                    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
                      <Text style={styles.overlayText}>+{totalImages - 4}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ImageModal
          visible={modalVisible}
          images={processedMediaUrls}
          initialIndex={selectedImageIndex}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  };

  if (isLoading) {
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

  if (!artickle) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
        ]}
      >
        <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Статията не беше намерена</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeButtonHeader, { backgroundColor: '#0347F2' }]}>
          <Text style={styles.closeButtonText}>Затвори</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ListHeaderComponent = () => {
    const profilePhotoUrl = profilePhoto?.fileUrl;

    return (
      <View style={[styles.postContainer, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.authorSection}>
          <View style={styles.avatarContainer}>
            {profilePhotoUrl ? (
              <Image
                source={{ uri: profilePhotoUrl }}
                style={styles.avatar}
                onError={(e) => console.log('Failed to load profile photo')}
              />
            ) : (
              <Image
                source={defaultProfileLogo}
                style={styles.avatar}
              />
            )}
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
              {authorName}
            </Text>
            <Text style={[styles.dateString, { color: isDark ? '#888' : '#888' }]}>
              {formatDate(artickle.$createdAt)} · 🌍 Публично
            </Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={[styles.artickleTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
            {artickle.title}
          </Text>
          <Text style={[styles.contentText, { color: isDark ? '#ccc' : '#444' }]}>
            {artickle.content}
          </Text>
        </View>

        {renderImageGrid()}

        <View style={[styles.statsSection, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>
              {comments.length} коментара
            </Text>
            <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>
              {artickle.views_count || 0} прегледа
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
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
    >
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e8edff', backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
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
          contentContainerStyle={[styles.contentContainer, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
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
              {profilePhoto?.fileUrl ? (
                <Image
                  source={{ uri: profilePhoto.fileUrl }}
                  style={styles.commentInputAvatarImage}
                />
              ) : (
                <Image
                  source={defaultProfileLogo}
                  style={styles.commentInputAvatarImage}
                />
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
  defaultAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f5f2f2',
    justifyContent: 'center',
    alignItems: 'center',
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
  mediaGridContainer: {
    marginBottom: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    height: 300,
  },
  twoImages: {
    width: '49%',
    height: 220,
  },
  firstOfThree: {
    width: '100%',
    height: 220,
  },
  lastOfThree: {
    width: '49%',
    height: 150,
  },
  fourOrMore: {
    width: '49%',
    height: 180,
  },
  gridTopLeft: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  gridTopRight: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  gridBottomLeft: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  gridBottomRight: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
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
  },
  ownComment: {
    color: '#0347F2',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
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