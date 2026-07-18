import { useCallback, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_ANNOUNCEMENTS_COLLECTION_ID || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for announcements');
}

export interface AnnouncementData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  content: string;
  authorID: string;
  eventID: string;
  isPinned: boolean;
  isUrgent: boolean;
  tags: string[];
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  authorID: string;
  eventID?: string;
  isPinned?: boolean;
  isUrgent?: boolean;
  tags?: string[];
}

export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
  id: string;
}

interface UseAnnouncementsReturn {
  announcements: AnnouncementData[];
  announcement: AnnouncementData | null;
  loading: boolean;
  error: AppwriteException | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createAnnouncement: (input: CreateAnnouncementInput) => Promise<AnnouncementData>;
  updateAnnouncement: (input: UpdateAnnouncementInput) => Promise<AnnouncementData>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  getAnnouncementById: (announcementId: string) => Promise<AnnouncementData | null>;
  fetchAllAnnouncements: (options?: { limit?: number; offset?: number }) => Promise<AnnouncementData[]>;
  fetchAnnouncementsByEvent: (eventId: string) => Promise<AnnouncementData[]>;
  fetchAnnouncementsByAuthor: (authorId: string) => Promise<AnnouncementData[]>;
  fetchPinnedAnnouncements: () => Promise<AnnouncementData[]>;
  fetchUrgentAnnouncements: () => Promise<AnnouncementData[]>;
  fetchAnnouncementsWithTag: (tag: string) => Promise<AnnouncementData[]>;
  togglePin: (announcementId: string) => Promise<AnnouncementData>;
  toggleUrgent: (announcementId: string) => Promise<AnnouncementData>;
  addTag: (announcementId: string, tag: string) => Promise<AnnouncementData>;
  removeTag: (announcementId: string, tag: string) => Promise<AnnouncementData>;
  resetError: () => void;
  refresh: () => Promise<void>;
  setCurrentAnnouncement: (announcement: AnnouncementData | null) => void;
  clearCurrentAnnouncement: () => void;
}

