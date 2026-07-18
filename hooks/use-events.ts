import { useCallback, useEffect, useState } from 'react';
import { AppwriteException, ID, Query } from 'react-native-appwrite';
import { databases } from './appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_DATABASE_EVENTS_COLLECTION_ID || '';

if (!DATABASE_ID || !COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables for events');
}

export type EventStatus = 'completed' | 'cancelled' | 'incoming';

export interface EventData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  
  title: string;
  description: string;
  coverPhoto?: string;
  eventAddress: string;
  googleMapsUrl: string;
  
  eventStartDate: string;
  eventEndDate?: string;
  
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  
  maxAttendees?: number;
  
  status: EventStatus;
  authorID: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  coverPhoto?: string;
  
  eventAddress: string;
  googleMapsUrl: string;
  
  eventStartDate: string;
  eventEndDate?: string;
  
  organizerName: string;
  organizerEmail?: string;
  organizerPhone?: string;
  
  maxAttendees?: number;
  
  status: EventStatus;
  authorID: string;  
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

interface UseEventsReturn {
  events: EventData[];
  event: EventData | null;
  loading: boolean;
  error: AppwriteException | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  createEvent: (input: CreateEventInput) => Promise<EventData>;
  updateEvent: (input: UpdateEventInput) => Promise<EventData>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId: string) => Promise<EventData | null>;
  
  fetchAllEvents: (options?: { limit?: number; offset?: number }) => Promise<EventData[]>;
  fetchUserEvents: (userId: string) => Promise<EventData[]>;
  fetchEventsByStatus: (status: EventStatus) => Promise<EventData[]>;
  fetchUpcomingEvents: (limit?: number) => Promise<EventData[]>;
  fetchPastEvents: (limit?: number) => Promise<EventData[]>;
  
  getEventStatus: (event: EventData) => EventStatus;
  isEventUpcoming: (event: EventData) => boolean;
  isEventPast: (event: EventData) => boolean;
  isEventOngoing: (event: EventData) => boolean;
  resetError: () => void;
  refresh: () => Promise<void>;
  
  setCurrentEvent: (event: EventData | null) => void;
  clearCurrentEvent: () => void;
}

