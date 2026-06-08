import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_ACHIEVEMENTS || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for user achievements');
}

interface UserAchievementsData {
  user_id: string;
  approved_submissions_count: number;
  total_words_contributed: number;
  total_audio_uploads: number;
  total_photos_uploaded: number;
  total_verification_votes: number;
  mentor_user_id: string | null;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AchievementThreshold {
  name: string;
  level: string;
  threshold: number;
  icon: string;
}

interface UserRank {
  title: string;
  level: number;
  nextLevelThreshold: number;
  progress: number;
}

interface UseUserAchievementsReturn {
  achievements: UserAchievementsData | null;
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchAchievements: () => Promise<void>;
  incrementApprovedSubmissions: (amount?: number) => Promise<unknown>;
  incrementWordsContributed: (amount?: number) => Promise<unknown>;
  incrementAudioUploads: (amount?: number) => Promise<unknown>;
  incrementPhotosUploaded: (amount?: number) => Promise<unknown>;
  incrementVerificationVotes: (amount?: number) => Promise<unknown>;
  updateMentor: (mentorUserId: string | null) => Promise<unknown>;
  updateMultipleStats: (updates: Partial<Omit<UserAchievementsData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  resetError: () => void;
  refresh: () => Promise<void>;
  getWordContributorLevel: () => AchievementThreshold;
  getAudioContributorLevel: () => AchievementThreshold;
  getPhotoContributorLevel: () => AchievementThreshold;
  getVerificationContributorLevel: () => AchievementThreshold;
  getUserRank: () => UserRank;
  getTotalContributions: () => number;
  getMentorStatus: () => { isMentor: boolean; mentorId: string | null };
  hasAchievedMilestone: (milestone: 'word_master' | 'audio_expert' | 'photo_contributor' | 'verification_champion') => boolean;
}

export function useUserAchievements(user_id: string): UseUserAchievementsReturn {
  const [achievements, setAchievements] = useState<UserAchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAchievements = useCallback(async () => {
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

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const data: UserAchievementsData = {
          user_id: doc.user_id,
          approved_submissions_count: doc.approved_submissions_count || 0,
          total_words_contributed: doc.total_words_contributed || 0,
          total_audio_uploads: doc.total_audio_uploads || 0,
          total_photos_uploaded: doc.total_photos_uploaded || 0,
          total_verification_votes: doc.total_verification_votes || 0,
          mentor_user_id: doc.mentor_user_id || null,
          documentId: doc.$id,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt
        };
        setAchievements(data);
      } else {

        const newDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            user_id: user_id,
            approved_submissions_count: 0,
            total_words_contributed: 0,
            total_audio_uploads: 0,
            total_photos_uploaded: 0,
            total_verification_votes: 0,
            mentor_user_id: null
          }
        );

        const data: UserAchievementsData = {
          user_id: newDoc.user_id,
          approved_submissions_count: newDoc.approved_submissions_count || 0,
          total_words_contributed: newDoc.total_words_contributed || 0,
          total_audio_uploads: newDoc.total_audio_uploads || 0,
          total_photos_uploaded: newDoc.total_photos_uploaded || 0,
          total_verification_votes: newDoc.total_verification_votes || 0,
          mentor_user_id: newDoc.mentor_user_id || null,
          documentId: newDoc.$id,
          createdAt: newDoc.$createdAt,
          updatedAt: newDoc.$updatedAt
        };
        setAchievements(data);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching achievements:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const incrementField = useCallback(async (fieldName: keyof UserAchievementsData, amount: number = 1) => {
    if (!achievements?.documentId) return;

    try {
      setIsUpdating(true);

      const currentValue = achievements[fieldName] as number || 0;
      const newValue = currentValue + amount;

      const updateData: Record<string, any> = {};
      updateData[fieldName] = newValue;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        achievements.documentId,
        updateData
      );

      setAchievements(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [fieldName]: newValue,
          updatedAt: updated.$updatedAt
        };
      });

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error(`Error incrementing ${fieldName}:`, appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [achievements?.documentId, achievements]);

  const incrementApprovedSubmissions = useCallback(async (amount: number = 1) => {
    return incrementField('approved_submissions_count', amount);
  }, [incrementField]);

  const incrementWordsContributed = useCallback(async (amount: number = 1) => {
    return incrementField('total_words_contributed', amount);
  }, [incrementField]);

  const incrementAudioUploads = useCallback(async (amount: number = 1) => {
    return incrementField('total_audio_uploads', amount);
  }, [incrementField]);

  const incrementPhotosUploaded = useCallback(async (amount: number = 1) => {
    return incrementField('total_photos_uploaded', amount);
  }, [incrementField]);

  const incrementVerificationVotes = useCallback(async (amount: number = 1) => {
    return incrementField('total_verification_votes', amount);
  }, [incrementField]);

  const updateMentor = useCallback(async (mentorUserId: string | null) => {
    if (!achievements?.documentId) return;

    try {
      setIsUpdating(true);

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        achievements.documentId,
        { mentor_user_id: mentorUserId }
      );

      setAchievements(prev => {
        if (!prev) return null;
        return {
          ...prev,
          mentor_user_id: mentorUserId,
          updatedAt: updated.$updatedAt
        };
      });

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating mentor:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [achievements?.documentId]);

  const updateMultipleStats = useCallback(async (updates: Partial<Omit<UserAchievementsData, 'user_id' | 'documentId' | 'createdAt' | 'updatedAt'>>) => {
    if (!achievements?.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, any> = {};
      if (updates.approved_submissions_count !== undefined) updateData.approved_submissions_count = updates.approved_submissions_count;
      if (updates.total_words_contributed !== undefined) updateData.total_words_contributed = updates.total_words_contributed;
      if (updates.total_audio_uploads !== undefined) updateData.total_audio_uploads = updates.total_audio_uploads;
      if (updates.total_photos_uploaded !== undefined) updateData.total_photos_uploaded = updates.total_photos_uploaded;
      if (updates.total_verification_votes !== undefined) updateData.total_verification_votes = updates.total_verification_votes;
      if (updates.mentor_user_id !== undefined) updateData.mentor_user_id = updates.mentor_user_id;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        achievements.documentId,
        updateData
      );

      setAchievements(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates,
          updatedAt: updated.$updatedAt
        };
      });

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating multiple stats:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [achievements?.documentId]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchAchievements();
  }, [fetchAchievements]);

