import { useCallback, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_VIEWS || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for views');
}

export interface UserView {
  user_id: string;
  artickle_id: string;
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface ViewsMetrics {
  totalViews: number;
  uniqueUsers: number;
  viewsPerArticle: { artickle_id: string; count: number }[];
  mostViewedArtickles: { artickle_id: string; count: number }[];
}

interface UseViewsReturn {
  allViews: UserView[];
  userViews: UserView[];
  isLoading: boolean;
  error: AppwriteException | null;
  
  fetchAllViews: () => Promise<UserView[]>;
  fetchUserViews: (userId: string) => Promise<UserView[]>;
  fetchViewsByArtickle: (artickleId: string) => Promise<UserView[]>;
  fetchViewsCount: (artickleId: string) => Promise<number>;
  fetchUserViewedArticklesIds: (userId: string) => Promise<string[]>;
  fetchArtickleViewers: (artickleId: string) => Promise<string[]>; 
  
  addView: (userId: string, artickleId: string) => Promise<UserView | null>;
  checkIfUserViewed: (userId: string, artickleId: string) => Promise<boolean>;
  
  getViewsMetrics: () => Promise<ViewsMetrics>;
  getTopViewedArtickles: (limit?: number) => Promise<{ artickle_id: string; count: number }[]>;
  getUserViewsCount: (userId: string) => Promise<number>;
  
  clearError: () => void;
  refresh: () => Promise<void>;
}

export default function useViews(): UseViewsReturn {
  const [allViews, setAllViews] = useState<UserView[]>([]);
  const [userViews, setUserViews] = useState<UserView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppwriteException | null>(null);

  const fetchAllViews = useCallback(async (): Promise<UserView[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );

      const docs: UserView[] = response.documents.map(view => ({
        user_id: view.user_id,
        artickle_id: view.artickle_id,
        $id: view.$id,
        $createdAt: view.$createdAt,
        $updatedAt: view.$updatedAt
      }));

      setAllViews(docs);
      return docs;
    } catch (err) {
      const appEx = err as AppwriteException;
      setError(appEx);
      console.error('Error fetching all views:', appEx.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserViews = useCallback(async (userId: string): Promise<UserView[]> => {
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

      const docs: UserView[] = response.documents.map(userView => ({
        user_id: userView.user_id,
        artickle_id: userView.artickle_id,
        $id: userView.$id,
        $createdAt: userView.$createdAt,
        $updatedAt: userView.$updatedAt
      }));

      setUserViews(docs);
      return docs;
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error fetching user views:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserViewedArticklesIds = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const views = await fetchUserViews(userId);
      return views.map(view => view.artickle_id);
    } catch (err) {
      console.error('Error fetching user viewed artickle IDs:', err);
      return [];
    }
  }, [fetchUserViews]);

  const fetchViewsByArtickle = useCallback(async (artickleId: string): Promise<UserView[]> => {
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

      return response.documents.map(view => ({
        user_id: view.user_id,
        artickle_id: view.artickle_id,
        $id: view.$id,
        $createdAt: view.$createdAt,
        $updatedAt: view.$updatedAt
      }));
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error fetching views by artickle:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchViewsCount = useCallback(async (artickleId: string): Promise<number> => {
    try {
      const views = await fetchViewsByArtickle(artickleId);
      return views.length;
    } catch (err) {
      console.error('Error fetching views count:', err);
      return 0;
    }
  }, [fetchViewsByArtickle]);

  const fetchArtickleViewers = useCallback(async (artickleId: string): Promise<string[]> => {
    try {
      const views = await fetchViewsByArtickle(artickleId);
      const uniqueViewers = new Set(views.map(view => view.user_id));
      return Array.from(uniqueViewers);
    } catch (err) {
      console.error('Error fetching artickle viewers:', err);
      return [];
    }
  }, [fetchViewsByArtickle]);

  const checkIfUserViewed = useCallback(async (userId: string, artickleId: string): Promise<boolean> => {
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
      console.error('Error checking if user viewed:', err);
      return false;
    }
  }, []);

  const addView = useCallback(async (userId: string, artickleId: string): Promise<UserView | null> => {
    try {
      const alreadyViewed = await checkIfUserViewed(userId, artickleId);
      
      if (alreadyViewed) {
        console.log('User has already viewed this article');
        return null;
      }

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

      const newView: UserView = {
        user_id: response.user_id,
        artickle_id: response.artickle_id,
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt
      };

      setAllViews(prev => [newView, ...prev]);
      
      if (userId === userViews[0]?.user_id) {
        setUserViews(prev => [newView, ...prev]);
      }

      return newView;
    } catch (err) {
      const appErr = err as AppwriteException;
      setError(appErr);
      console.error('Error adding view:', appErr.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userViews, checkIfUserViewed]);

  const getViewsMetrics = useCallback(async (): Promise<ViewsMetrics> => {
    try {
      const allViewsData = await fetchAllViews();
      
      const uniqueUsers = new Set(allViewsData.map(view => view.user_id));
      
      const viewsPerArticle = allViewsData.reduce((acc, view) => {
        acc[view.artickle_id] = (acc[view.artickle_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const viewsPerArticleArray = Object.entries(viewsPerArticle).map(([artickle_id, count]) => ({
        artickle_id,
        count
      }));

      const mostViewedArtickles = [...viewsPerArticleArray]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalViews: allViewsData.length,
        uniqueUsers: uniqueUsers.size,
        viewsPerArticle: viewsPerArticleArray,
        mostViewedArtickles
      };
    } catch (err) {
      console.error('Error getting views metrics:', err);
      return {
        totalViews: 0,
        uniqueUsers: 0,
        viewsPerArticle: [],
        mostViewedArtickles: []
      };
    }
  }, [fetchAllViews]);

  const getTopViewedArtickles = useCallback(async (limit: number = 10): Promise<{ artickle_id: string; count: number }[]> => {
    try {
      const metrics = await getViewsMetrics();
      return metrics.mostViewedArtickles.slice(0, limit);
    } catch (err) {
      console.error('Error getting top viewed artickles:', err);
      return [];
    }
  }, [getViewsMetrics]);

  const getUserViewsCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const userViewsData = await fetchUserViews(userId);
      return userViewsData.length;
    } catch (err) {
      console.error('Error getting user views count:', err);
      return 0;
    }
  }, [fetchUserViews]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllViews();
  }, [fetchAllViews]);

  return {
    allViews,
    userViews,
    isLoading,
    error,
    
    fetchAllViews,
    fetchUserViews,
    fetchViewsByArtickle,
    fetchViewsCount,
    fetchUserViewedArticklesIds,
    fetchArtickleViewers,
    
    addView,
    checkIfUserViewed,
    
    getViewsMetrics,
    getTopViewedArtickles,
    getUserViewsCount,
    
    clearError,
    refresh
  };
}