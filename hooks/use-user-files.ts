import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases, storage } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_FILES || '';
const STORAGE_BUCKET_ID = process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID || '';

if (!DATABASE_ID || !COLLECTION_ID || !STORAGE_BUCKET_ID) {
  throw new Error('Missing Appwrite environment variables for user files');
}

type FileType = 'profile_photo' | 'cover_photo' | 'word_attachment' | 'pronunciation_audio' | 'evidence_photo' | 'document' | 'other';

interface UserFileData {
  user_id: string;
  file_name: string;
  file_type: FileType;
  uploaded_by: string;
  file_id: string;
  $id: string;  // Document ID in database
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
}

interface UploadFileOptions {
  fileName: string;
  fileType: FileType;
  file: File;
}

interface UseUserFilesReturn {
  files: UserFileData[];
  profilePhoto: UserFileData | null;
  coverPhoto: UserFileData | null;  // Added cover photo
  loading: boolean;
  error: AppwriteException | null;
  isUploading: boolean;
  isDeleting: boolean;
  fetchUserFiles: () => Promise<void>;
  fetchFileById: (fileId: string) => Promise<UserFileData | null>;
  uploadFile: (options: UploadFileOptions) => Promise<UserFileData>;
  deleteFile: (fileDocumentId: string, storageFileId: string) => Promise<void>;
  deleteProfilePhoto: () => Promise<void>;
  deleteCoverPhoto: () => Promise<void>;  // Added
  updateProfilePhoto: (file: File) => Promise<UserFileData>;
  updateCoverPhoto: (file: File) => Promise<UserFileData>;  // Added
  getFileUrl: (fileId: string) => string;  // Changed to sync
  getFilesByType: (fileType: FileType) => UserFileData[];
  getProfilePhotoUrl: () => string | null;  // Changed to sync
  getCoverPhotoUrl: () => string | null;  // Added
  hasProfilePhoto: () => boolean;
  hasCoverPhoto: () => boolean;  // Added
  resetError: () => void;
  refresh: () => Promise<void>;
}

