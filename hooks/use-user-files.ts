import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases, storage } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_FILES || '';
const STORAGE_BUCKET_ID = process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID || '';
const HISTORY_ARCHIVE_STORAGE_ID = process.env.EXPO_PUBLIC_STORAGE_HISTORY_ARCHIVE_ID || '';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

if (!DATABASE_ID || !COLLECTION_ID || !STORAGE_BUCKET_ID || !HISTORY_ARCHIVE_STORAGE_ID) {
  throw new Error('Missing Appwrite environment variables for user files');
}

export type FileType = 'profile_photo' | 'event-cover-photo' | 'cover_photo' | 'word_attachment' | 'pronunciation_audio' | 'evidence_photo' | 'document' | 'other' | 'history_audio_covers' | 'history_audio';

export const uploadBucketsIds: Record<FileType, string> = {
  'document': process.env.EXPO_PUBLIC_STORAGE_HISTORY_ARCHIVE_ID || '',
  'profile_photo': process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID || '',
  'cover_photo': process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID || '',
  'history_audio': process.env.EXPO_PUBLIC_STORAGE_HISTORY_AUDIO_ARCHIVE_ID || '',
  'history_audio_covers': process.env.EXPO_PUBLIC_STORAGE_HISTORY_AUDIO_ARCHIVE_COVERS_ID || '',
  'event-cover-photo': process.env.EXPO_PUBLIC_STORAGE_EVENT_COVER_PHOTOS_ID || '',

  // these at the bottom are not done yet but to be implemented sooner
  'word_attachment': process.env.EXPO_PUBLIC_STORAGE_WORD_ATTACHMENT_ID || '',
  'pronunciation_audio': process.env.EXPO_PUBLIC_STORAGE_PRONUNCIATION_AUDIO_ID || '',
  'evidence_photo': process.env.EXPO_PUBLIC_STORAGE_EVIDENCE_PHOTO_ID || '',
  'other': process.env.EXPO_PUBLIC_STORAGE_OTHER_ID || '',
};

export interface UserFileData {
  user_id: string;
  file_name: string;
  file_type: FileType;
  uploaded_by: string;
  file_id: string;
  $id: string;
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
  title?: string;
  description?: string;
  is_approved: boolean;
  coverPhotoUrl?: string;
  coverPhotoId?: string;
}

interface UploadFileOptions {
  fileName: string;
  fileType: FileType;
  file: any;
  title?: string;
  description?: string;
  is_approved: boolean;
  coverPhoto?: any;
}

export type RNFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

interface UseUserFilesReturn {
  files: UserFileData[];
  profilePhoto: UserFileData | null;
  coverPhoto: UserFileData | null;
  loading: boolean;
  error: AppwriteException | null;
  isUploading: boolean;
  isDeleting: boolean;
  fetchUserFiles: () => Promise<void>;
  fetchFileById: (fileId: string) => Promise<UserFileData | null>;
  uploadFile: (options: UploadFileOptions) => Promise<UserFileData>;
  uploadHistoryArchive: (options: UploadFileOptions) => Promise<UserFileData>;
  uploadHistoryAudioArchive: (options: UploadFileOptions) => Promise<UserFileData>;
  uploadEventCoverPhoto: (options: UploadFileOptions) => Promise<UserFileData>;
  deleteFile: (fileDocumentId: string, storageFileId: string) => Promise<void>;
  deleteProfilePhoto: () => Promise<void>;
  deleteCoverPhoto: () => Promise<void>;
  updateProfilePhoto: (file: RNFile) => Promise<UserFileData>;
  updateCoverPhoto: (file: RNFile) => Promise<UserFileData>;
  getFileUrl: (fileId: string) => string;
  getFilesByType: (fileType: FileType) => UserFileData[];
  getProfilePhotoUrl: () => string | null;
  getCoverPhotoUrl: () => string | null;
  hasProfilePhoto: () => boolean;
  hasCoverPhoto: () => boolean;
  getAllApprovedHistoryArchives: () => Promise<UserFileData[]>;
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

    const getFileUrl = useCallback((fileId: string): string => {
  return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
}, []);


