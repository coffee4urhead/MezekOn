import { databases } from '@/hooks/appwrite';
import { Query } from 'react-native-appwrite';
import { ModerationRef } from '../stores/moderatorStore';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_FILES || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite env vars for moderation sync');
}

export interface ModerationSnapshot {
  audioRefs: ModerationRef[];
  pdfRefs: ModerationRef[];
}

const PAGE_SIZE = 100;

async function fetchAllUnapproved(
  fileTypes: string[],
): Promise<{ file_id: string; $id: string; file_type: string }[]> {
  const results: { file_id: string; $id: string; file_type: string }[] = [];
  let offset = 0;

  while (true) {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('file_type', fileTypes),
      Query.equal('is_approved', false),
      Query.orderDesc('$createdAt'),
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ]);

    for (const doc of response.documents) {
      results.push({
        file_id: doc.file_id,
        $id: doc.$id,
        file_type: doc.file_type,
      });
    }

    if (response.documents.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return results;
}

export async function fetchUnapprovedForModeration(): Promise<ModerationSnapshot> {
  const docs = await fetchAllUnapproved(['document', 'history_audio']);

  const audioRefs: ModerationRef[] = [];
  const pdfRefs: ModerationRef[] = [];

  for (const doc of docs) {
    const ref: ModerationRef = [doc.file_id, doc.$id];

    if (doc.file_type === 'document') {
      pdfRefs.push(ref);
    } else if (doc.file_type === 'history_audio') {
      audioRefs.push(ref);
    }
  }

  return { audioRefs, pdfRefs };
}