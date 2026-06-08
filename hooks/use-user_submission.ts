import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases } from './appwrite';
import { useUserRoles } from './use-user-roles';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_SUBMISSIONS || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for user submissions');
}

type SubmissionType = 'photo' | 'word' | 'meaning' | 'pronunciation' | 'audio';
type WordClass = 'noun' | 'verb' | 'adjective' | 'adverb' | 'exclamation';
type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface UserSubmissionData {
  user_id: string;
  submission_type: SubmissionType;
  target_word_id: string | null;
  new_word: string | null;
  new_word_class: WordClass | null;
  dialect_region: string | null;
  suggested_definition: string | null;
  pronunciation_audio_id: string | null;
  photo_file_ids: string[] | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SubmissionFilters {
  submission_type?: SubmissionType;
  status?: SubmissionStatus;
  dialect_region?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UseUserSubmissionsReturn {
  submissions: UserSubmissionData[];
  totalCount: number;
  loading: boolean;
  error: AppwriteException | null;
  isSubmitting: boolean;
  isUpdating: boolean;
  fetchSubmissions: (filters?: SubmissionFilters, limit?: number, offset?: number) => Promise<void>;
  fetchSubmissionById: (submissionId: string) => Promise<UserSubmissionData | null>;
  createSubmission: (data: Omit<UserSubmissionData, 'documentId' | 'createdAt' | 'updatedAt' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_notes'>) => Promise<UserSubmissionData>;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus, reviewNotes?: string, reviewerId?: string) => Promise<unknown>;
  updateSubmission: (submissionId: string, updates: Partial<Omit<UserSubmissionData, 'documentId' | 'createdAt' | 'updatedAt'>>) => Promise<unknown>;
  deleteSubmission: (submissionId: string) => Promise<void>;
  getSubmissionsByStatus: (status: SubmissionStatus) => UserSubmissionData[];
  getPendingSubmissions: () => UserSubmissionData[];
  getApprovedSubmissions: () => UserSubmissionData[];
  getRejectedSubmissions: () => UserSubmissionData[];
  getSubmissionsByType: (type: SubmissionType) => UserSubmissionData[];
  getSubmissionsPendingReview: () => UserSubmissionData[];
  getSubmissionsByRegion: (region: string) => UserSubmissionData[];
  addPhotoToSubmission: (submissionId: string, photoFileId: string) => Promise<void>;
  removePhotoFromSubmission: (submissionId: string, photoFileId: string) => Promise<void>;
  canUserReviewSubmission: (submission: UserSubmissionData) => boolean;
  resetError: () => void;
  refresh: () => Promise<void>;
}

export function useUserSubmissions(user_id: string): UseUserSubmissionsReturn {
  const [submissions, setSubmissions] = useState<UserSubmissionData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    hasRole,
    hasAnyRole,
    getHighestRole,
    canPerformAction,
    getRolesByRegion,
    isAtLeastRole,
    loading: rolesLoading
  } = useUserRoles(user_id);

  const fetchSubmissions = useCallback(async (filters?: SubmissionFilters, limit: number = 20, offset: number = 0) => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queries = [Query.equal('user_id', user_id)];

      if (filters?.submission_type) {
        queries.push(Query.equal('submission_type', filters.submission_type));
      }

      if (filters?.status) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters?.dialect_region) {
        queries.push(Query.equal('dialect_region', filters.dialect_region));
      }

      if (filters?.startDate) {
        queries.push(Query.greaterThanEqual('$createdAt', filters.startDate.toISOString()));
      }

      if (filters?.endDate) {
        queries.push(Query.lessThanEqual('$createdAt', filters.endDate.toISOString()));
      }

      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));
      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const submissionsData: UserSubmissionData[] = response.documents.map(doc => ({
        user_id: doc.user_id,
        submission_type: doc.submission_type,
        target_word_id: doc.target_word_id || null,
        new_word: doc.new_word || null,
        new_word_class: doc.new_word_class || null,
        dialect_region: doc.dialect_region || null,
        suggested_definition: doc.suggested_definition || null,
        pronunciation_audio_id: doc.pronunciation_audio_id || null,
        photo_file_ids: doc.photo_file_ids ? (Array.isArray(doc.photo_file_ids) ? doc.photo_file_ids : [doc.photo_file_ids]) : [],
        status: doc.status,
        reviewed_by: doc.reviewed_by || null,
        reviewed_at: doc.reviewed_at ? new Date(doc.reviewed_at) : null,
        review_notes: doc.review_notes || null,
        documentId: doc.$id,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
      }));

      setSubmissions(submissionsData);
      setTotalCount(response.total);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching submissions:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const fetchSubmissionById = useCallback(async (submissionId: string): Promise<UserSubmissionData | null> => {
    try {
      setError(null);

      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        submissionId
      );

      const canView = doc.user_id === user_id || canPerformAction('verify');
      if (!canView) {
        throw new Error('Unauthorized: You do not have permission to view this submission');
      }

      const submissionData: UserSubmissionData = {
        user_id: doc.user_id,
        submission_type: doc.submission_type,
        target_word_id: doc.target_word_id || null,
        new_word: doc.new_word || null,
        new_word_class: doc.new_word_class || null,
        dialect_region: doc.dialect_region || null,
        suggested_definition: doc.suggested_definition || null,
        pronunciation_audio_id: doc.pronunciation_audio_id || null,
        photo_file_ids: doc.photo_file_ids ? (Array.isArray(doc.photo_file_ids) ? doc.photo_file_ids : [doc.photo_file_ids]) : [],
        status: doc.status,
        reviewed_by: doc.reviewed_by || null,
        reviewed_at: doc.reviewed_at ? new Date(doc.reviewed_at) : null,
        review_notes: doc.review_notes || null,
        documentId: doc.$id,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
      };

      return submissionData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching submission by ID:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, [user_id, canPerformAction]);

  const createSubmission = useCallback(async (
    data: Omit<UserSubmissionData, 'documentId' | 'createdAt' | 'updatedAt' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_notes'>
  ): Promise<UserSubmissionData> => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!canPerformAction('submit')) {
        throw new Error('Unauthorized: You do not have permission to submit content');
      }

      const submissionData: any = {
        user_id: data.user_id,
        submission_type: data.submission_type,
        target_word_id: data.target_word_id || null,
        new_word: data.new_word || null,
        new_word_class: data.new_word_class || null,
        dialect_region: data.dialect_region || null,
        suggested_definition: data.suggested_definition || null,
        pronunciation_audio_id: data.pronunciation_audio_id || null,
        photo_file_ids: data.photo_file_ids || [],
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null
      };

      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        submissionData
      );

      const newSubmission: UserSubmissionData = {
        user_id: newDoc.user_id,
        submission_type: newDoc.submission_type,
        target_word_id: newDoc.target_word_id || null,
        new_word: newDoc.new_word || null,
        new_word_class: newDoc.new_word_class || null,
        dialect_region: newDoc.dialect_region || null,
        suggested_definition: newDoc.suggested_definition || null,
        pronunciation_audio_id: newDoc.pronunciation_audio_id || null,
        photo_file_ids: newDoc.photo_file_ids || [],
        status: newDoc.status,
        reviewed_by: newDoc.reviewed_by || null,
        reviewed_at: newDoc.reviewed_at ? new Date(newDoc.reviewed_at) : null,
        review_notes: newDoc.review_notes || null,
        documentId: newDoc.$id,
        createdAt: newDoc.$createdAt,
        updatedAt: newDoc.$updatedAt
      };

      setSubmissions(prev => [newSubmission, ...prev]);
      setTotalCount(prev => prev + 1);

      return newSubmission;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error creating submission:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [canPerformAction]);

  const canUserReviewSubmission = useCallback((submission: UserSubmissionData): boolean => {
    if (hasAnyRole(['admin', 'scholar'])) {
      return true;
    }

    if (hasRole('curator')) {
      return true;
    }

    if (hasRole('guardian') && submission.dialect_region) {
      const guardianRoles = getRolesByRegion(submission.dialect_region);
      return guardianRoles.some(r => r.role === 'guardian' && r.is_active);
    }

    if (submission.user_id === user_id) {
      return false;
    }

    return false;
  }, [hasAnyRole, hasRole, getRolesByRegion, user_id]);

  const updateSubmissionStatus = useCallback(async (
    submissionId: string,
    status: SubmissionStatus,
    reviewNotes?: string,
    reviewerId?: string
  ) => {
    try {
      setIsUpdating(true);
      setError(null);

      const submission = submissions.find(s => s.documentId === submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      if (!canUserReviewSubmission(submission)) {
        throw new Error('Unauthorized: You do not have permission to review this submission');
      }

      const highestRole = getHighestRole();
      const reviewerIdentifier = reviewerId || `${user_id} (${highestRole?.role || 'user'})`;

      const updateData: any = {
        status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerIdentifier
      };

      if (reviewNotes) {
        updateData.review_notes = reviewNotes;
      }

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        submissionId,
        updateData
      );

      setSubmissions(prev => prev.map(sub =>
        sub.documentId === submissionId
          ? {
              ...sub,
              status: updated.status,
              reviewed_by: updated.reviewed_by,
              reviewed_at: updated.reviewed_at ? new Date(updated.reviewed_at) : null,
              review_notes: updated.review_notes || null,
              updatedAt: updated.$updatedAt
            }
          : sub
      ));

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating submission status:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [submissions, canUserReviewSubmission, getHighestRole, user_id]);

  const updateSubmission = useCallback(async (submissionId: string, updates: Partial<Omit<UserSubmissionData, 'documentId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setIsUpdating(true);
      setError(null);

      const existingSubmission = submissions.find(s => s.documentId === submissionId);
      if (!existingSubmission) {
        throw new Error('Submission not found');
      }

      const isAuthor = existingSubmission.user_id === user_id;
      const isPending = existingSubmission.status === 'pending';

      if (!isAuthor || !isPending) {
        throw new Error('Cannot update submission that has already been reviewed or you are not the author');
      }

      const updateData: any = { ...updates };

      if (updates.reviewed_at) {
        updateData.reviewed_at = updates.reviewed_at.toISOString();
      }

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        submissionId,
        updateData
      );

      setSubmissions(prev => prev.map(sub =>
        sub.documentId === submissionId
          ? {
              ...sub,
              ...updates,
              updatedAt: updated.$updatedAt
            }
          : sub
      ));

      return updated;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating submission:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [submissions, user_id]);

  const deleteSubmission = useCallback(async (submissionId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const existingSubmission = submissions.find(s => s.documentId === submissionId);
      if (!existingSubmission) {
        throw new Error('Submission not found');
      }

      const isAuthor = existingSubmission.user_id === user_id;
      const isAdmin = hasRole('admin');
      const isPending = existingSubmission.status === 'pending';

      if (!isAuthor && !isAdmin) {
        throw new Error('Unauthorized: You do not have permission to delete this submission');
      }

      if (!isPending && !isAdmin) {
        throw new Error('Cannot delete submission that has already been reviewed');
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        submissionId
      );

      setSubmissions(prev => prev.filter(sub => sub.documentId !== submissionId));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting submission:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [submissions, user_id, hasRole]);

  const addPhotoToSubmission = useCallback(async (submissionId: string, photoFileId: string) => {
    const submission = submissions.find(s => s.documentId === submissionId);
    if (!submission) return;

    if (submission.user_id !== user_id || submission.status !== 'pending') {
      throw new Error('Unauthorized: Cannot add photos to this submission');
    }

    const currentPhotos = submission.photo_file_ids || [];
    const updatedPhotos = [...currentPhotos, photoFileId];

    await updateSubmission(submissionId, { photo_file_ids: updatedPhotos });
  }, [submissions, updateSubmission, user_id]);

  const removePhotoFromSubmission = useCallback(async (submissionId: string, photoFileId: string) => {
    const submission = submissions.find(s => s.documentId === submissionId);
    if (!submission) return;

    if (submission.user_id !== user_id || submission.status !== 'pending') {
      throw new Error('Unauthorized: Cannot remove photos from this submission');
    }

    const currentPhotos = submission.photo_file_ids || [];
    const updatedPhotos = currentPhotos.filter(id => id !== photoFileId);

    await updateSubmission(submissionId, { photo_file_ids: updatedPhotos });
  }, [submissions, updateSubmission, user_id]);

  const getSubmissionsByStatus = useCallback((status: SubmissionStatus) => {
    return submissions.filter(sub => sub.status === status);
  }, [submissions]);

  const getPendingSubmissions = useCallback(() => {
    return submissions.filter(sub => sub.status === 'pending');
  }, [submissions]);

  const getApprovedSubmissions = useCallback(() => {
    return submissions.filter(sub => sub.status === 'approved');
  }, [submissions]);

  const getRejectedSubmissions = useCallback(() => {
    return submissions.filter(sub => sub.status === 'rejected');
  }, [submissions]);

  const getSubmissionsByType = useCallback((type: SubmissionType) => {
    return submissions.filter(sub => sub.submission_type === type);
  }, [submissions]);

  const getSubmissionsPendingReview = useCallback(() => {
    if (hasAnyRole(['admin', 'scholar', 'curator'])) {
      return submissions.filter(sub => sub.status === 'pending');
    } else if (hasRole('guardian')) {

      const guardianRegions = getRolesByRegion('').filter(r => r.role === 'guardian' && r.is_active);
      return submissions.filter(sub =>
        sub.status === 'pending' &&
        guardianRegions.some(region => region.region_for_role === sub.dialect_region)
      );
    }
    return [];
  }, [submissions, hasAnyRole, hasRole, getRolesByRegion]);

  const getSubmissionsByRegion = useCallback((region: string) => {
    return submissions.filter(sub => sub.dialect_region === region);
  }, [submissions]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    totalCount,
    loading: loading || rolesLoading,
    error,
    isSubmitting,
    isUpdating,
    fetchSubmissions,
    fetchSubmissionById,
    createSubmission,
    updateSubmissionStatus,
    updateSubmission,
    deleteSubmission,
    getSubmissionsByStatus,
    getPendingSubmissions,
    getApprovedSubmissions,
    getRejectedSubmissions,
    getSubmissionsByType,
    getSubmissionsPendingReview,
    getSubmissionsByRegion,
    addPhotoToSubmission,
    removePhotoFromSubmission,
    canUserReviewSubmission,
    resetError,
    refresh
  };
}