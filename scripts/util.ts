import { account, client } from '@/hooks/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { Account, AppwriteException, ID } from 'react-native-appwrite';

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

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Expo push token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (token) {
    await registerTokenWithAppwrite(token);
  }

  return token;
}

async function registerTokenWithAppwrite(expoToken: string) {
  try {
    const user = await account.get();
    
    const targetId = await AsyncStorage.getItem('pushTargetId');
    
    if (!targetId) {
      const target = await account.createPushTarget(
        ID.unique(),
        expoToken,
      );
      await AsyncStorage.setItem('pushTargetId', target.$id);
      console.log('Push target created:', target.$id);
    } else {
      await account.updatePushTarget(targetId, expoToken);
      console.log('Push target updated:', targetId);
    }
  } catch (error) {
    console.error('Error registering token with Appwrite:', error);
  }
}