   const getHistoryArchiveUrl = useCallback((fileId: string): string => {

    return `${endpoint}/storage/buckets/${HISTORY_ARCHIVE_STORAGE_ID}/files/${fileId}/view?project=${projectId}`;
  }, []);

  const getHistoryAudioUrl = useCallback((fileId: string): string => {

    return `${endpoint}/storage/buckets/${uploadBucketsIds['history_audio']}/files/${fileId}/view?project=${projectId}`;
  }, []);
  
  const getHistoryAudioCoverUrl = useCallback((fileId: string): string => {

    return `${endpoint}/storage/buckets/${uploadBucketsIds['history_audio_covers']}/files/${fileId}/view?project=${projectId}`;
  }, []);

  const getEventCoverUrl = useCallback((fileId: string): string => {

    return `${endpoint}/storage/buckets/${uploadBucketsIds['event-cover-photo']}/files/${fileId}/view?project=${projectId}`;
  }, []);

  const prepareFileForUpload = useCallback((file: RNFile): RNFile => {
    return file;
  }, []);

  const fetchUserFiles = useCallback(async (): Promise<void> => {
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
        [
          Query.equal('user_id', user_id),
          Query.orderDesc('$createdAt')
        ]
      );

      const filesData: UserFileData[] = response.documents.map(doc => {
        let fileUrl = undefined;
        try {
          if (doc.file_type === 'document') {
            fileUrl = getHistoryArchiveUrl(doc.file_id);
          } else {
            fileUrl = getFileUrl(doc.file_id);
          }
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
          fileUrl,
          title: doc.title || '',
          description: doc.description || '',
          is_approved: true
        };
      });

      setFiles(filesData);

      const profilePhotoData = filesData.find(file => file.file_type === 'profile_photo');
      setProfilePhoto(profilePhotoData || null);

      const coverPhotoData = filesData.find(file => file.file_type === 'cover_photo');
      setCoverPhoto(coverPhotoData || null);

    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user files:', appwriteError.message);
      setError(appwriteError);
    } finally {
      setLoading(false);
    }
  }, [user_id, getFileUrl, getHistoryArchiveUrl]);

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
        if (doc.file_type === 'document') {
          fileUrl = getHistoryArchiveUrl(doc.file_id);
        } else {
          fileUrl = getFileUrl(doc.file_id);
        }
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
        fileUrl,
        title: doc.title || '',
        description: doc.description || '',
        is_approved: doc.is_approved || false
      };

      return fileData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching file by ID:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, [user_id, getFileUrl, getHistoryArchiveUrl]);

  const uploadFile = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
  try {
    setIsUploading(true);
    setError(null);

    const fileToUpload = options.file;

    if (!fileToUpload || !fileToUpload.uri) {
      throw new Error('Invalid file object: missing URI');
    }

    console.log('Uploading file to Appwrite...');
    console.log('File details:', {
      uri: fileToUpload.uri,
      name: fileToUpload.name,
      type: fileToUpload.type,
      size: fileToUpload.size
    });

    const archiveBucketToUploadToId = uploadBucketsIds[options.fileType];

    const fileId = ID.unique();
    console.log('Generated file ID:', fileId);

    const fileForUpload = {
      uri: fileToUpload.uri,
      name: fileToUpload.name || options.fileName || 'file.pdf',
      type: fileToUpload.type || 'application/octet-stream',
      size: fileToUpload.size || 0
    };

    console.log('File prepared for upload:', fileForUpload);

    const storageResponse = await storage.createFile(
      archiveBucketToUploadToId,
      fileId,
      fileForUpload
    );

    console.log('Upload successful, file ID:', storageResponse.$id);

    let coverPhotoUrl = undefined;
    let coverPhotoId = undefined;

    if (options.fileType === 'history_audio' && options.coverPhoto) {
      try {
        const coverBucketId = uploadBucketsIds['history_audio_covers'];
        
        if (!coverBucketId) {
          console.error('Cover bucket ID is missing');
          throw new Error('Cover bucket ID is not configured');
        }

        const coverFileId = ID.unique();
        console.log('Uploading cover photo to bucket:', coverBucketId);
        
        const coverFileForUpload = {
          uri: options.coverPhoto.uri,
          name: options.coverPhoto.name || 'cover.jpg',
          type: options.coverPhoto.type || 'image/jpeg',
          size: options.coverPhoto.size || 0
        };

        const coverResponse = await storage.createFile(
          coverBucketId,
          coverFileId,
          coverFileForUpload
        );
        
        coverPhotoId = coverResponse.$id;
        
        coverPhotoUrl = getHistoryAudioCoverUrl(coverResponse.$id);
        
        console.log('Cover photo uploaded successfully:', coverPhotoId);
        console.log('Cover photo URL:', coverPhotoUrl);
        
      } catch (coverError) {
        console.error('Error uploading cover photo:', coverError);
      }
    }

    const databaseData: any = {
      user_id: user_id,
      file_name: options.fileName || fileToUpload.name || 'file.pdf',
      file_type: options.fileType,
      uploaded_by: user_id,
      file_id: storageResponse.$id,
    };

    if (coverPhotoId) {
      databaseData.cover_photo_id = coverPhotoId;
    }

    if (options.title) databaseData.title = options.title;
    if (options.description) databaseData.description = options.description;
    if (options.is_approved !== undefined) databaseData.is_approved = options.is_approved;

    const databaseResponse = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      databaseData
    );

    const fileUrl = options.fileType === 'document' 
      ? getHistoryArchiveUrl(storageResponse.$id)
      : options.fileType === 'history_audio'
        ? getHistoryAudioUrl(storageResponse.$id)
        : getFileUrl(storageResponse.$id);

    const newFile: UserFileData = {
      user_id: databaseResponse.user_id,
      file_name: databaseResponse.file_name,
      file_type: databaseResponse.file_type,
      uploaded_by: databaseResponse.uploaded_by,
      file_id: databaseResponse.file_id,
      $id: databaseResponse.$id,
      createdAt: databaseResponse.$createdAt,
      updatedAt: databaseResponse.$updatedAt,
      fileUrl,
      title: databaseResponse.title || '',
      description: databaseResponse.description || '',
      is_approved: databaseResponse.is_approved || false,
      coverPhotoUrl: coverPhotoUrl, 
      coverPhotoId: coverPhotoId 
    };

    setFiles(prev => [newFile, ...prev]);

    if (options.fileType === 'profile_photo') {
      setProfilePhoto(newFile);
    } else if (options.fileType === 'cover_photo') {
      setCoverPhoto(newFile);
    }

    return newFile;

  } catch (err) {
    const appwriteError = err as AppwriteException;
    console.error('Error uploading file:', appwriteError.message);
    console.error('Full error:', err);
    setError(appwriteError);
    throw err;
  } finally {
    setIsUploading(false);
  }
}, [user_id, getHistoryAudioCoverUrl, getHistoryArchiveUrl, getHistoryAudioUrl, getFileUrl]);

  const uploadHistoryArchive = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
    return uploadFile({
      ...options,
      fileType: 'document',
      is_approved: false,
    });
  }, [uploadFile]);

  const uploadHistoryAudioArchive = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
    return uploadFile({
      ...options,
      fileType: 'history_audio',
      is_approved: false
    });
  }, [uploadFile]);

  const uploadEventCoverPhoto = useCallback(async (options: UploadFileOptions): Promise<UserFileData> => {
    return uploadFile({
      ...options,
      fileType: 'event-cover-photo',
      is_approved: false
    });
  }, [uploadFile]);

