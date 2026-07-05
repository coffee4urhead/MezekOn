
export const generatePDFThumbnail = async (
  fileId: string, 
  fileUrl: string,
  bucketId: string
): Promise<string | null> => {
  try {
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
    
    const previewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}&page=1&width=150&height=200&quality=80`;
    
    console.log('Generated PDF preview URL:', previewUrl);
    return previewUrl;
  } catch (error) {
    console.error('Error generating PDF preview URL:', error);
    return null;
  }
};

export const clearPDFThumbnails = async (): Promise<void> => {
  console.log('Using preview URLs, no cache to clear');
};

export const getCachedThumbnailPath = async (fileId: string): Promise<string | null> => {
  return null;
};