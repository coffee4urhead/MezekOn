import { useArtickleStore, useHasArtickles, useIsEmpty } from '@/components/stores/artickleStore';
import { useTheme } from '@/context/ThemeContext';
import { useArtickles } from '@/hooks/use-user-artickles';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ArtickleItem, { ArtickleItemInfo } from '../ArtickleItem';
import CreateButton, { CreationScreen } from '../ui/CreateButton';

export default function CurrentlyHot() {
  const { isDark } = useTheme();
  
  const artickles = useArtickleStore((state) => state.artickles);
  const isHydrated = useArtickleStore((state) => state.isHydrated);
  const hasMore = useArtickleStore((state) => state.hasMore);
  const setHasMore = useArtickleStore((state) => state.setHasMore);
  const setArtickles = useArtickleStore((state) => state.setArtickles);
  const page = useArtickleStore((state) => state.page);
  const setPage = useArtickleStore((state) => state.setPage);
  const lastUpdated = useArtickleStore((state) => state.lastUpdated);
  const isLoading = useArtickleStore((state) => state.isLoading);
  const isRefreshing = useArtickleStore((state) => state.isRefreshing);
  const error = useArtickleStore((state) => state.error);
  const hasArtickles = useHasArtickles();
  const isEmpty = useIsEmpty();
  

  const { 
    fetchAllArtickles, 
    refresh: refreshArtickles,
    resetError,
  } = useArtickles();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
  if (isHydrated) {
    fetchAllArtickles();
  }
}, [isHydrated]);

const shouldRefresh = useCallback(() => {
  if (artickles.length === 0) return true; 
  
  if (!lastUpdated) return true;
  
  const timeSinceUpdate = Date.now() - new Date(lastUpdated).getTime();
  const STALE_TIME = 5 * 60 * 1000; 
  
  return timeSinceUpdate > STALE_TIME;
}, [artickles.length, lastUpdated]);

  useFocusEffect(
  useCallback(() => {
    if (shouldRefresh()) {
      fetchAllArtickles();
    }
  }, [shouldRefresh])
);

const [isLoadingMore, setIsLoadingMore] = useState(false);

const loadMore = useCallback(async () => {
  if (isLoadingMore || isLoading || !hasMore) return;
  
  setIsLoadingMore(true);
  try {
    const offset = page * 20;
    const newData = await fetchAllArtickles({ limit: 20, offset });
    setArtickles([...artickles, ...newData]);
    setPage(page + 1);
    setHasMore(newData.length > 0);
  } catch (error) {
    console.error('Failed to load more:', error);
  } finally {
    setIsLoadingMore(false);
  }
}, [isLoadingMore, isLoading, hasMore, page, artickles, fetchAllArtickles, setArtickles, setPage, setHasMore]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshArtickles();
    setRefreshing(false);
    setPage(1); 
    setHasMore(true); 
    setRefreshing(false);
  };

  const renderArtickleItem = ({ item }: { item: ArtickleItemInfo }) => (
    <ArtickleItem
      $id={item.$id}
      author_id={item.author_id}
      content={item.content}
      media_urls={item.media_urls}
      likes_count={item.likes_count}
      comments_count={item.comments_count}
      views_count={item.views_count}
      title={item.title}
      $createdAt={item.$createdAt}
      $updatedAt={item.$updatedAt}
    />
  );

  if (isLoading && artickles.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ActivityIndicator size="large" color="#0347F2" />
      </View>
    );
  }

  if (error && artickles.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <Text style={{ color: isDark ? '#ffffff' : '#333333', textAlign: 'center', marginBottom: 16 }}>
          {error}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            resetError();
            fetchAllArtickles();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              📅 Актуални събития
            </Text>
            <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Следете тази страница за най-новите събития и статии свързани с диалекта на регион Мезек.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Последни публикации
            </Text>
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDark ? '#888' : '#999' }]}>
                Няма публикувани статии все още.
              </Text>
              <Text style={[styles.emptySubText, { color: isDark ? '#666' : '#bbb' }]}>
                Бъдете първият, който сподели нещо!
              </Text>
            </View>
          </View>

        </ScrollView>
        <CreateButton creationScreen={CreationScreen.Artickles}/>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📅 Актуални събития
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Следете тази страница за най-новите събития и статии свързани с диалекта на регион Мезек.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            Последни публикации
          </Text>

          {artickles && artickles.length > 0 ? (
            <FlatList
              data={artickles}
              renderItem={renderArtickleItem}
              keyExtractor={(item, index) => `${item.$id}-${index}`}
              scrollEnabled={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
    isLoading && artickles.length > 0 ? (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="small" color="#0347F2" />
      </View>
    ) : null
  }
            />
          ) : (
            <Text style={[styles.emptyText, { color: isDark ? '#888' : '#999' }]}>
              Няма публикувани статии
            </Text>
          )}
        </View>

      </ScrollView>

      <CreateButton creationScreen={CreationScreen.Artickles}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  articleCard: {
    backgroundColor: 'rgba(3, 71, 242, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  articleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 50,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0347F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});