export function useUserFiles(user_id: string): UseUserFilesReturn {
  const [files, setFiles] = useState<UserFileData[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UserFileData | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<UserFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to get file URL (synchronous)
  const getFileUrl = useCallback((fileId: string): string => {
    return storage.getFileView(STORAGE_BUCKET_ID, fileId);
  }, []);

  const fetchUserFiles = useCallback(async () => {
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

      const filesData: UserFileData[] = response.documents.map(doc => {
        let fileUrl = undefined;
        try {
          fileUrl = getFileUrl(doc.file_id);
        } catch (err) {
          console.error('Error getting file URL:', err);
        }

        return {
          user_id: doc.user_id,
          file_name: doc.file_name,
          file_type: doc.file_type,
          uploaded_by: doc.uploaded_by,
          file_id: doc.file_id,
          $id: doc.$id,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
          fileUrl
        };
      });

      setFiles(filesData);

      // Find profile photo and cover photo
      const profilePhotoData = filesData.find(file => file.file_type === 'profile_photo');
      setProfilePhoto(profilePhotoData || null);
      
      const coverPhotoData = filesData.find(file => file.file_type === 'cover_photo');
      setCoverPhoto(coverPhotoData || null);
      
      console.log('Fetched files:', filesData.length);
      console.log('Profile photo:', profilePhotoData);
      console.log('Cover photo:', coverPhotoData);

    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user files:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id, getFileUrl]);

  const fetchFileById = useCallback(async (fileDocumentId: string): Promise<UserFileData | null> => {
    try {
      setError(null);

      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        fileDocumentId
      );

      if (doc.user_id !== user_id) {
        throw new Error('Unauthorized: This file does not belong to the current user');
      }

      let fileUrl = undefined;
      try {
        fileUrl = getFileUrl(doc.file_id);
      } catch (err) {
        console.error('Error getting file URL:', err);
      }

      const fileData: UserFileData = {
        user_id: doc.user_id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        uploaded_by: doc.uploaded_by,
        file_id: doc.file_id,
        $id: doc.$id,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        fileUrl
      };

      return fileData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching file by ID:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, [user_id, getFileUrl]);

  const uploadFile = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
    try {
      setIsUploading(true);
      setError(null);

      // Upload to storage
      const storageResponse = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        options.file
      );

      // Create database record
      const databaseResponse = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          user_id: user_id,
          file_name: options.fileName,
          file_type: options.fileType,
          uploaded_by: user_id,
          file_id: storageResponse.$id
        }
      );

      const fileUrl = getFileUrl(storageResponse.$id);

      const newFile: UserFileData = {
        user_id: databaseResponse.user_id,
        file_name: databaseResponse.file_name,
        file_type: databaseResponse.file_type,
        uploaded_by: databaseResponse.uploaded_by,
        file_id: databaseResponse.file_id,
        $id: databaseResponse.$id,
        createdAt: databaseResponse.$createdAt,
        updatedAt: databaseResponse.$updatedAt,
        fileUrl
      };

      setFiles(prev => [...prev, newFile]);

      // Update the appropriate state based on file type
      if (options.fileType === 'profile_photo') {
        setProfilePhoto(newFile);
      } else if (options.fileType === 'cover_photo') {
        setCoverPhoto(newFile);
      }

      return newFile;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error uploading file:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [user_id, getFileUrl]);

  const deleteFile = useCallback(async (fileDocumentId: string, storageFileId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      // Delete from storage
      await storage.deleteFile(STORAGE_BUCKET_ID, storageFileId);

      // Delete from database
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        fileDocumentId
      );

      const deletedFile = files.find(f => f.$id === fileDocumentId);
      setFiles(prev => prev.filter(f => f.$id !== fileDocumentId));

      // Update state based on file type
      if (deletedFile?.file_type === 'profile_photo') {
        setProfilePhoto(null);
      } else if (deletedFile?.file_type === 'cover_photo') {
        setCoverPhoto(null);
      }

    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting file:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [files]);

  const deleteProfilePhoto = useCallback(async () => {
    if (profilePhoto) {
      await deleteFile(profilePhoto.$id, profilePhoto.file_id);
    }
  }, [profilePhoto, deleteFile]);

  const deleteCoverPhoto = useCallback(async () => {
    if (coverPhoto) {
      await deleteFile(coverPhoto.$id, coverPhoto.file_id);
    }
  }, [coverPhoto, deleteFile]);

  const updateProfilePhoto = useCallback(async (file: File): Promise<UserFileData> => {
    return uploadFile({
      fileName: `profile_${user_id}_${Date.now()}.${file.name.split('.').pop()}`,
      fileType: 'profile_photo',
      file
    });
  }, [user_id, uploadFile]);

  const updateCoverPhoto = useCallback(async (file: File): Promise<UserFileData> => {
    return uploadFile({
      fileName: `cover_${user_id}_${Date.now()}.${file.name.split('.').pop()}`,
      fileType: 'cover_photo',
      file
    });
  }, [user_id, uploadFile]);

  const getFilesByType = useCallback((fileType: FileType) => {
    return files.filter(file => file.file_type === fileType);
  }, [files]);

  const getProfilePhotoUrl = useCallback((): string | null => {
    if (!profilePhoto) return null;
    try {
      return getFileUrl(profilePhoto.file_id);
    } catch (err) {
      console.error('Error getting profile photo URL:', err);
      return null;
    }
  }, [profilePhoto, getFileUrl]);

  const getCoverPhotoUrl = useCallback((): string | null => {
    if (!coverPhoto) return null;
    try {
      return getFileUrl(coverPhoto.file_id);
    } catch (err) {
      console.error('Error getting cover photo URL:', err);
      return null;
    }
  }, [coverPhoto, getFileUrl]);

  const hasProfilePhoto = useCallback(() => {
    return !!profilePhoto;
  }, [profilePhoto]);

  const hasCoverPhoto = useCallback(() => {
    return !!coverPhoto;
  }, [coverPhoto]);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    await fetchUserFiles();
  }, [fetchUserFiles]);

  useEffect(() => {
    fetchUserFiles();
  }, [fetchUserFiles]);

  return {
    files,
    profilePhoto,
    coverPhoto,  // Added
    loading,
    error,
    isUploading,
    isDeleting,
    fetchUserFiles,
    fetchFileById,
    uploadFile,
    deleteFile,
    deleteProfilePhoto,
    deleteCoverPhoto,  // Added
    updateProfilePhoto,
    updateCoverPhoto,  // Added
    getFileUrl,
    getFilesByType,
    getProfilePhotoUrl,
    getCoverPhotoUrl,  // Added
    hasProfilePhoto,
    hasCoverPhoto,  // Added
    resetError,
    refresh
  };
}