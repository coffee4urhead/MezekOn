import { useCallback, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_LIKES || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for likes');
}

export interface UserLike {
  user_id: string;
  artickle_id: string;
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface LikesMetrics {
  totalLikes: number;
  uniqueUsers: number;
  likesPerArticle: { artickle_id: string; count: number }[];
  mostLikedArtickles: { artickle_id: string; count: number }[];
}

interface UseLikesReturn {
  allLikes: UserLike[];
  userLiked: UserLike[];
  isLoading: boolean;
  error: AppwriteException | null;
  
  fetchAllLikes: () => Promise<UserLike[]>;
  fetchUserLikedArtickles: (userId: string) => Promise<UserLike[]>;
  fetchLikesByArtickle: (artickleId: string) => Promise<UserLike[]>;
  fetchLikesCount: (artickleId: string) => Promise<number>;
  fetchUserLikedArticklesIds: (userId: string) => Promise<string[]>;
  
  addLike: (userId: string, artickleId: string) => Promise<UserLike>;
  removeLike: (userId: string, artickleId: string) => Promise<void>;
  toggleLike: (userId: string, artickleId: string) => Promise<boolean>;
  checkIfUserLiked: (userId: string, artickleId: string) => Promise<boolean>;
  
  getLikesMetrics: () => Promise<LikesMetrics>;
  getTopLikedArtickles: (limit?: number) => Promise<{ artickle_id: string; count: number }[]>;
  getUserLikesCount: (userId: string) => Promise<number>;
  
  clearError: () => void;
  refresh: () => Promise<void>;
}

export default function useLikes(): UseLikesReturn {
  const [allLikes, setAllLikes] = useState<UserLike[]>([]);
  const [userLiked, setUserLiked] = useState<UserLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppwriteException | null>(null);

  const fetchAllLikes = useCallback(async (): Promise<UserLike[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );

      const docs: UserLike[] = response.documents.map(like => ({
        user_id: like.user_id,
        artickle_id: like.artickle_id,
        $id: like.$id,
        $createdAt: like.$createdAt,
        $updatedAt: like.$updatedAt
      }));

      setAllLikes(docs);
      return docs;
    } catch (err) {
      const appEx = err as AppwriteException;
      setError(appEx);
      console.error('Error fetching all likes:', appEx.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserLikedArtickles = useCallback(async (userId: string): Promise<UserLike[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('$createdAt')
        ]
      );

      const docs: UserLike[] = response.documents.map(userLike => ({
        user_id: userLike.user_id,
        artickle_id: userLike.artickle_id,
        $id: userLike.$id,
        $createdAt: userLike.$createdAt,
        $updatedAt: userLike.$updatedAt
      }));

      setUserLiked(docs);
      return docs;
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error fetching user liked artickles:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserLikedArticklesIds = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const likes = await fetchUserLikedArtickles(userId);
      return likes.map(like => like.artickle_id);
    } catch (err) {
      console.error('Error fetching user liked artickle IDs:', err);
      return [];
    }
  }, [fetchUserLikedArtickles]);

  const fetchLikesByArtickle = useCallback(async (artickleId: string): Promise<UserLike[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('artickle_id', artickleId),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map(like => ({
        user_id: like.user_id,
        artickle_id: like.artickle_id,
        $id: like.$id,
        $createdAt: like.$createdAt,
        $updatedAt: like.$updatedAt
      }));
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error fetching likes by artickle:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLikesCount = useCallback(async (artickleId: string): Promise<number> => {
    try {
      const likes = await fetchLikesByArtickle(artickleId);
      return likes.length;
    } catch (err) {
      console.error('Error fetching likes count:', err);
      return 0;
    }
  }, [fetchLikesByArtickle]);

  const checkIfUserLiked = useCallback(async (userId: string, artickleId: string): Promise<boolean> => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('artickle_id', artickleId),
          Query.limit(1)
        ]
      );
      return response.documents.length > 0;
    } catch (err) {
      console.error('Error checking if user liked:', err);
      return false;
    }
  }, []);

  const addLike = useCallback(async (userId: string, artickleId: string): Promise<UserLike> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          user_id: userId,
          artickle_id: artickleId
        }
      );

      const newLike: UserLike = {
        user_id: response.user_id,
        artickle_id: response.artickle_id,
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      };

      setAllLikes(prev => [newLike, ...prev]);
      
      if (userId === userLiked[0]?.user_id) {
        setUserLiked(prev => [newLike, ...prev]);
      }

      return newLike;
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error adding like:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userLiked]);

  const removeLike = useCallback(async (userId: string, artickleId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('artickle_id', artickleId),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        throw new Error('Like not found');
      }

      const likeId = response.documents[0].$id;

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        likeId
      );

      setAllLikes(prev => prev.filter(like => like.$id !== likeId));
      setUserLiked(prev => prev.filter(like => like.$id !== likeId));
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error removing like:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (userId: string, artickleId: string): Promise<boolean> => {
    try {
      const isLiked = await checkIfUserLiked(userId, artickleId);
      
      if (isLiked) {
        await removeLike(userId, artickleId);
        return false;
      } else {
        await addLike(userId, artickleId);
        return true;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  }, [checkIfUserLiked, addLike, removeLike]);

  const getLikesMetrics = useCallback(async (): Promise<LikesMetrics> => {
    try {
      const allLikesData = await fetchAllLikes();
      
      const uniqueUsers = new Set(allLikesData.map(like => like.user_id));
      
      const likesPerArticle = allLikesData.reduce((acc, like) => {
        acc[like.artickle_id] = (acc[like.artickle_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const likesPerArticleArray = Object.entries(likesPerArticle).map(([artickle_id, count]) => ({
        artickle_id,
        count
      }));

      const mostLikedArtickles = [...likesPerArticleArray]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalLikes: allLikesData.length,
        uniqueUsers: uniqueUsers.size,
        likesPerArticle: likesPerArticleArray,
        mostLikedArtickles
      };
    } catch (err) {
      console.error('Error getting likes metrics:', err);
      return {
        totalLikes: 0,
        uniqueUsers: 0,
        likesPerArticle: [],
        mostLikedArtickles: []
      };
    }
  }, [fetchAllLikes]);

  const getTopLikedArtickles = useCallback(async (limit: number = 10): Promise<{ artickle_id: string; count: number }[]> => {
    try {
      const metrics = await getLikesMetrics();
      return metrics.mostLikedArtickles.slice(0, limit);
    } catch (err) {
      console.error('Error getting top liked artickles:', err);
      return [];
    }
  }, [getLikesMetrics]);

  const getUserLikesCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const userLikes = await fetchUserLikedArtickles(userId);
      return userLikes.length;
    } catch (err) {
      console.error('Error getting user likes count:', err);
      return 0;
    }
  }, [fetchUserLikedArtickles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllLikes();
  }, [fetchAllLikes]);

  return {
    allLikes,
    userLiked,
    isLoading,
    error,
    
    fetchAllLikes,
    fetchUserLikedArtickles,
    fetchLikesByArtickle,
    fetchLikesCount,
    fetchUserLikedArticklesIds,
    
    addLike,
    removeLike,
    toggleLike,
    checkIfUserLiked,
    
    getLikesMetrics,
    getTopLikedArtickles,
    getUserLikesCount,
    
    clearError,
    refresh
  };
}