  const getWordContributorLevel = useCallback((): AchievementThreshold => {
    const words = achievements?.total_words_contributed || 0;
    if (words >= 500) return { name: 'Word Master', level: 'Gold', threshold: 500, icon: '🏆' };
    if (words >= 100) return { name: 'Word Expert', level: 'Silver', threshold: 100, icon: '📚' };
    if (words >= 25) return { name: 'Word Contributor', level: 'Bronze', threshold: 25, icon: '✍️' };
    if (words >= 5) return { name: 'Word Novice', level: 'Beginner', threshold: 5, icon: '📝' };
    return { name: 'First Word', level: 'Newbie', threshold: 1, icon: '🌱' };
  }, [achievements?.total_words_contributed]);

  const getAudioContributorLevel = useCallback((): AchievementThreshold => {
    const audios = achievements?.total_audio_uploads || 0;
    if (audios >= 100) return { name: 'Audio Legend', level: 'Gold', threshold: 100, icon: '🎙️' };
    if (audios >= 25) return { name: 'Audio Expert', level: 'Silver', threshold: 25, icon: '🎵' };
    if (audios >= 10) return { name: 'Audio Contributor', level: 'Bronze', threshold: 10, icon: '🔊' };
    if (audios >= 3) return { name: 'Audio Novice', level: 'Beginner', threshold: 3, icon: '🎤' };
    return { name: 'First Recording', level: 'Newbie', threshold: 1, icon: '🎙️' };
  }, [achievements?.total_audio_uploads]);

  const getPhotoContributorLevel = useCallback((): AchievementThreshold => {
    const photos = achievements?.total_photos_uploaded || 0;
    if (photos >= 200) return { name: 'Photo Master', level: 'Gold', threshold: 200, icon: '📷' };
    if (photos >= 50) return { name: 'Photo Expert', level: 'Silver', threshold: 50, icon: '🖼️' };
    if (photos >= 15) return { name: 'Photo Contributor', level: 'Bronze', threshold: 15, icon: '📸' };
    if (photos >= 5) return { name: 'Photo Novice', level: 'Beginner', threshold: 5, icon: '🖌️' };
    return { name: 'First Photo', level: 'Newbie', threshold: 1, icon: '📷' };
  }, [achievements?.total_photos_uploaded]);

