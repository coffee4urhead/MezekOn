import { client } from '@/hooks/appwrite';
import { Account, AppwriteException } from 'appwrite';
import { Alert } from 'react-native';

export const checkCurrentSession = async () => {
    try {
      const account = new Account(client);
      const user = await account.get();
      console.log('Already logged in:', user);
      Alert.alert('Info', `Already logged in as: ${user.email || user.$id}`);
      return true
    } catch (error: any) {
      console.log('Not logged in');
      return false;
    }
};

function matchBucketIds(bucket_to_look_for: string) {
  switch (bucket_to_look_for) {
    case 'documents':
      break;
    case 'word_photos':
      break;
    case 'profile_pictures':
      return process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID;
    case 'pronunciation_audio':
      break;
    default:
      throw new Error('The bucket you are looking for is unavailable!');
  }
}

export async function fetchProfilePhoto(fileId: string, bucket_to_look_into: string) {
  try {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
  
  let actual_bucket_id = matchBucketIds(bucket_to_look_into);
    
    return `${endpoint}/storage/buckets/${actual_bucket_id}/files/${fileId}/preview?project=${projectId}&width=200&height=200&gravity=center&quality=90`;
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error('Failed to fetch photo:', appwriteError.message);
    return null; 
  }
}