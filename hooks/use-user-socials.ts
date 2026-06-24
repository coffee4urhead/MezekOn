import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_CONTACTS_AND_SOCIAL || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for contacts and social');
}

export interface UserSocialContactsData {
  user_id: string;
  website_url: string | null;
  facebook_profile: string | null;
  instagram_profile: string | null;
  linked_in_profile: string | null;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseUserSocialContactsReturn {
  socialContacts: UserSocialContactsData;
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchSocialContacts: () => Promise<void>;
  updateWebsite: (url: string | null) => Promise<unknown>;
  updateFacebook: (url: string | null) => Promise<unknown>;
  updateInstagram: (url: string | null) => Promise<unknown>;
  updateLinkedIn: (url: string | null) => Promise<unknown>;
  updateSocialLinks: (updates: Partial<Omit<UserSocialContactsData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  resetError: () => void;
  refresh: () => Promise<void>;
  hasAnySocialLinks: () => boolean;
  getSocialLinksArray: () => Array<{ platform: string; url: string }>;
}

export function useUserSocialContacts(user_id: string): UseUserSocialContactsReturn {
  const [socialContacts, setSocialContacts] = useState<UserSocialContactsData>({
    user_id: '',
    website_url: null,
    facebook_profile: null,
    instagram_profile: null,
    linked_in_profile: null,
    documentId: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSocialContacts = useCallback(async () => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('user_id', user_id)]
      );

      let data: UserSocialContactsData;

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        data = {
          user_id: doc.user_id,
          website_url: doc.website_url || null,
          facebook_profile: doc.facebook_profile || null,
          instagram_profile: doc.instagram_profile || null,
          linked_in_profile: doc.linked_in_profile || null,
          documentId: doc.$id,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt
        };
      } else {
        const newDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            user_id: user_id,
            website_url: null,
            facebook_profile: null,
            instagram_profile: null,
            linked_in_profile: null
          }
        );

        data = {
          user_id: newDoc.user_id,
          website_url: newDoc.website_url || null,
          facebook_profile: newDoc.facebook_profile || null,
          instagram_profile: newDoc.instagram_profile || null,
          linked_in_profile: newDoc.linked_in_profile || null,
          documentId: newDoc.$id,
          createdAt: newDoc.$createdAt,
          updatedAt: newDoc.$updatedAt
        };
      }

      setSocialContacts(data);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching social contacts:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const updateSocialField = useCallback(async (fieldName: string, value: string | null) => {
    if (!socialContacts.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, string | null> = {};
      updateData[fieldName] = value;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        socialContacts.documentId,
        updateData
      );

      setSocialContacts(prev => ({
        ...prev,
        [fieldName]: value,
        updatedAt: updated.$updatedAt
      }));

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error(`Error updating ${fieldName}:`, appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [socialContacts.documentId]);

  const updateWebsite = useCallback(async (url: string | null) => {
    return updateSocialField('website_url', url);
  }, [updateSocialField]);

  const updateFacebook = useCallback(async (url: string | null) => {
    return updateSocialField('facebook_profile', url);
  }, [updateSocialField]);

  const updateInstagram = useCallback(async (url: string | null) => {
    return updateSocialField('instagram_profile', url);
  }, [updateSocialField]);

  const updateLinkedIn = useCallback(async (url: string | null) => {
    return updateSocialField('linked_in_profile', url);
  }, [updateSocialField]);

  const updateSocialLinks = useCallback(async (updates: Partial<Omit<UserSocialContactsData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => {
    if (!socialContacts.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, string | null> = {};
      if (updates.website_url !== undefined) updateData.website_url = updates.website_url;
      if (updates.facebook_profile !== undefined) updateData.facebook_profile = updates.facebook_profile;
      if (updates.instagram_profile !== undefined) updateData.instagram_profile = updates.instagram_profile;
      if (updates.linked_in_profile !== undefined) updateData.linked_in_profile = updates.linked_in_profile;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        socialContacts.documentId,
        updateData
      );

      setSocialContacts(prev => ({
        ...prev,
        ...updates,
        updatedAt: updated.$updatedAt
      }));

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating social links:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [socialContacts.documentId]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchSocialContacts();
  }, [fetchSocialContacts]);

  const hasAnySocialLinks = useCallback(() => {
    return !!(socialContacts.website_url ||
              socialContacts.facebook_profile ||
              socialContacts.instagram_profile ||
              socialContacts.linked_in_profile);
  }, [socialContacts]);

  const getSocialLinksArray = useCallback(() => {
    const links: Array<{ platform: string; url: string }> = [];

    if (socialContacts.website_url) {
      links.push({ platform: 'Website', url: socialContacts.website_url });
    }
    if (socialContacts.facebook_profile) {
      links.push({ platform: 'Facebook', url: socialContacts.facebook_profile });
    }
    if (socialContacts.instagram_profile) {
      links.push({ platform: 'Instagram', url: socialContacts.instagram_profile });
    }
    if (socialContacts.linked_in_profile) {
      links.push({ platform: 'LinkedIn', url: socialContacts.linked_in_profile });
    }

    return links;
  }, [socialContacts]);

  useEffect(() => {
    fetchSocialContacts();
  }, [fetchSocialContacts]);

  return {
    socialContacts,
    loading,
    error,
    isUpdating,
    fetchSocialContacts,
    updateWebsite,
    updateFacebook,
    updateInstagram,
    updateLinkedIn,
    updateSocialLinks,
    resetError,
    refresh,
    hasAnySocialLinks,
    getSocialLinksArray
  };
}