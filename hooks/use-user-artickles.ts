import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_ARTICKLES || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for artickles');
}

export type ArtickleStatus = 'draft' | 'published' | 'archived' | 'pending';

export interface ArtickleData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  title: string;
  content: string;
  author_id: string;
  media_urls: string[]; 
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_approved: boolean;
}

export interface CreateArtickleInput {
  title: string;
  content: string;
  author_id: string;
  media_urls?: string[];
  is_approved?: boolean;
}

export interface UpdateArtickleInput extends Partial<CreateArtickleInput> {
  id: string;
}

interface UseArticklesReturn {
  artickles: ArtickleData[];
  artickle: ArtickleData | null;
  loading: boolean;
  error: AppwriteException | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  createArtickle: (input: CreateArtickleInput) => Promise<ArtickleData>;
  updateArtickle: (input: UpdateArtickleInput) => Promise<ArtickleData>;
  deleteArtickle: (artickleId: string) => Promise<void>;
  getArtickleById: (artickleId: string) => Promise<ArtickleData | null>;
  
  fetchAllArtickles: (options?: { limit?: number; offset?: number }) => Promise<ArtickleData[]>;
  fetchUserArtickles: (userId: string) => Promise<ArtickleData[]>;
  fetchApprovedArtickles: (limit?: number) => Promise<ArtickleData[]>;
  fetchPendingArtickles: (limit?: number) => Promise<ArtickleData[]>;
  fetchTrendingArtickles: (limit?: number) => Promise<ArtickleData[]>;
  
  incrementLikes: (artickleId: string) => Promise<void>;
  incrementComments: (artickleId: string) => Promise<void>;
  incrementViews: (artickleId: string) => Promise<void>;
  
  approveArtickle: (artickleId: string) => Promise<ArtickleData>;
  archiveArtickle: (artickleId: string) => Promise<ArtickleData>;
  
  resetError: () => void;
  refresh: () => Promise<void>;
  
  setCurrentArtickle: (artickle: ArtickleData | null) => void;
  clearCurrentArtickle: () => void;
}