  const getVerificationContributorLevel = useCallback((): AchievementThreshold => {
    const votes = achievements?.total_verification_votes || 0;
    if (votes >= 500) return { name: 'Verification Champion', level: 'Gold', threshold: 500, icon: '⚖️' };
    if (votes >= 100) return { name: 'Trusted Verifier', level: 'Silver', threshold: 100, icon: '✅' };
    if (votes >= 25) return { name: 'Active Verifier', level: 'Bronze', threshold: 25, icon: '🔍' };
    if (votes >= 10) return { name: 'Junior Verifier', level: 'Beginner', threshold: 10, icon: '👍' };
    return { name: 'First Verification', level: 'Newbie', threshold: 1, icon: '🎯' };
  }, [achievements?.total_verification_votes]);

  const getUserRank = useCallback((): UserRank => {
    const totalPoints = (achievements?.approved_submissions_count || 0) * 10 +
                       (achievements?.total_words_contributed || 0) * 5 +
                       (achievements?.total_audio_uploads || 0) * 3 +
                       (achievements?.total_photos_uploaded || 0) * 2 +
                       (achievements?.total_verification_votes || 0) * 1;

    if (totalPoints >= 5000) return { title: 'Dialect Grandmaster', level: 10, nextLevelThreshold: 10000, progress: 0.5 };
    if (totalPoints >= 2500) return { title: 'Dialect Master', level: 9, nextLevelThreshold: 5000, progress: 0.5 };
    if (totalPoints >= 1000) return { title: 'Senior Scholar', level: 8, nextLevelThreshold: 2500, progress: 0.5 };
    if (totalPoints >= 500) return { title: 'Dialect Expert', level: 7, nextLevelThreshold: 1000, progress: 0.5 };
    if (totalPoints >= 250) return { title: 'Advanced Contributor', level: 6, nextLevelThreshold: 500, progress: 0.5 };
    if (totalPoints >= 100) return { title: 'Active Contributor', level: 5, nextLevelThreshold: 250, progress: 0.5 };
    if (totalPoints >= 50) return { title: 'Regular Contributor', level: 4, nextLevelThreshold: 100, progress: 0.5 };
    if (totalPoints >= 25) return { title: 'Contributor', level: 3, nextLevelThreshold: 50, progress: 0.5 };
    if (totalPoints >= 10) return { title: 'Apprentice', level: 2, nextLevelThreshold: 25, progress: 0.5 };
    return { title: 'Beginner', level: 1, nextLevelThreshold: 10, progress: totalPoints / 10 };
  }, [achievements]);

  const getTotalContributions = useCallback(() => {
    if (!achievements) return 0;
    return achievements.approved_submissions_count +
           achievements.total_words_contributed +
           achievements.total_audio_uploads +
           achievements.total_photos_uploaded +
           achievements.total_verification_votes;
  }, [achievements]);

  const getMentorStatus = useCallback(() => {
    return {
      isMentor: !!achievements?.mentor_user_id,
      mentorId: achievements?.mentor_user_id || null
    };
  }, [achievements?.mentor_user_id]);

  const hasAchievedMilestone = useCallback((milestone: 'word_master' | 'audio_expert' | 'photo_contributor' | 'verification_champion'): boolean => {
    switch(milestone) {
      case 'word_master':
        return (achievements?.total_words_contributed || 0) >= 500;
      case 'audio_expert':
        return (achievements?.total_audio_uploads || 0) >= 100;
      case 'photo_contributor':
        return (achievements?.total_photos_uploaded || 0) >= 200;
      case 'verification_champion':
        return (achievements?.total_verification_votes || 0) >= 500;
      default:
        return false;
    }
  }, [achievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    isUpdating,
    fetchAchievements,
    incrementApprovedSubmissions,
    incrementWordsContributed,
    incrementAudioUploads,
    incrementPhotosUploaded,
    incrementVerificationVotes,
    updateMentor,
    updateMultipleStats,
    resetError,
    refresh,
    getWordContributorLevel,
    getAudioContributorLevel,
    getPhotoContributorLevel,
    getVerificationContributorLevel,
    getUserRank,
    getTotalContributions,
    getMentorStatus,
    hasAchievedMilestone
  };
}