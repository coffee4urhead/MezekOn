import EventCard from '@/components/EventCard';
import { useTheme } from '@/context/ThemeContext';
import { EventData, useEvents } from '@/hooks/use-events';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CreateButton, { CreationScreen } from '../ui/CreateButton';

type EventFilter = 'upcoming' | 'past';

export default function Events() {
  const { isDark } = useTheme();
  const {
    events,
    loading,
    error,
    fetchAllEvents,
    fetchUpcomingEvents,
    fetchPastEvents,
    refresh,
  } = useEvents();

  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EventFilter>('upcoming');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const all = await fetchAllEvents();
      setAllEvents(all);
      
      const upcoming = await fetchUpcomingEvents();
      const past = await fetchPastEvents();
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);
      
      setDebugInfo(`Total: ${all.length}, Upcoming: ${upcoming.length}, Past: ${past.length}`);
    } catch (err) {
      console.error('Error loading events:', err);
      setDebugInfo(`Error: ${err}`);
    }
  };

  const getCurrentEvents = () => {
    if (selectedFilter === 'upcoming') {
      return upcomingEvents.length > 0 ? upcomingEvents : 
             (allEvents.length > 0 ? allEvents : []);
    } else {
      return pastEvents.length > 0 ? pastEvents : [];
    }
  };

  const getCurrentTitle = () => {
    return selectedFilter === 'upcoming' ? '🎯 Предстоящи събития' : '📚 Минали събития';
  };

  const getEmptyMessage = () => {
    return selectedFilter === 'upcoming' 
      ? 'Няма предстоящи събития в момента. Очаквайте информация!'
      : 'Няма минали събития в архива.';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <Text style={{ color: isDark ? '#ffffff' : '#333333' }}>Зареждане на събития...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <Text style={{ color: '#ff4444' }}>Грешка при зареждане на събития: {error.message}</Text>
      </View>
    );
  }

  const currentEvents = getCurrentEvents();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={[styles.filterContainer, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'upcoming' && styles.filterButtonActive,
              { 
                backgroundColor: selectedFilter === 'upcoming' 
                  ? (isDark ? '#444444' : '#e0e0e0') 
                  : 'transparent' 
              }
            ]}
            onPress={() => setSelectedFilter('upcoming')}>
            <View style={styles.filterButtonContent}>
              <Text style={[
                styles.filterButtonText,
                { 
                  color: selectedFilter === 'upcoming' 
                    ? (isDark ? '#ffffff' : '#000000') 
                    : (isDark ? '#999999' : '#666666') 
                }
              ]}>
                📅 Предстоящи
              </Text>
              {upcomingEvents.length > 0 && (
                <View style={[styles.badge, { backgroundColor: isDark ? '#007AFF' : '#007AFF' }]}>
                  <Text style={styles.badgeText}>{upcomingEvents.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'past' && styles.filterButtonActive,
              { 
                backgroundColor: selectedFilter === 'past' 
                  ? (isDark ? '#444444' : '#e0e0e0') 
                  : 'transparent' 
              }
            ]}
            onPress={() => setSelectedFilter('past')}>
            <View style={styles.filterButtonContent}>
              <Text style={[
                styles.filterButtonText,
                { 
                  color: selectedFilter === 'past' 
                    ? (isDark ? '#ffffff' : '#000000') 
                    : (isDark ? '#999999' : '#666666') 
                }
              ]}>
                📚 Минали
              </Text>
              {pastEvents.length > 0 && (
                <View style={[styles.badge, { backgroundColor: isDark ? '#007AFF' : '#007AFF' }]}>
                  <Text style={styles.badgeText}>{pastEvents.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            {getCurrentTitle()}
          </Text>
          
          {currentEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {currentEvents.map((event) => (
                <EventCard key={event.$id} {...event} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { color: isDark ? '#666666' : '#cccccc' }]}>
                {selectedFilter === 'upcoming' ? '📅' : '📚'}
              </Text>
              <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
                {getEmptyMessage()}
              </Text>
            </View>
          )}
        </View>

        {allEvents.length > 0 && upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              📋 Всички събития
            </Text>
            <View style={styles.eventsList}>
              {allEvents.map((event) => (
                <EventCard key={event.$id} {...event} />
              ))}
            </View>
          </View>
        )}

      </ScrollView>
      <CreateButton creationScreen={CreationScreen.Events}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  debugSection: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  eventsList: {
    gap: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});