// app/event-details.tsx or components/EventDetails.tsx
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventDetails() {
  const router = useRouter();
  const { isDark } = useTheme();
  const params = useLocalSearchParams();

  const {
    id,
    title,
    description,
    coverPhoto,
    eventAddress,
    googleMapsUrl,
    eventStartDate,
    eventEndDate,
    organizerName,
    organizerEmail,
    organizerPhone,
    maxAttendees,
    status,
    category,
  } = params;

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
    if (googleMapsUrl) {
      Linking.openURL(googleMapsUrl as string);
    }
  };

  const handleCallOrganizer = () => {
    if (organizerPhone) {
      Linking.openURL(`tel:${organizerPhone}`);
    }
  };

  const handleEmailOrganizer = () => {
    if (organizerEmail) {
      Linking.openURL(`mailto:${organizerEmail}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
        </TouchableOpacity>

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category || 'Събитие'}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1a1a1a' }]}>
            {title}
          </Text>

          {/* Date and Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {formatDate(eventStartDate as string)}, {getWeekday(eventStartDate as string)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {formatTime(eventStartDate as string)}
              {eventEndDate && ` - ${formatTime(eventEndDate as string)}`}
            </Text>
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.infoRow} onPress={handleOpenMaps}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={[styles.infoText, styles.locationText, { color: isDark ? '#cccccc' : '#666666' }]}>
              {eventAddress}
            </Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>

          {/* Attendees */}
          {maxAttendees && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
                Максимален брой участници: {maxAttendees}
              </Text>
            </View>
          )}

          {/* Status */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={[styles.infoText, { color: isDark ? '#cccccc' : '#666666' }]}>
              Статус: {status === 'incoming' ? 'Предстоящо' : status === 'completed' ? 'Завършено' : 'Отменено'}
            </Text>
          </View>

          {/* Description */}
          {description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
                За събитието
              </Text>
              <Text style={[styles.descriptionText, { color: isDark ? '#cccccc' : '#666666' }]}>
                {description}
              </Text>
            </View>
          )}

          {/* Organizer */}
          {organizerName && (
            <View style={styles.organizerSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
                Организатор
              </Text>
              <Text style={[styles.organizerName, { color: isDark ? '#cccccc' : '#333333' }]}>
                {organizerName}
              </Text>

              {/* Contact Buttons */}
              <View style={styles.contactButtons}>
                {organizerPhone && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleCallOrganizer}>
                    <Ionicons name="call-outline" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Обади се</Text>
                  </TouchableOpacity>
                )}
                {organizerEmail && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleEmailOrganizer}>
                    <Ionicons name="mail-outline" size={20} color="#007AFF" />
                    <Text style={styles.contactButtonText}>Имейл</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Attend Button */}
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  coverPhoto: {
    width: '100%',
    height: 250,
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
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