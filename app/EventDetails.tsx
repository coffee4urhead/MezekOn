import AnnouncementCard from '@/components/AnnouncementCard';
import { useTheme } from '@/context/ThemeContext';
import { EventData, useEvents } from '@/hooks/use-events';
import { AnnouncementData, useAnnouncements } from '@/hooks/use-user-announcements';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventDetails() {
  const router = useRouter();
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const { getEventById, loading } = useEvents();
  const { fetchAnnouncementsByEvent } = useAnnouncements();

  const [event, setEvent] = useState<EventData | null>(null);
  const [announcements, setAnnouncement] = useState<AnnouncementData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { id } = params;

  useEffect(() => {
    if (id) {
      loadEvent();
      loadEventAnnouncements(id as string);
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const eventData = await getEventById(id as string);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventAnnouncements = async (eventID: string) => {
    try {
      setIsLoading(true);
      const announcementData = await fetchAnnouncementsByEvent(eventID as string);
      setAnnouncement(announcementData);
    } catch (error) {
      console.error('Error loading announcements for the event:', error);
    } finally {
      setIsLoading(false);
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("bg-BG", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWeekday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      weekday: 'long'
    });
  };

  const handleOpenMaps = () => {
    if (event?.googleMapsUrl) {
      Linking.openURL(event.googleMapsUrl);
    }
  };

  const handleCallOrganizer = () => {
    if (event?.organizerPhone) {
      Linking.openURL(`tel:${event.organizerPhone}`);
    }
  };

  const handleEmailOrganizer = () => {
    if (event?.organizerEmail) {
      Linking.openURL(`mailto:${event.organizerEmail}`);
    }
  };

  if (isLoading || loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Зареждане...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Събитието не беше намерено</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {event.coverPhoto ? (
          <View style={styles.coverPhotoContainer}>
            <Image source={{ uri: event.coverPhoto }} style={styles.coverPhoto} />
          </View>
        ) : (
          <View style={[styles.coverPhotoPlaceholder, { backgroundColor: isDark ? '#333333' : '#e0e0e0' }]}>
            <Ionicons name="calendar-outline" size={64} color={isDark ? '#666666' : '#999999'} />
          </View>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Събитие</Text>
          </View>

          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1a1a1a' }]}>
            {event.title}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {formatDate(event.eventStartDate)}, {getWeekday(event.eventStartDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {formatTime(event.eventStartDate)}
              {event.eventEndDate && ` - ${formatTime(event.eventEndDate)}`}
            </Text>
          </View>

          <TouchableOpacity style={styles.infoRow} onPress={handleOpenMaps}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={[styles.infoText, styles.locationText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {event.eventAddress}
            </Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>

          {event.maxAttendees && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
                Максимален брой участници: {event.maxAttendees}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Статус: {event.status === 'incoming' ? 'Предстоящо' : event.status === 'completed' ? 'Завършено' : 'Отменено'}
            </Text>
          </View>

          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
                За събитието
              </Text>
              <Text style={[styles.descriptionText, { color: isDark ? '#cccccc' : '#666666' }]}>
                {event.description}
              </Text>
            </View>
          )}

          {announcements && announcements.map((ann: AnnouncementData) => (
            <AnnouncementCard
              key={ann.$id}
              $id={ann.$id}
              $createdAt={ann.$createdAt}
              $updatedAt={ann.$updatedAt}
              eventID={event.$id}
              title={ann.title}
              content={ann.content}
              isPinned={ann.isPinned}
              isUrgent={ann.isUrgent}
              tags={ann.tags || ['събитие']}
              createdAt={ann.$createdAt}
              updatedAt={ann.$updatedAt}
              authorID={ann.authorID}
            />
          ))}

          {event.organizerName && (
            <View style={styles.organizerSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
                Организатор
              </Text>
              <Text style={[styles.organizerName, { color: isDark ? '#cccccc' : '#333333' }]}>
                {event.organizerName}
              </Text>

              <View style={styles.contactButtons}>
                {event.organizerPhone && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleCallOrganizer}>
                    <Ionicons name="call-outline" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Обади се</Text>
                  </TouchableOpacity>
                )}
                {event.organizerEmail && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleEmailOrganizer}>
                    <Ionicons name="mail-outline" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Имейл</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.attendButton}>
            <Text style={styles.attendButtonText}>📅 Ще присъствам</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 250,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
    paddingTop: 16,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    flex: 1,
  },
  descriptionSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  organizerSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  contactButtonText: {
    color: '#007AFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  attendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  attendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});