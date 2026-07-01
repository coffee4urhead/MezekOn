import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_COMMUNITY_ENGAGEMENT_ID || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for user profiles');
}

interface UserCommunityData {
  user_id: string;
  joined_date: Date | null;
  last_active_at: Date | null;
  total_time_spent_minutes: number;
  contribution_streak_days: number;
  longest_streak_days: number;
  reputation_points: number;
  documentId: string;
}

interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
}

interface UseUserCommunityInfoReturn {
  communityInfo: UserCommunityData;
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchCommunityInfo: () => Promise<void>;
  updateLastActive: () => Promise<unknown>;
  addReputationPoints: (points: number) => Promise<unknown>;
  updateContributionStreak: (hasContributedToday?: boolean) => Promise<unknown>;
  addTimeSpent: (additionalTime: number) => Promise<unknown>;
  resetError: () => void;
  refresh: () => Promise<void>;
  getStreakStatus: () => StreakStatus;
  getReputationLevel: () => string;
}

export function useUserCommunityInfo(user_id: string): UseUserCommunityInfoReturn {
  const [communityInfo, setCommunityInfo] = useState<UserCommunityData>({
    user_id: '',
    joined_date: null,
    last_active_at: null,
    total_time_spent_minutes: 0,
    contribution_streak_days: 0,
    longest_streak_days: 0,
    reputation_points: 0,
    documentId: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCommunityInfo = useCallback(async () => {
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

      let data: UserCommunityData;

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        data = {
          user_id: doc.user_id,
          joined_date: doc.joined_date,
          last_active_at: doc.last_active_at,
          total_time_spent_minutes: doc.total_time_spent,
          contribution_streak_days: doc.contribution_streak,
          longest_streak_days: doc.longest_streak_days,
          reputation_points: doc.reputation_points,
          documentId: doc.$id
        };
      } else {
        const newDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            user_id: user_id,
            joined_date: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            total_time_spent: 0,
            contribution_streak: 1,
            longest_streak_days: 1,
            reputation_points: 0
          }
        );

        data = {
          user_id: newDoc.user_id,
          joined_date: newDoc.joined_date,
          last_active_at: newDoc.last_active_at,
          total_time_spent_minutes: newDoc.total_time_spent,
          contribution_streak_days: newDoc.contribution_streak,
          longest_streak_days: newDoc.longest_streak_days,
          reputation_points: newDoc.reputation_points,
          documentId: newDoc.$id
        };
      }

      setCommunityInfo(data);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching community info:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const updateLastActive = useCallback(async () => {
    if (!communityInfo.documentId) return;

    try {
      setIsUpdating(true);
      const now = new Date().toISOString();

      const updated = await databases.updateDocument(
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '',
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_COMMUNITY_ENGAGEMENT_ID || '',
        communityInfo.documentId,
        {
          last_active_at: now
        }
      );

      setCommunityInfo(prev => ({
        ...prev,
        last_active_at: updated.last_active_at
      }));

      return updated;
    } catch (err: any) {
      console.error('Error updating last active:', err);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [communityInfo.documentId]);

  const refresh = useCallback(async () => {
  await fetchCommunityInfo();
}, [fetchCommunityInfo]);

  const addReputationPoints = useCallback(async (points: number) => {
    if (!communityInfo.documentId) return;

    try {
      setIsUpdating(true);
      const newTotal = (communityInfo.reputation_points || 0) + points;

      const updated = await databases.updateDocument(
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '',
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_COMMUNITY_ENGAGEMENT_ID || '',
        communityInfo.documentId,
        {
          reputation_points: newTotal
        }
      );

      setCommunityInfo(prev => ({
        ...prev,
        reputation_points: updated.reputation_points
      }));

      return updated;
    } catch (err: any) {
      console.error('Error updating reputation:', err);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [communityInfo.documentId, communityInfo.reputation_points]);

  const updateContributionStreak = useCallback(async (hasContributedToday = true) => {
    if (!communityInfo.documentId) return;

    try {
      setIsUpdating(true);

      const today = new Date().toDateString();
      const lastActiveDay = communityInfo.last_active_at
        ? new Date(communityInfo.last_active_at).toDateString()
        : null;

      let newStreak = communityInfo.contribution_streak_days;
      let newLongestStreak = communityInfo.longest_streak_days;

      if (hasContributedToday) {
        if (lastActiveDay === today) {
          console.log('Already active today');
        } else if (lastActiveDay === new Date(Date.now() - 86400000).toDateString()) {
          newStreak += 1;
          if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
          }
        } else {
          newStreak = 1;
        }
      }

      const updated = await databases.updateDocument(
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '',
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_COMMUNITY_ENGAGEMENT_ID || '',
        communityInfo.documentId,
        {
          contribution_streak: newStreak,
          longest_streak_days: newLongestStreak,
          last_active_at: new Date().toISOString()
        }
      );

      setCommunityInfo(prev => ({
        ...prev,
        contribution_streak_days: updated.contribution_streak,
        longest_streak_days: updated.longest_streak_days,
        last_active_at: updated.last_active_at
      }));

      return updated;
    } catch (err: any) {
      console.error('Error updating streak:', err);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [communityInfo.documentId, communityInfo.contribution_streak_days, communityInfo.longest_streak_days, communityInfo.last_active_at]);

  const addTimeSpent = useCallback(async (additionalTime: number) => {
    if (!communityInfo.documentId) return;

    try {
      setIsUpdating(true);
      const newTotal = (communityInfo.total_time_spent_minutes || 0) + additionalTime;

      const updated = await databases.updateDocument(
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '',
        process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_COMMUNITY_ENGAGEMENT_ID || '',
        communityInfo.documentId,
        {
          total_time_spent: newTotal
        }
      );

      setCommunityInfo(prev => ({
        ...prev,
        total_time_spent_minutes: updated.total_time_spent
      }));

      return updated;
    } catch (err: any) {
      console.error('Error updating time spent:', err);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [communityInfo.documentId, communityInfo.total_time_spent_minutes]);

  const resetError = useCallback(() => setError(null), []);

  useEffect(() => {
    fetchCommunityInfo();
  }, [fetchCommunityInfo]);

  return {
    communityInfo,
    loading,
    error,
    isUpdating,
    fetchCommunityInfo,
    updateLastActive,
    addReputationPoints,
    updateContributionStreak,
    addTimeSpent,
    resetError,
    refresh,
    getStreakStatus: () => ({
      currentStreak: communityInfo.contribution_streak_days,
      longestStreak: communityInfo.longest_streak_days,
      isActiveToday: communityInfo.last_active_at
        ? new Date(communityInfo.last_active_at).toDateString() === new Date().toDateString()
        : false
    }),
    getReputationLevel: () => {
      const points = communityInfo.reputation_points;
      if (points < 10) return 'New Contributor';
      if (points < 50) return 'Active Member';
      if (points < 200) return 'Community Helper';
      if (points < 500) return 'Dialect Expert';
      return 'Language Guardian';
    }
  };
}