export function useAnnouncements(initialAnnouncementId?: string): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mapToAnnouncement = (doc: any): AnnouncementData => ({
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    title: doc.title,
    content: doc.content,
    authorID: doc.authorID,
    eventID: doc.eventID || '',
    isPinned: doc.isPinned || false,
    isUrgent: doc.isUrgent || false,
    tags: doc.tags || [],
  });

  const createAnnouncement = useCallback(async (input: CreateAnnouncementInput): Promise<AnnouncementData> => {
    try {
      setIsCreating(true);
      setError(null);

      const data = {
        title: input.title,
        content: input.content,
        authorID: input.authorID,
        eventID: input.eventID || '',
        isPinned: input.isPinned || false,
        isUrgent: input.isUrgent || false,
        tags: input.tags || [],
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        data
      );

      const newAnnouncement = mapToAnnouncement(response);
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setAnnouncement(newAnnouncement);
      
      return newAnnouncement;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error creating announcement:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateAnnouncement = useCallback(async (input: UpdateAnnouncementInput): Promise<AnnouncementData> => {
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

      const updatedAnnouncement = mapToAnnouncement(response);
      
      setAnnouncements(prev => prev.map(a => a.$id === id ? updatedAnnouncement : a));
      
      if (announcement?.$id === id) {
        setAnnouncement(updatedAnnouncement);
      }
      
      return updatedAnnouncement;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating announcement:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [announcement]);

  const deleteAnnouncement = useCallback(async (announcementId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        announcementId
      );

      setAnnouncements(prev => prev.filter(a => a.$id !== announcementId));
      
      if (announcement?.$id === announcementId) {
        setAnnouncement(null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting announcement:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [announcement]);

  const getAnnouncementById = useCallback(async (announcementId: string): Promise<AnnouncementData | null> => {
    try {
      setError(null);

      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        announcementId
      );

      return mapToAnnouncement(response);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching announcement:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, []);

  const fetchAllAnnouncements = useCallback(async (options?: { limit?: number; offset?: number }): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.orderDesc('isPinned'),
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

      const fetchedAnnouncements = response.documents.map(mapToAnnouncement);
      setAnnouncements(fetchedAnnouncements);
      return fetchedAnnouncements;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching announcements:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncementsByEvent = useCallback(async (eventId: string): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('eventID', eventId),
          Query.orderDesc('isPinned'),
          Query.orderDesc('$createdAt')
        ]
      );

      const fetchedAnnouncements = response.documents.map(mapToAnnouncement);
      return fetchedAnnouncements;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching announcements by event:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncementsByAuthor = useCallback(async (authorId: string): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('authorID', authorId),
          Query.orderDesc('$createdAt')
        ]
      );

      const fetchedAnnouncements = response.documents.map(mapToAnnouncement);
      return fetchedAnnouncements;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching announcements by author:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPinnedAnnouncements = useCallback(async (): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('isPinned', true),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map(mapToAnnouncement);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching pinned announcements:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUrgentAnnouncements = useCallback(async (): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('isUrgent', true),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map(mapToAnnouncement);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching urgent announcements:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncementsWithTag = useCallback(async (tag: string): Promise<AnnouncementData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.search('tags', tag),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map(mapToAnnouncement);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching announcements with tag:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePin = useCallback(async (announcementId: string): Promise<AnnouncementData> => {
    try {
      const targetAnnouncement = announcements.find(a => a.$id === announcementId);
      if (!targetAnnouncement) {
        throw new Error('Announcement not found');
      }

      return await updateAnnouncement({
        id: announcementId,
        isPinned: !targetAnnouncement.isPinned,
      });
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error toggling pin:', appwriteError.message);
      throw err;
    }
  }, [announcements, updateAnnouncement]);

  const toggleUrgent = useCallback(async (announcementId: string): Promise<AnnouncementData> => {
    try {
      const targetAnnouncement = announcements.find(a => a.$id === announcementId);
      if (!targetAnnouncement) {
        throw new Error('Announcement not found');
      }

      return await updateAnnouncement({
        id: announcementId,
        isUrgent: !targetAnnouncement.isUrgent,
      });
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error toggling urgent:', appwriteError.message);
      throw err;
    }
  }, [announcements, updateAnnouncement]);

  const addTag = useCallback(async (announcementId: string, tag: string): Promise<AnnouncementData> => {
    try {
      const targetAnnouncement = announcements.find(a => a.$id === announcementId);
      if (!targetAnnouncement) {
        throw new Error('Announcement not found');
      }

      const currentTags = targetAnnouncement.tags || [];
      if (currentTags.includes(tag)) {
        return targetAnnouncement;
      }

      return await updateAnnouncement({
        id: announcementId,
        tags: [...currentTags, tag],
      });
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error adding tag:', appwriteError.message);
      throw err;
    }
  }, [announcements, updateAnnouncement]);

  const removeTag = useCallback(async (announcementId: string, tag: string): Promise<AnnouncementData> => {
    try {
      const targetAnnouncement = announcements.find(a => a.$id === announcementId);
      if (!targetAnnouncement) {
        throw new Error('Announcement not found');
      }

      const currentTags = targetAnnouncement.tags || [];
      const updatedTags = currentTags.filter(t => t !== tag);

      return await updateAnnouncement({
        id: announcementId,
        tags: updatedTags,
      });
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error removing tag:', appwriteError.message);
      throw err;
    }
  }, [announcements, updateAnnouncement]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllAnnouncements();
  }, [fetchAllAnnouncements]);

  const setCurrentAnnouncement = useCallback((announcementData: AnnouncementData | null) => {
    setAnnouncement(announcementData);
  }, []);

  const clearCurrentAnnouncement = useCallback(() => {
    setAnnouncement(null);
  }, []);

  return {
    announcements,
    announcement,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementById,
    fetchAllAnnouncements,
    fetchAnnouncementsByEvent,
    fetchAnnouncementsByAuthor,
    fetchPinnedAnnouncements,
    fetchUrgentAnnouncements,
    fetchAnnouncementsWithTag,
    togglePin,
    toggleUrgent,
    addTag,
    removeTag,
    resetError,
    refresh,
    setCurrentAnnouncement,
    clearCurrentAnnouncement,
  };
}