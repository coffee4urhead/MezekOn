import {
  Account,
  Client,
  Databases,
  Functions,
  Messaging,
  Storage
} from 'react-native-appwrite';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);
const account = new Account(client);    
const messaging = new Messaging(client);

export {
  account, client,
  databases,
  functions, messaging, storage
};
