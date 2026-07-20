import { EventData } from '@/hooks/use-events';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventCard({ 
  $id,
  title,
  description,
  coverPhoto,
  eventAddress,
  eventStartDate,
  eventEndDate,
  organizerName,
  googleMapsUrl,
  organizerEmail,
  organizerPhone,
  maxAttendees,
  status,
}: EventData) {
    const router = useRouter();

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

  const getDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  const getMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      month: 'short'
    }).toUpperCase();
  };

  const getWeekday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      weekday: 'long'
    });
  };

  const getCategoryIcon = (title: string) => {
    return 'calendar-outline';
  };

  const navigateToDetailsScreen = () => {
    router.push({
      pathname: '/EventDetails', 
      params: {
        id: $id,
        title: title,
        description: description,
        coverPhoto: coverPhoto,
        eventAddress: eventAddress,
        googleMapsUrl: googleMapsUrl,
        eventStartDate: eventStartDate,
        eventEndDate: eventEndDate,
        organizerName: organizerName,
        organizerEmail: organizerEmail,
        organizerPhone: organizerPhone,
        maxAttendees: maxAttendees,
        status: status,
      }
    });
  };

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7} onPress={navigateToDetailsScreen}>
      <View style={styles.dateSection}>
        <View style={styles.dateBox}>
          <Text style={styles.dayText}>{getDay(eventStartDate)}</Text>
          <Text style={styles.monthText}>{getMonth(eventStartDate)}</Text>
        </View>
      </View>

      <View style={styles.detailsSection}>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.eventDate}>
          {formatDate(eventStartDate)}, {getWeekday(eventStartDate)}
        </Text>
        <Text style={styles.eventTime}>
          {formatTime(eventStartDate)}
          {eventEndDate && ` - ${formatTime(eventEndDate)}`}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.eventLocation} numberOfLines={1}>
            {eventAddress}
          </Text>
        </View>

        {organizerName && (
          <Text style={styles.organizerName}>
            {organizerName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dateSection: {
    marginRight: 12,
    justifyContent: 'center',
  },
  dateBox: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  dayText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 22,
  },
  eventDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  organizerName: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});