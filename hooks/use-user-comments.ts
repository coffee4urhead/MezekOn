import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';
import { useArtickles } from './use-user-artickles';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_COMMENTS || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for comments');
}

export interface CommentData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  artickle_id: string;
  author_id: string;
  is_reply: boolean;
  reply_to_comment_id: string | null;
  comment_content: string;
}

export interface CreateCommentInput {
  artickle_id: string;
  author_id: string;
  comment_content: string;
  is_reply?: boolean;
  reply_to_comment_id?: string | null;
}

export interface UpdateCommentInput extends Partial<CreateCommentInput> {
  id: string;
}

interface UseCommentsReturn {
  comments: CommentData[];
  comment: CommentData | null;
  loading: boolean;
  error: AppwriteException | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  createComment: (input: CreateCommentInput) => Promise<CommentData>;
  updateComment: (input: UpdateCommentInput) => Promise<CommentData>;
  deleteComment: (commentId: string) => Promise<void>;
  getCommentById: (commentId: string) => Promise<CommentData | null>;
  
  fetchCommentsByArticle: (articleId: string, options?: { limit?: number; offset?: number }) => Promise<CommentData[]>;
  fetchRepliesByComment: (commentId: string, options?: { limit?: number; offset?: number }) => Promise<CommentData[]>;
  fetchCommentsByAuthor: (authorId: string, options?: { limit?: number; offset?: number }) => Promise<CommentData[]>;
  fetchAllComments: (options?: { limit?: number; offset?: number }) => Promise<CommentData[]>;
  fetchRecentComments: (limit?: number) => Promise<CommentData[]>;
  
  resetError: () => void;
  refresh: () => Promise<void>;
  
  setCurrentComment: (comment: CommentData | null) => void;
  clearCurrentComment: () => void;
}

export function useComments(initialCommentId?: string): UseCommentsReturn {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [comment, setComment] = useState<CommentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { incrementComments } = useArtickles();
  
  const createComment = useCallback(async (input: CreateCommentInput): Promise<CommentData> => {
  try {
    setIsCreating(true);
    setError(null);

    const commentData = {
      artickle_id: input.artickle_id,
      author_id: input.author_id,
      comment_content: input.comment_content,
      is_reply: input.is_reply || false,
      reply_to_comment_id: input.reply_to_comment_id || null,
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      commentData
    );

    const newComment: CommentData = {
      $id: response.$id,
      $createdAt: response.$createdAt,
      $updatedAt: response.$updatedAt,
      artickle_id: response.artickle_id,
      author_id: response.author_id,
      is_reply: response.is_reply || false,
      reply_to_comment_id: response.reply_to_comment_id || null,
      comment_content: response.comment_content,
    };

    setComments(prev => [newComment, ...prev]);
    setComment(newComment);
    await incrementComments(input.artickle_id);

    return newComment;
  } catch (err) {
    const appwriteError = err as AppwriteException;
    console.error('Error creating comment:', appwriteError.message);
    setError(appwriteError);
    throw err;
  } finally {
    setIsCreating(false);
  }
}, []);

  const updateComment = useCallback(async (input: UpdateCommentInput): Promise<CommentData> => {
    try {
      setIsUpdating(true);
      setError(null);

      const { id, ...updateData } = input;
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        updateData
      );

      const updatedComment: CommentData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        artickle_id: response.artickle_id,
        author_id: response.author_id,
        is_reply: response.is_reply || false,
        reply_to_comment_id: response.reply_to_comment_id || null,
        comment_content: response.comment_content,
      };

      setComments(prev => prev.map(c => c.$id === id ? updatedComment : c));
      
      if (comment?.$id === id) {
        setComment(updatedComment);
      }
      
      return updatedComment;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating comment:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [comment]);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      const replies = await fetchRepliesByComment(commentId);
      for (const reply of replies) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          reply.$id
        );
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        commentId
      );

      setComments(prev => prev.filter(c => c.$id !== commentId));
      
      if (comment?.$id === commentId) {
        setComment(null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting comment:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [comment]);

  const getCommentById = useCallback(async (commentId: string): Promise<CommentData | null> => {
    try {
      setError(null);

      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        commentId
      );

      const commentData: CommentData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        artickle_id: response.artickle_id,
        author_id: response.author_id,
        is_reply: response.is_reply || false,
        reply_to_comment_id: response.reply_to_comment_id || null,
        comment_content: response.comment_content,
      };

      return commentData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching comment:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, []);

  const fetchCommentsByArticle = useCallback(async (
    articleId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<CommentData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('artickle_id', articleId),
        Query.equal('is_reply', false),
        Query.orderDesc('$createdAt')
      ];

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options?.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const fetchedComments: CommentData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        artickle_id: doc.artickle_id,
        author_id: doc.author_id,
        is_reply: doc.is_reply || false,
        reply_to_comment_id: doc.reply_to_comment_id || null,
        comment_content: doc.comment_content,
      }));

      setComments(fetchedComments);
      return fetchedComments;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching article comments:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepliesByComment = useCallback(async (
    commentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<CommentData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('reply_to_comment_id', commentId),
        Query.equal('is_reply', true),
        Query.orderAsc('$createdAt')
      ];

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options?.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const fetchedReplies: CommentData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        artickle_id: doc.artickle_id,
        author_id: doc.author_id,
        is_reply: doc.is_reply || false,
        reply_to_comment_id: doc.reply_to_comment_id || null,
        comment_content: doc.comment_content,
      }));

      return fetchedReplies;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching comment replies:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommentsByAuthor = useCallback(async (
    authorId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<CommentData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.equal('author_id', authorId),
        Query.orderDesc('$createdAt')
      ];

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options?.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const authorComments: CommentData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        artickle_id: doc.artickle_id,
        author_id: doc.author_id,
        is_reply: doc.is_reply || false,
        reply_to_comment_id: doc.reply_to_comment_id || null,
        comment_content: doc.comment_content,
      }));

      setComments(authorComments);
      return authorComments;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching author comments:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllComments = useCallback(async (options?: { limit?: number; offset?: number }): Promise<CommentData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.orderDesc('$createdAt')
      ];

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options?.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const allComments: CommentData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        artickle_id: doc.artickle_id,
        author_id: doc.author_id,
        is_reply: doc.is_reply || false,
        reply_to_comment_id: doc.reply_to_comment_id || null,
        comment_content: doc.comment_content,
      }));

      setComments(allComments);
      return allComments;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching all comments:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentComments = useCallback(async (limit: number = 20): Promise<CommentData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );

      const recentComments: CommentData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        artickle_id: doc.artickle_id,
        author_id: doc.author_id,
        is_reply: doc.is_reply || false,
        reply_to_comment_id: doc.reply_to_comment_id || null,
        comment_content: doc.comment_content,
      }));

      return recentComments;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching recent comments:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentComment = useCallback((commentData: CommentData | null) => {
    setComment(commentData);
  }, []);

  const clearCurrentComment = useCallback(() => {
    setComment(null);
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllComments();
  }, [fetchAllComments]);

  useEffect(() => {
    if (initialCommentId) {
      getCommentById(initialCommentId).then(commentData => {
        if (commentData) {
          setComment(commentData);
          setLoading(false);
        }
      });
    } else {
      fetchAllComments();
    }
  }, [initialCommentId]);

  return {
    comments,
    comment,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
    
    fetchCommentsByArticle,
    fetchRepliesByComment,
    fetchCommentsByAuthor,
    fetchAllComments,
    fetchRecentComments,
    
    resetError,
    refresh,
    
    setCurrentComment,
    clearCurrentComment,
  };
}