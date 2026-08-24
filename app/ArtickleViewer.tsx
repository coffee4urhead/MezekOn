import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useArtickles } from '@/hooks/use-user-artickles';
import { useUserFiles } from '@/hooks/use-user-files';
import useLikes from '@/hooks/use-user-likes';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  likes: number;
}

export default function ArtickleViewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const { user } = useUser();
  const { getArtickleById, incrementViews } = useArtickles();
  const { getUserById } = useUser();
  const { profilePhoto } = useUserFiles(user?.$id || '');
  const { checkIfUserLiked, toggleLike } = useLikes();

  const [artickle, setArtickle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user_id: 'user1',
      user_name: 'Иван Петров',
      text: 'Много интересна статия! Благодаря за споделянето! 🙏',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      likes: 12,
    },
    {
      id: '2',
      user_id: 'user2',
      user_name: 'Мария Георгиева',
      text: 'Това е изключително важно за запазване на нашето културно наследство. Поздравления за автора! 👏',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      likes: 8,
    },
    {
      id: '3',
      user_id: 'user3',
      user_name: 'Димитър Стоянов',
      text: 'Имам няколко допълнителни въпроса по темата. Може ли да се свържа с автора?',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      likes: 3,
    },
  ]);

  useEffect(() => {
    const fetchArtickle = async () => {
      if (id) {
        try {
          const data = await getArtickleById(id);
          setArtickle(data);
          setLocalLikesCount(data?.likes_count || 0);
          
          if (data) {
            await incrementViews(id);
          }
          
          if (user?.$id) {
            const liked = await checkIfUserLiked(user.$id, id);
            setIsLiked(liked);
          }
        } catch (error) {
          console.error('Error fetching artickle:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchArtickle();
  }, [id]);

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
    if (!user?.$id) return;

    const currentIsLiked = isLiked;
    setIsLiked(!currentIsLiked);
    setLocalLikesCount(prev => currentIsLiked ? prev - 1 : prev + 1);

    try {
      const newLikeState = await toggleLike(user.$id, id);
      if (newLikeState) {
        // Like was added
      } else {
        // Like was removed
      }
    } catch (error) {
      setIsLiked(currentIsLiked);
      setLocalLikesCount(prev => currentIsLiked ? prev + 1 : prev - 1);
      console.error('Failed to toggle like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user?.$id) return;

    setIsSubmitting(true);
    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        user_id: user.$id,
        user_name: user.name || 'Anonymous',
        user_avatar: profilePhoto?.coverPhotoUrl,
        text: commentText.trim(),
        created_at: new Date().toISOString(),
        likes: 0,
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwnComment = item.user_id === user?.$id;

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatarContainer}>
          {item.user_avatar ? (
            <Image source={{ uri: item.user_avatar }} style={styles.commentAvatar} />
          ) : (
            <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
              <Text style={styles.commentAvatarText}>
                {item.user_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentUserName, isOwnComment && styles.ownComment]}>
              {item.user_name}
              {isOwnComment && ' (Вие)'}
            </Text>
            <Text style={styles.commentTime}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.commentActionButton}>
              <Ionicons name="heart-outline" size={14} color="#666" />
              <Text style={styles.commentActionText}>{item.likes}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ActivityIndicator size="large" color="#0347F2" />
      </SafeAreaView>
    );
  }

  if (!artickle) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Статията не беше намерена</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonHeader}>
          <Text style={styles.closeButtonText}>Затвори</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]}>Статия</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={
            <View style={styles.postContainer}>
              <View style={styles.authorSection}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: 'https://ui-avatars.com/api/?name=Author&background=0347F2&color=fff&size=40' }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                    {artickle.author_id || 'Автор'}
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

              {artickle.media_urls && artickle.media_urls.length > 0 && (
                <View style={styles.mediaSection}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {artickle.media_urls.map((url: string, index: number) => (
                      <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.statsSection, { borderBottomColor: isDark ? '#333' : '#e8edff' }]}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={16} color="#e74c3c" />
                    <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>
                      {localLikesCount}
                    </Text>
                  </View>
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
                    color={isLiked ? '#e74c3c' : (isDark ? '#aaa' : '#666')} 
                  />
                  <Text style={[styles.actionButtonText, { 
                    color: isLiked ? '#e74c3c' : (isDark ? '#aaa' : '#666') 
                  }]}>
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
          }
          ListFooterComponent={<View style={styles.footerSpacer} />}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.commentInputContainer, { 
          borderTopColor: isDark ? '#333' : '#e8edff',
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
        }]}>
          <View style={styles.commentInputWrapper}>
            <View style={styles.commentInputAvatar}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto.coverPhotoUrl }} style={styles.commentInputAvatarImage} />
              ) : (
                <View style={[styles.commentInputAvatarImage, styles.commentInputAvatarPlaceholder]}>
                  <Text style={styles.commentInputAvatarText}>
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.commentInput, { 
                backgroundColor: isDark ? '#2a2a2a' : '#f0f2f5',
                color: isDark ? '#fff' : '#333'
              }]}
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
                (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled
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
    paddingBottom: 80,
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
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    position: 'absolute',
    right: 12,
    bottom: 10,
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footerSpacer: {
    height: 80,
  },
});