export function useEvents(initialEventId?: string): UseEventsReturn {
  const [events, setEvents] = useState<EventData[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppwriteException | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getEventStatus = useCallback((eventData: EventData): EventStatus => {
    const now = new Date();
    const startDate = new Date(eventData.eventStartDate);
    const endDate = eventData.eventEndDate ? new Date(eventData.eventEndDate) : null;

    if (eventData.status === 'cancelled') return 'cancelled';
    if (eventData.status === 'completed') return 'completed';
    
    if (endDate && now > endDate) return 'completed';
    if (now < startDate) return 'incoming';
    
    return 'incoming';
  }, []);

  const isEventUpcoming = useCallback((eventData: EventData): boolean => {
    const now = new Date();
    const startDate = new Date(eventData.eventStartDate);
    return now < startDate && eventData.status !== 'cancelled' && eventData.status !== 'completed';
  }, []);

  const isEventPast = useCallback((eventData: EventData): boolean => {
    const now = new Date();
    const endDate = eventData.eventEndDate ? new Date(eventData.eventEndDate) : new Date(eventData.eventStartDate);
    return now > endDate || eventData.status === 'completed' || eventData.status === 'cancelled';
  }, []);

  const isEventOngoing = useCallback((eventData: EventData): boolean => {
    const now = new Date();
    const startDate = new Date(eventData.eventStartDate);
    const endDate = eventData.eventEndDate ? new Date(eventData.eventEndDate) : new Date(eventData.eventStartDate);
    return now >= startDate && now <= endDate && 
           eventData.status !== 'cancelled' && 
           eventData.status !== 'completed';
  }, []);

  const createEvent = useCallback(async (input: CreateEventInput): Promise<EventData> => {
    try {
      setIsCreating(true);
      setError(null);

      const { ...eventData } = input;

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        eventData
      );

      const newEvent: EventData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        description: response.description,
        coverPhoto: response.coverPhoto,
        eventAddress: response.eventAddress,
        googleMapsUrl: response.googleMapsUrl,
        eventStartDate: response.eventStartDate,
        eventEndDate: response.eventEndDate,
        organizerName: response.organizerName,
        organizerEmail: response.organizerEmail || '',
        organizerPhone: response.organizerPhone || '',
        maxAttendees: response.maxAttendees,
        status: response.status,
        authorID: response.authorID,
      };

      setEvents(prev => [newEvent, ...prev]);
      setEvent(newEvent);
      
      return newEvent;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error creating event:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateEvent = useCallback(async (input: UpdateEventInput): Promise<EventData> => {
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

      const updatedEvent: EventData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        description: response.description,
        coverPhoto: response.coverPhoto,
        eventAddress: response.eventAddress,
        googleMapsUrl: response.googleMapsUrl,
        eventStartDate: response.eventStartDate,
        eventEndDate: response.eventEndDate,
        organizerName: response.organizerName,
        organizerEmail: response.organizerEmail || '',
        organizerPhone: response.organizerPhone || '',
        maxAttendees: response.maxAttendees,
        status: response.status,
        authorID: response.authorID,
      };

      setEvents(prev => prev.map(e => e.$id === id ? updatedEvent : e));
      
      if (event?.$id === id) {
        setEvent(updatedEvent);
      }
      
      return updatedEvent;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error updating event:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [event]);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        eventId
      );

      setEvents(prev => prev.filter(e => e.$id !== eventId));
      
      if (event?.$id === eventId) {
        setEvent(null);
      }
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error deleting event:', appwriteError.message);
      setError(appwriteError);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [event]);

  const getEventById = useCallback(async (eventId: string): Promise<EventData | null> => {
    try {
      setError(null);

      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        eventId
      );

      const eventData: EventData = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        title: response.title,
        description: response.description,
        coverPhoto: response.coverPhoto,
        eventAddress: response.eventAddress,
        googleMapsUrl: response.googleMapsUrl,
        eventStartDate: response.eventStartDate,
        eventEndDate: response.eventEndDate,
        organizerName: response.organizerName,
        organizerEmail: response.organizerEmail || '',
        organizerPhone: response.organizerPhone || '',
        maxAttendees: response.maxAttendees,
        status: response.status,
        authorID: response.authorID,
      };

      return eventData;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching event:', appwriteError.message);
      setError(appwriteError);
      return null;
    }
  }, []);

  const fetchAllEvents = useCallback(async (options?: { limit?: number; offset?: number }): Promise<EventData[]> => {
    try {
      setLoading(true);
      setError(null);

      const queries: any[] = [
        Query.orderDesc('eventStartDate')
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

      const fetchedEvents: EventData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        description: doc.description,
        coverPhoto: doc.coverPhoto,
        eventAddress: doc.eventAddress,
        googleMapsUrl: doc.googleMapsUrl,
        eventStartDate: doc.eventStartDate,
        eventEndDate: doc.eventEndDate,
        organizerName: doc.organizerName,
        organizerEmail: doc.organizerEmail || '',
        organizerPhone: doc.organizerPhone || '',
        maxAttendees: doc.maxAttendees,
        status: doc.status,
        authorID: doc.authorID,
      }));

      setEvents(fetchedEvents);
      return fetchedEvents;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching events:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserEvents = useCallback(async (userId: string): Promise<EventData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('authorID', userId),
          Query.orderDesc('eventStartDate')
        ]
      );

      const userEvents: EventData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        description: doc.description,
        coverPhoto: doc.coverPhoto,
        eventAddress: doc.eventAddress,
        googleMapsUrl: doc.googleMapsUrl,
        eventStartDate: doc.eventStartDate,
        eventEndDate: doc.eventEndDate,
        organizerName: doc.organizerName,
        organizerEmail: doc.organizerEmail || '',
        organizerPhone: doc.organizerPhone || '',
        maxAttendees: doc.maxAttendees,
        status: doc.status,
        authorID: doc.authorID,
      }));

      setEvents(userEvents);
      return userEvents;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching user events:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventsByStatus = useCallback(async (status: EventStatus): Promise<EventData[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', status),
          Query.orderDesc('eventStartDate')
        ]
      );

      const statusEvents: EventData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        description: doc.description,
        coverPhoto: doc.coverPhoto,
        eventAddress: doc.eventAddress,
        googleMapsUrl: doc.googleMapsUrl,
        eventStartDate: doc.eventStartDate,
        eventEndDate: doc.eventEndDate,
        organizerName: doc.organizerName,
        organizerEmail: doc.organizerEmail || '',
        organizerPhone: doc.organizerPhone || '',
        maxAttendees: doc.maxAttendees,
        status: doc.status,
        authorID: doc.authorID,
      }));

      return statusEvents;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching events by status:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingEvents = useCallback(async (limit?: number): Promise<EventData[]> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();
      const queries: any[] = [
        Query.equal('status', 'incoming'),
        Query.greaterThan('eventStartDate', now),
        Query.orderAsc('eventStartDate')
      ];

      if (limit) {
        queries.push(Query.limit(limit));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const upcomingEvents: EventData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        description: doc.description,
        coverPhoto: doc.coverPhoto,
        eventAddress: doc.eventAddress,
        googleMapsUrl: doc.googleMapsUrl,
        eventStartDate: doc.eventStartDate,
        eventEndDate: doc.eventEndDate,
        organizerName: doc.organizerName,
        organizerEmail: doc.organizerEmail || '',
        organizerPhone: doc.organizerPhone || '',
        maxAttendees: doc.maxAttendees,
        status: doc.status,
        authorID: doc.authorID,
      }));

      return upcomingEvents;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching upcoming events:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPastEvents = useCallback(async (limit?: number): Promise<EventData[]> => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();
      const queries: any[] = [
        Query.equal('status', 'completed'),
        Query.lessThan('eventStartDate', now),
        Query.orderDesc('eventStartDate')
      ];

      if (limit) {
        queries.push(Query.limit(limit));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      const pastEvents: EventData[] = response.documents.map(doc => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt,
        title: doc.title,
        description: doc.description,
        coverPhoto: doc.coverPhoto,
        eventAddress: doc.eventAddress,
        googleMapsUrl: doc.googleMapsUrl,
        eventStartDate: doc.eventStartDate,
        eventEndDate: doc.eventEndDate,
        organizerName: doc.organizerName,
        organizerEmail: doc.organizerEmail || '',
        organizerPhone: doc.organizerPhone || '',
        maxAttendees: doc.maxAttendees,
        status: doc.status,
        authorID: doc.authorID,
      }));

      return pastEvents;
    } catch (err) {
      const appwriteError = err as AppwriteException;
      console.error('Error fetching past events:', appwriteError.message);
      setError(appwriteError);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentEvent = useCallback((eventData: EventData | null) => {
    setEvent(eventData);
  }, []);

  const clearCurrentEvent = useCallback(() => {
    setEvent(null);
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchAllEvents();
  }, [fetchAllEvents]);

  useEffect(() => {
    if (initialEventId) {
      getEventById(initialEventId).then(eventData => {
        if (eventData) {
          setEvent(eventData);
          setLoading(false);
        }
      });
    } else {
      fetchAllEvents();
    }
  }, [initialEventId]);

  return {
    events,
    event,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    
    fetchAllEvents,
    fetchUserEvents,
    fetchEventsByStatus,
    fetchUpcomingEvents,
    fetchPastEvents,
    
    getEventStatus,
    isEventUpcoming,
    isEventPast,
    isEventOngoing,
    resetError,
    refresh,
    
    setCurrentEvent,
    clearCurrentEvent,
  };
}