import { useEffect, useState } from 'react';

export const usePDFThumbnail = (fileId: string, fileUrl: string, fileType: string) => {
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThumbnail = async () => {
      if (fileType !== 'document' || !fileId || !fileUrl) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
        const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
        const bucketId = process.env.EXPO_PUBLIC_STORAGE_HISTORY_ARCHIVE_ID || '';
        
        const previewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}&page=1&width=150&height=200&quality=80`;
        
        if (isMounted) {
          setThumbnailPath(previewUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setThumbnailPath(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
    };
  }, [fileId, fileUrl, fileType]);

  return { thumbnailPath, isLoading, error };
};