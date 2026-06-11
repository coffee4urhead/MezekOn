import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_SIDE_INFROMATION || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for user side information');
}

export type NativeLanguage = 'turkish' | 'english' | 'greek' | 'romanian' | 'bulgarian';

interface UserSideInformationData {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  birth_year: Date | null;
  native_language: NativeLanguage | null;
  other_languages: string[] | null;
  dialect_familiarity: string[] | null;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UseUserSideInformationReturn {
  userSideInfo: UserSideInformationData;
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchUserSideInfo: () => Promise<void>;
  updateDisplayName: (name: string | null) => Promise<unknown>;
  updateBio: (bio: string | null) => Promise<unknown>;
  updateLocation: (location: string | null) => Promise<unknown>;
  updateBirthYear: (year: Date | null) => Promise<unknown>;
  updateNativeLanguage: (language: NativeLanguage | null) => Promise<unknown>;
  updateOtherLanguages: (languages: string[] | null) => Promise<unknown>;
  updateDialectFamiliarity: (dialects: string[] | null) => Promise<unknown>;
  updateMultipleFields: (updates: Partial<Omit<UserSideInformationData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  addOtherLanguage: (language: string) => Promise<void>;
  removeOtherLanguage: (language: string) => Promise<void>;
  addDialectFamiliarity: (dialect: string) => Promise<void>;
  removeDialectFamiliarity: (dialect: string) => Promise<void>;
  resetError: () => void;
  refresh: () => Promise<void>;
  getAge: () => number | null;
  getFormattedBirthYear: () => string | null;
}

export function useUserSideInformation(user_id: string): UseUserSideInformationReturn {
  const [userSideInfo, setUserSideInfo] = useState<UserSideInformationData>({
    user_id: '',
    display_name: null,
    bio: null,
    location: null,
    birth_year: null,
    native_language: null,
    other_languages: [],
    dialect_familiarity: [],
    documentId: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUserSideInfo = useCallback(async () => {
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

      let data: UserSideInformationData;

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        data = {
          user_id: doc.user_id,
          display_name: doc.display_name || null,
          bio: doc.bio || null,
          location: doc.location || null,
          birth_year: doc.birth_year ? new Date(doc.birth_year) : null,
          native_language: doc.native_language || null,
          other_languages: doc.other_languages || [],
          dialect_familiarity: doc.dialect_familiarity || [],
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
            display_name: null,
            bio: null,
            location: null,
            birth_year: null,
            native_language: null,
            other_languages: [],
            dialect_familiarity: []
          }
        );

        data = {
          user_id: newDoc.user_id,
          display_name: newDoc.display_name || null,
          bio: newDoc.bio || null,
          location: newDoc.location || null,
          birth_year: newDoc.birth_year ? new Date(newDoc.birth_year) : null,
          native_language: newDoc.native_language || null,
          other_languages: newDoc.other_languages || [],
          dialect_familiarity: newDoc.dialect_familiarity || [],
          documentId: newDoc.$id,
          createdAt: newDoc.$createdAt,
          updatedAt: newDoc.$updatedAt
        };
      }

      setUserSideInfo(data);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user side information:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const updateField = useCallback(async (fieldName: string, value: any) => {
    if (!userSideInfo.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, any> = {};
      updateData[fieldName] = value;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        userSideInfo.documentId,
        updateData
      );

      let processedValue = value;
      if (fieldName === 'birth_year' && value) {
        processedValue = new Date(value);
      }

      setUserSideInfo(prev => ({
        ...prev,
        [fieldName]: processedValue,
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
  }, [userSideInfo.documentId]);

  const updateDisplayName = useCallback(async (name: string | null) => {
    return updateField('display_name', name);
  }, [updateField]);

  const updateBio = useCallback(async (bio: string | null) => {
    return updateField('bio', bio);
  }, [updateField]);

  const updateLocation = useCallback(async (location: string | null) => {
    return updateField('location', location);
  }, [updateField]);

  const updateBirthYear = useCallback(async (year: Date | null) => {
    return updateField('birth_year', year);
  }, [updateField]);

  const updateNativeLanguage = useCallback(async (language: NativeLanguage | null) => {
    return updateField('native_language', language);
  }, [updateField]);

  const updateOtherLanguages = useCallback(async (languages: string[] | null) => {
    return updateField('other_languages', languages);
  }, [updateField]);

  const updateDialectFamiliarity = useCallback(async (dialects: string[] | null) => {
    return updateField('dialect_familiarity', dialects);
  }, [updateField]);

  const updateMultipleFields = useCallback(async (updates: Partial<Omit<UserSideInformationData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => {
    if (!userSideInfo.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, any> = {};
      if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.birth_year !== undefined) updateData.birth_year = updates.birth_year;
      if (updates.native_language !== undefined) updateData.native_language = updates.native_language;
      if (updates.other_languages !== undefined) updateData.other_languages = updates.other_languages;
      if (updates.dialect_familiarity !== undefined) updateData.dialect_familiarity = updates.dialect_familiarity;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        userSideInfo.documentId,
        updateData
      );

      setUserSideInfo(prev => ({
        ...prev,
        ...updates,
        updatedAt: updated.$updatedAt
      }));

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating multiple fields:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [userSideInfo.documentId]);

  const addOtherLanguage = useCallback(async (language: string) => {
    if (!userSideInfo.documentId) return;

    const currentLanguages = userSideInfo.other_languages || [];
    if (currentLanguages.includes(language)) return;

    const updatedLanguages = [...currentLanguages, language];
    await updateOtherLanguages(updatedLanguages);
  }, [userSideInfo.documentId, userSideInfo.other_languages, updateOtherLanguages]);

  const removeOtherLanguage = useCallback(async (language: string) => {
    if (!userSideInfo.documentId) return;

    const currentLanguages = userSideInfo.other_languages || [];
    const updatedLanguages = currentLanguages.filter(lang => lang !== language);
    await updateOtherLanguages(updatedLanguages);
  }, [userSideInfo.documentId, userSideInfo.other_languages, updateOtherLanguages]);

  const addDialectFamiliarity = useCallback(async (dialect: string) => {
    if (!userSideInfo.documentId) return;

    const currentDialects = userSideInfo.dialect_familiarity || [];
    if (currentDialects.includes(dialect)) return;

    const updatedDialects = [...currentDialects, dialect];
    await updateDialectFamiliarity(updatedDialects);
  }, [userSideInfo.documentId, userSideInfo.dialect_familiarity, updateDialectFamiliarity]);

  const removeDialectFamiliarity = useCallback(async (dialect: string) => {
    if (!userSideInfo.documentId) return;

    const currentDialects = userSideInfo.dialect_familiarity || [];
    const updatedDialects = currentDialects.filter(d => d !== dialect);
    await updateDialectFamiliarity(updatedDialects);
  }, [userSideInfo.documentId, userSideInfo.dialect_familiarity, updateDialectFamiliarity]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchUserSideInfo();
  }, [fetchUserSideInfo]);

  const getAge = useCallback(() => {
    if (!userSideInfo.birth_year) return null;

    const today = new Date();
    const birthDate = new Date(userSideInfo.birth_year);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }, [userSideInfo.birth_year]);

  const getFormattedBirthYear = useCallback(() => {
    if (!userSideInfo.birth_year) return null;
    return new Date(userSideInfo.birth_year).getFullYear().toString();
  }, [userSideInfo.birth_year]);

  useEffect(() => {
    fetchUserSideInfo();
  }, [fetchUserSideInfo]);

  return {
    userSideInfo,
    loading,
    error,
    isUpdating,
    fetchUserSideInfo,
    updateDisplayName,
    updateBio,
    updateLocation,
    updateBirthYear,
    updateNativeLanguage,
    updateOtherLanguages,
    updateDialectFamiliarity,
    updateMultipleFields,
    addOtherLanguage,
    removeOtherLanguage,
    addDialectFamiliarity,
    removeDialectFamiliarity,
    resetError,
    refresh,
    getAge,
    getFormattedBirthYear
  };
}