const getAllApprovedHistoryArchives = useCallback(async (): Promise<UserFileData[]> => {
  try {
    setError(null);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('file_type', ['document', 'history_audio']),
        Query.equal('is_approved', true), 
        Query.orderDesc('$createdAt')
      ]
    );

    const approvedFiles: UserFileData[] = await Promise.all(response.documents.map(async (doc) => {
      let fileUrl = undefined;
      let coverPhotoUrl = undefined;
      let coverPhotoId = undefined;
      
      try {
        if (doc.file_type === 'document') {
          fileUrl = getHistoryArchiveUrl(doc.file_id);
        } else if (doc.file_type === 'history_audio') {
          fileUrl = getHistoryAudioUrl(doc.file_id);
          
          if (doc.cover_photo_id) {
            coverPhotoId = doc.cover_photo_id;
            coverPhotoUrl = getHistoryAudioCoverUrl(doc.cover_photo_id);
          } else if (doc.coverPhotoId) {
            coverPhotoId = doc.coverPhotoId;
            coverPhotoUrl = getHistoryAudioCoverUrl(doc.coverPhotoId);
          }
        }
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
        fileUrl,
        title: doc.title || '',
        description: doc.description || '',
        is_approved: doc.is_approved || false,
        coverPhotoUrl: coverPhotoUrl,
        coverPhotoId: coverPhotoId
      };
    }));

    return approvedFiles;

  } catch (err) {
    const appwriteError = err as AppwriteException;
    console.error('Error fetching approved history archives:', appwriteError.message);
    setError(appwriteError);
    throw err;
  }
}, [getHistoryArchiveUrl, getHistoryAudioUrl, getHistoryAudioCoverUrl]);

  const deleteFile = useCallback(async (fileDocumentId: string, storageFileId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      const fileToDelete = files.find(f => f.$id === fileDocumentId);
      const bucketId = fileToDelete?.file_type === 'document' 
        ? HISTORY_ARCHIVE_STORAGE_ID 
        : STORAGE_BUCKET_ID;

      await storage.deleteFile(bucketId, storageFileId);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        fileDocumentId
      );

      setFiles(prev => prev.filter(f => f.$id !== fileDocumentId));

      if (fileToDelete?.file_type === 'profile_photo') {
        setProfilePhoto(null);
      } else if (fileToDelete?.file_type === 'cover_photo') {
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

  const deleteProfilePhoto = useCallback(async (): Promise<void> => {
    if (profilePhoto) {
      await deleteFile(profilePhoto.$id, profilePhoto.file_id);
    }
  }, [profilePhoto, deleteFile]);

  const deleteCoverPhoto = useCallback(async (): Promise<void> => {
    if (coverPhoto) {
      await deleteFile(coverPhoto.$id, coverPhoto.file_id);
    }
  }, [coverPhoto, deleteFile]);

  const updateProfilePhoto = useCallback(async (file: RNFile): Promise<UserFileData> => {
    return uploadFile({
      fileName: `profile_${user_id}_${Date.now()}.jpg`,
      fileType: 'profile_photo',
      is_approved: true,
      file
    });
  }, [user_id, uploadFile]);

  const updateCoverPhoto = useCallback(async (file: RNFile): Promise<UserFileData> => {
    return uploadFile({
      fileName: `cover_${user_id}_${Date.now()}.jpg`,
      fileType: 'cover_photo',
      is_approved: true,
      file
    });
  }, [user_id, uploadFile]);

  const getFilesByType = useCallback((fileType: FileType): UserFileData[] => {
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

  const hasProfilePhoto = useCallback((): boolean => {
    return !!profilePhoto;
  }, [profilePhoto]);

  const hasCoverPhoto = useCallback((): boolean => {
    return !!coverPhoto;
  }, [coverPhoto]);

  const resetError = useCallback((): void => setError(null), []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchUserFiles();
  }, [fetchUserFiles]);

  useEffect(() => {
    fetchUserFiles();
  }, [fetchUserFiles]);

  return {
    files,
    profilePhoto,
    coverPhoto,
    loading,
    error,
    isUploading,
    isDeleting,
    fetchUserFiles,
    fetchFileById,
    uploadFile,
    uploadHistoryArchive,
    uploadHistoryAudioArchive,
    uploadEventCoverPhoto,
    deleteFile,
    deleteProfilePhoto,
    deleteCoverPhoto,
    updateProfilePhoto,
    updateCoverPhoto,
    getFileUrl,
    getFilesByType,
    getProfilePhotoUrl,
    getCoverPhotoUrl,
    hasProfilePhoto,
    hasCoverPhoto,
    getAllApprovedHistoryArchives,
    resetError,
    refresh
  };
}