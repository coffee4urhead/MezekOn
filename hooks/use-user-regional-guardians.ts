import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_REGIONAL_GUARDIANS || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for regional guardians');
}

type AppointedByRole = 'admin' | 'guardian' | 'keeper';

interface RegionalGuardianData {
  user_id: string;
  region_name: string | null;
  appointed_by: string;
  appointed_by_role: AppointedByRole;
  appointed_at: Date;
  is_active: boolean;
  can_verify_words: boolean;
  can_request_evidence: boolean;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseRegionalGuardianReturn {
  guardianInfo: RegionalGuardianData | null;
  loading: boolean;
  error: AppwriteException | null;
  isUpdating: boolean;
  fetchGuardianInfo: () => Promise<void>;
  updateRegionName: (regionName: string | null) => Promise<unknown>;
  updateActiveStatus: (isActive: boolean) => Promise<unknown>;
  updateVerificationPermission: (canVerify: boolean) => Promise<unknown>;
  updateEvidenceRequestPermission: (canRequest: boolean) => Promise<unknown>;
  updatePermissions: (permissions: Partial<Pick<RegionalGuardianData, 'can_verify_words' | 'can_request_evidence'>>) => Promise<unknown>;
  deactivateGuardian: () => Promise<unknown>;
  activateGuardian: () => Promise<unknown>;
  resetError: () => void;
  refresh: () => Promise<void>;
  isGuardianForRegion: (regionName: string) => boolean;
  hasFullPermissions: () => boolean;
  getGuardianSummary: () => GuardianSummary;
}

interface GuardianSummary {
  regionCount: number;
  isActive: boolean;
  canVerifyWords: boolean;
  canRequestEvidence: boolean;
  permissionLevel: 'full' | 'limited' | 'readonly';
}

export function useRegionalGuardian(user_id: string, region_name?: string): UseRegionalGuardianReturn {
  const [guardianInfo, setGuardianInfo] = useState<RegionalGuardianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchGuardianInfo = useCallback(async () => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queries = [Query.equal('user_id', user_id)];

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const data: RegionalGuardianData = {
          user_id: doc.user_id,
          region_name: doc.region_name || null,
          appointed_by: doc.appointed_by,
          appointed_by_role: doc.appointed_by_role,
          appointed_at: new Date(doc.appointed_at),
          is_active: doc.is_active,
          can_verify_words: doc.can_verify_words,
          can_request_evidence: doc.can_request_evidence,
          documentId: doc.$id,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt
        };
        setGuardianInfo(data);
      } else {
        setGuardianInfo(null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching guardian info:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id, region_name]);

  const updateField = useCallback(async (fieldName: string, value: any) => {
    if (!guardianInfo?.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, any> = {};
      updateData[fieldName] = value;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        guardianInfo.documentId,
        updateData
      );

      setGuardianInfo(prev => {
        if (!prev) return null;
        let processedValue = value;
        if (fieldName === 'appointed_at' && value) {
          processedValue = new Date(value);
        }
        return {
          ...prev,
          [fieldName]: processedValue,
          updatedAt: updated.$updatedAt
        };
      });

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error(`Error updating ${fieldName}:`, appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [guardianInfo?.documentId]);

  const updateRegionName = useCallback(async (regionName: string | null) => {
    return updateField('region_name', regionName);
  }, [updateField]);

  const updateActiveStatus = useCallback(async (isActive: boolean) => {
    return updateField('is_active', isActive);
  }, [updateField]);

  const updateVerificationPermission = useCallback(async (canVerify: boolean) => {
    return updateField('can_verify_words', canVerify);
  }, [updateField]);

  const updateEvidenceRequestPermission = useCallback(async (canRequest: boolean) => {
    return updateField('can_request_evidence', canRequest);
  }, [updateField]);

  const updatePermissions = useCallback(async (permissions: Partial<Pick<RegionalGuardianData, 'can_verify_words' | 'can_request_evidence'>>) => {
    if (!guardianInfo?.documentId) return;

    try {
      setIsUpdating(true);

      const updateData: Record<string, any> = {};
      if (permissions.can_verify_words !== undefined) updateData.can_verify_words = permissions.can_verify_words;
      if (permissions.can_request_evidence !== undefined) updateData.can_request_evidence = permissions.can_request_evidence;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        guardianInfo.documentId,
        updateData
      );

      setGuardianInfo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...permissions,
          updatedAt: updated.$updatedAt
        };
      });

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating permissions:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [guardianInfo?.documentId]);

  const deactivateGuardian = useCallback(async () => {
    return updateActiveStatus(false);
  }, [updateActiveStatus]);

  const activateGuardian = useCallback(async () => {
    return updateActiveStatus(true);
  }, [updateActiveStatus]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchGuardianInfo();
  }, [fetchGuardianInfo]);

  const isGuardianForRegion = useCallback((regionName: string) => {
    if (!guardianInfo) return false;
    return guardianInfo.region_name === regionName && guardianInfo.is_active;
  }, [guardianInfo]);

  const hasFullPermissions = useCallback(() => {
    if (!guardianInfo) return false;
    return guardianInfo.can_verify_words && guardianInfo.can_request_evidence && guardianInfo.is_active;
  }, [guardianInfo]);

  const getGuardianSummary = useCallback((): GuardianSummary => {
    if (!guardianInfo) {
      return {
        regionCount: 0,
        isActive: false,
        canVerifyWords: false,
        canRequestEvidence: false,
        permissionLevel: 'readonly'
      };
    }

    const canVerify = guardianInfo.is_active && guardianInfo.can_verify_words;
    const canRequest = guardianInfo.is_active && guardianInfo.can_request_evidence;

    let permissionLevel: 'full' | 'limited' | 'readonly' = 'readonly';
    if (canVerify && canRequest) {
      permissionLevel = 'full';
    } else if (canVerify || canRequest) {
      permissionLevel = 'limited';
    }

    return {
      regionCount: guardianInfo.region_name ? 1 : 0,
      isActive: guardianInfo.is_active,
      canVerifyWords: canVerify,
      canRequestEvidence: canRequest,
      permissionLevel
    };
  }, [guardianInfo]);

  useEffect(() => {
    fetchGuardianInfo();
  }, [fetchGuardianInfo]);

  return {
    guardianInfo,
    loading,
    error,
    isUpdating,
    fetchGuardianInfo,
    updateRegionName,
    updateActiveStatus,
    updateVerificationPermission,
    updateEvidenceRequestPermission,
    updatePermissions,
    deactivateGuardian,
    activateGuardian,
    resetError,
    refresh,
    isGuardianForRegion,
    hasFullPermissions,
    getGuardianSummary
  };
}