export function useArtickles(initialArtickleId?: string): UseArticklesReturn {
  const [artickles, setArtickles] = useState<ArtickleData[]>([]);
  const [artickle, setArtickle] = useState<ArtickleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createArtickle = useCallback(async (input: CreateArtickleInput): Promise<ArtickleData> => {
    try {
      setIsCreating(true);
      setError(null);

      const artickleData = {
        title: input.title,
        content: input.content,
        author_id: input.author_id,
        media_urls: input.media_urls || [],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        is_approved: input.is_approved || false,
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        artickleData
      );

      const newArtickle: ArtickleData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        media_urls: response.media_urls || [],
        likes_count: response.likes_count || 0,
        comments_count: response.comments_count || 0,
        views_count: response.views_count || 0,
        is_approved: response.is_approved || false,
      };

      setArtickles(prev => [newArtickle, ...prev]);
      setArtickle(newArtickle);
      
      return newArtickle;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error creating artickle:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateArtickle = useCallback(async (input: UpdateArtickleInput): Promise<ArtickleData> => {
    try {
      setIsUpdating(true);
      setError(null);

      const { id, ...updateData } = input;
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        updateData
      );

      const updatedArtickle: ArtickleData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        media_urls: response.media_urls || [],
        likes_count: response.likes_count || 0,
        comments_count: response.comments_count || 0,
        views_count: response.views_count || 0,
        is_approved: response.is_approved || false,
      };

      setArtickles(prev => prev.map(a => a.$id === id ? updatedArtickle : a));
      
      if (artickle?.$id === id) {
        setArtickle(updatedArtickle);
      }
      
      return updatedArtickle;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating artickle:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [artickle]);

  const deleteArtickle = useCallback(async (artickleId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        artickleId
      );

      setArtickles(prev => prev.filter(a => a.$id !== artickleId));
      
      if (artickle?.$id === artickleId) {
        setArtickle(null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting artickle:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [artickle]);

  const getArtickleById = useCallback(async (artickleId: string): Promise<ArtickleData | null> => {
    try {
      setError(null);

      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        artickleId
      );

      const artickleData: ArtickleData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        content: response.content,
        author_id: response.author_id,
        media_urls: response.media_urls || [],
        likes_count: response.likes_count || 0,
        comments_count: response.comments_count || 0,
        views_count: response.views_count || 0,
        is_approved: response.is_approved || false,
      };

      return artickleData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching artickle:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, []);

  const fetchAllArtickles = useCallback(async (options?: { limit?: number; offset?: number }): Promise<ArtickleData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('is_approved', true),
        Query.orderDesc('$createdAt')
      ];

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options?.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const fetchedArtickles: ArtickleData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        content: doc.content,
        author_id: doc.author_id,
        media_urls: doc.media_urls || [],
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        views_count: doc.views_count || 0,
        is_approved: doc.is_approved || false,
      }));

      setArtickles(fetchedArtickles);
      return fetchedArtickles;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching artickles:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserArtickles = useCallback(async (userId: string): Promise<ArtickleData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('author_id', userId),
          Query.orderDesc('$createdAt')
        ]
      );

      const userArtickles: ArtickleData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        content: doc.content,
        author_id: doc.author_id,
        media_urls: doc.media_urls || [],
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        views_count: doc.views_count || 0,
        is_approved: doc.is_approved || false,
      }));

      setArtickles(userArtickles);
      return userArtickles;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user artickles:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovedArtickles = useCallback(async (limit?: number): Promise<ArtickleData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('is_approved', true),
        Query.orderDesc('$createdAt')
      ];

      if (limit) {
        queries.push(Query.limit(limit));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const approvedArtickles: ArtickleData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        content: doc.content,
        author_id: doc.author_id,
        media_urls: doc.media_urls || [],
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        views_count: doc.views_count || 0,
        is_approved: doc.is_approved || false,
      }));

      return approvedArtickles;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching approved artickles:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingArtickles = useCallback(async (limit?: number): Promise<ArtickleData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('is_approved', false),
        Query.orderDesc('$createdAt')
      ];

      if (limit) {
        queries.push(Query.limit(limit));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const pendingArtickles: ArtickleData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        content: doc.content,
        author_id: doc.author_id,
        media_urls: doc.media_urls || [],
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        views_count: doc.views_count || 0,
        is_approved: doc.is_approved || false,
      }));

      return pendingArtickles;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching pending artickles:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingArtickles = useCallback(async (limit: number = 10): Promise<ArtickleData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('is_approved', true),
          Query.orderDesc('likes_count'),
          Query.orderDesc('views_count'),
          Query.limit(limit)
        ]
      );

      const trendingArtickles: ArtickleData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        content: doc.content,
        author_id: doc.author_id,
        media_urls: doc.media_urls || [],
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        views_count: doc.views_count || 0,
        is_approved: doc.is_approved || false,
      }));

      return trendingArtickles;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching trending artickles:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementLikes = useCallback(async (artickleId: string): Promise<void> => {
    try {
      const currentArtickle = artickles.find(a => a.$id === artickleId);
      if (!currentArtickle) return;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        artickleId,
        {
          likes_count: (currentArtickle.likes_count || 0) + 1
        }
      );

      setArtickles(prev => prev.map(a => 
        a.$id === artickleId 
          ? { ...a, likes_count: (a.likes_count || 0) + 1 }
          : a
      ));

      if (artickle?.$id === artickleId) {
        setArtickle(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error incrementing likes:', appwriteError.message);
      setError(appwriteError);
      throw err;
    }
  }, [artickles, artickle]);

  const incrementComments = useCallback(async (artickleId: string): Promise<void> => {
    try {
      const currentArtickle = artickles.find(a => a.$id === artickleId);
      if (!currentArtickle) return;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        artickleId,
        {
          comments_count: (currentArtickle.comments_count || 0) + 1
        }
      );

      setArtickles(prev => prev.map(a => 
        a.$id === artickleId 
          ? { ...a, comments_count: (a.comments_count || 0) + 1 }
          : a
      ));

      if (artickle?.$id === artickleId) {
        setArtickle(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error incrementing comments:', appwriteError.message);
      setError(appwriteError);
      throw err;
    }
  }, [artickles, artickle]);

  const incrementViews = useCallback(async (artickleId: string): Promise<void> => {
    try {
      const currentArtickle = artickles.find(a => a.$id === artickleId);
      if (!currentArtickle) return;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        artickleId,
        {
          views_count: (currentArtickle.views_count || 0) + 1
        }
      );

      setArtickles(prev => prev.map(a => 
        a.$id === artickleId 
          ? { ...a, views_count: (a.views_count || 0) + 1 }
          : a
      ));

      if (artickle?.$id === artickleId) {
        setArtickle(prev => prev ? { ...prev, views_count: (prev.views_count || 0) + 1 } : null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error incrementing views:', appwriteError.message);
      setError(appwriteError);
      throw err;
    }
  }, [artickles, artickle]);

  const approveArtickle = useCallback(async (artickleId: string): Promise<ArtickleData> => {
    return updateArtickle({
      id: artickleId,
      is_approved: true
    });
  }, [updateArtickle]);

  const archiveArtickle = useCallback(async (artickleId: string): Promise<ArtickleData> => {
    return updateArtickle({
      id: artickleId,
      is_approved: false
    });
  }, [updateArtickle]);

  const setCurrentArtickle = useCallback((artickleData: ArtickleData | null) => {
    setArtickle(artickleData);
  }, []);

  const clearCurrentArtickle = useCallback(() => {
    setArtickle(null);
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllArtickles();
  }, [fetchAllArtickles]);

  useEffect(() => {
    if (initialArtickleId) {
      getArtickleById(initialArtickleId).then(artickleData => {
        if (artickleData) {
          setArtickle(artickleData);
          setLoading(false);
        }
      });
    } else {
      fetchAllArtickles();
    }
  }, [initialArtickleId]);

  return {
    artickles,
    artickle,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    
    createArtickle,
    updateArtickle,
    deleteArtickle,
    getArtickleById,
    
    fetchAllArtickles,
    fetchUserArtickles,
    fetchApprovedArtickles,
    fetchPendingArtickles,
    fetchTrendingArtickles,
    
    incrementLikes,
    incrementComments,
    incrementViews,
    
    approveArtickle,
    archiveArtickle,
    
    resetError,
    refresh,
    
    setCurrentArtickle,
    clearCurrentArtickle,
  };
}