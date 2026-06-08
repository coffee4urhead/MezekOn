import { AppwriteException, ID, Query } from 'appwrite';
import { useCallback, useEffect, useState } from 'react';
import { databases, storage } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_FILES || '';
const STORAGE_BUCKET_ID = process.env.EXPO_PUBLIC_STORAGE_USER_FILES_BUCKET_ID || '';

// for now only pfps are available !!!!!!

if (!DATABASE_ID || !COLLECTION_ID || !STORAGE_BUCKET_ID) {
  throw new Error('Missing Appwrite environment variables for user files');
}

type FileType = 'profile_photo' | 'word_attachment' | 'pronunciation_audio' | 'evidence_photo' | 'document' | 'other';

interface UserFileData {
  user_id: string;
  profile_photo_id: string;
  file_name: string;
  file_type: FileType;
  uploaded_by: string;
  file_id: string;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
}

interface UploadFileOptions {
  fileName: string;
  fileType: FileType;
  file: File;
  isProfilePhoto?: boolean;
}

interface UseUserFilesReturn {
  files: UserFileData[];
  profilePhoto: UserFileData | null;
  loading: boolean;
  error: AppwriteException | null;
  isUploading: boolean;
  isDeleting: boolean;
  fetchUserFiles: () => Promise<void>;
  fetchFileById: (fileId: string) => Promise<UserFileData | null>;
  uploadFile: (options: UploadFileOptions) => Promise<UserFileData>;
  deleteFile: (fileDocumentId: string, storageFileId: string) => Promise<void>;
  deleteProfilePhoto: () => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<UserFileData>;
  getFileUrl: (fileId: string) => Promise<string>;
  getFilesByType: (fileType: FileType) => UserFileData[];
  getProfilePhotoUrl: () => Promise<string | null>;
  hasProfilePhoto: () => boolean;
  resetError: () => void;
  refresh: () => Promise<void>;
}

export function useUserFiles(user_id: string): UseUserFilesReturn {
  const [files, setFiles] = useState<UserFileData[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UserFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      const filesData: UserFileData[] = await Promise.all(response.documents.map(async doc => {
        let fileUrl = undefined;
        try {
          fileUrl = storage.getFileView(STORAGE_BUCKET_ID, doc.file_id);
        } catch (err) {
          console.error('Error getting file URL:', err);
        }

        return {
          user_id: doc.user_id,
          profile_photo_id: doc.profile_photo_id,
          file_name: doc.file_name,
          file_type: doc.file_type,
          uploaded_by: doc.uploaded_by,
          file_id: doc.file_id,
          documentId: doc.$id,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
          fileUrl
        };
      }));

      setFiles(filesData);

      const profilePhotoData = filesData.find(file => file.file_type === 'profile_photo');
      setProfilePhoto(profilePhotoData || null);

    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user files:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

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
        fileUrl = storage.getFileView(STORAGE_BUCKET_ID, doc.file_id);
      } catch (err) {
        console.error('Error getting file URL:', err);
      }

      const fileData: UserFileData = {
        user_id: doc.user_id,
        profile_photo_id: doc.profile_photo_id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        uploaded_by: doc.uploaded_by,
        file_id: doc.file_id,
        documentId: doc.$id,
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
  }, [user_id]);

  const uploadFile = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
    try {
      setIsUploading(true);
      setError(null);

      if (options.isProfilePhoto) {
        const existingProfilePhoto = files.find(f => f.file_type === 'profile_photo');
        if (existingProfilePhoto) {
          await deleteFile(existingProfilePhoto.documentId, existingProfilePhoto.file_id);
        }
      }

      const storageResponse = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        options.file
      );

      const databaseResponse = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          user_id: user_id,
          profile_photo_id: options.isProfilePhoto ? storageResponse.$id : '',
          file_name: options.fileName,
          file_type: options.fileType,
          uploaded_by: user_id,
          file_id: storageResponse.$id
        }
      );

      const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, storageResponse.$id);

      const newFile: UserFileData = {
        user_id: databaseResponse.user_id,
        profile_photo_id: databaseResponse.profile_photo_id,
        file_name: databaseResponse.file_name,
        file_type: databaseResponse.file_type,
        uploaded_by: databaseResponse.uploaded_by,
        file_id: databaseResponse.file_id,
        documentId: databaseResponse.$id,
        createdAt: databaseResponse.$createdAt,
        updatedAt: databaseResponse.$updatedAt,
        fileUrl
      };

      setFiles(prev => [...prev, newFile]);

      if (options.isProfilePhoto) {
        setProfilePhoto(newFile);
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
  }, [user_id, files]);

  const deleteFile = useCallback(async (fileDocumentId: string, storageFileId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      await storage.deleteFile(STORAGE_BUCKET_ID, storageFileId);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        fileDocumentId
      );

      const deletedFile = files.find(f => f.documentId === fileDocumentId);
      setFiles(prev => prev.filter(f => f.documentId !== fileDocumentId));

      if (deletedFile?.file_type === 'profile_photo') {
        setProfilePhoto(null);
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
      await deleteFile(profilePhoto.documentId, profilePhoto.file_id);
    }
  }, [profilePhoto, deleteFile]);

  const updateProfilePhoto = useCallback(async (file: File): Promise<UserFileData> => {
    return uploadFile({
      fileName: `profile_${user_id}_${Date.now()}.${file.name.split('.').pop()}`,
      fileType: 'profile_photo',
      file,
      isProfilePhoto: true
    });
  }, [user_id, uploadFile]);

  const getFileUrl = useCallback(async (fileId: string): Promise<string> => {
    try {
      return storage.getFileView(STORAGE_BUCKET_ID, fileId);
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error getting file URL:', appwriteError.message);
      throw err;
    }
  }, []);

  const getFilesByType = useCallback((fileType: FileType) => {
    return files.filter(file => file.file_type === fileType);
  }, [files]);

  const getProfilePhotoUrl = useCallback(async (): Promise<string | null> => {
    if (!profilePhoto) return null;
    try {
      return await getFileUrl(profilePhoto.file_id);
    } catch (err) {
      console.error('Error getting profile photo URL:', err);
      return null;
    }
  }, [profilePhoto, getFileUrl]);

  const hasProfilePhoto = useCallback(() => {
    return !!profilePhoto;
  }, [profilePhoto]);

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
    loading,
    error,
    isUploading,
    isDeleting,
    fetchUserFiles,
    fetchFileById,
    uploadFile,
    deleteFile,
    deleteProfilePhoto,
    updateProfilePhoto,
    getFileUrl,
    getFilesByType,
    getProfilePhotoUrl,
    hasProfilePhoto,
    resetError,
    refresh
  };
}