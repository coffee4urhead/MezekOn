import {
    Section,
    TitleInput
} from '@/components/shared/FormComponents';
import { useUser } from '@/context/UserContext';
import { useEvents } from '@/hooks/use-events';
import { useAnnouncements } from '@/hooks/use-user-announcements';
import { useUserFiles } from '@/hooks/use-user-files';
import { Ionicons } from '@expo/vector-icons';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface CreateAnnouncementModalProps {
  isVisible: boolean;
  setModalVisibility: Dispatch<SetStateAction<boolean>>;
  eventID?: string;
  onAnnouncementCreated?: () => void;
}

interface EventOption {
  $id: string;
  title: string;
  eventStartDate: string;
  status: string;
}

export default function CreateAnnouncementModal({
  isVisible,
  setModalVisibility,
  eventID,
  onAnnouncementCreated
}: CreateAnnouncementModalProps) {
  const { user } = useUser();
  const { createAnnouncement, isCreating } = useAnnouncements();
  const { uploadEventCoverPhoto } = useUserFiles(user?.$id || '');
  const { fetchUpcomingEvents, fetchAllEvents, loading: eventsLoading } = useEvents();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventID || '');
  const [events, setEvents] = useState<EventOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadEvents();
    }
  }, [isVisible]);

  const loadEvents = useCallback(async () => {
    try {
      const fetchedEvents = await fetchUpcomingEvents(20);
      const formattedEvents = fetchedEvents.map(event => ({
        $id: event.$id,
        title: event.title,
        eventStartDate: event.eventStartDate,
        status: event.status
      }));
      setEvents(formattedEvents);
      
      if (eventID) {
        setSelectedEventId(eventID);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, [fetchUpcomingEvents, eventID]);

  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsUrgent(false);
    setTags([]);
    setTagInput('');
    setSelectedEventId(eventID || '');
  }, [eventID]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Грешка', 'Моля, въведете заглавие.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Грешка', 'Моля, въведете съдържание.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Грешка', 'Моля, влезте в профила си.');
      return;
    }

    let coverPhotoID: string | undefined;

    try {
      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        authorID: user.$id,
        eventID: selectedEventId || '',
        isPinned: isPinned,
        isUrgent: isUrgent,
        tags: tags,
      };

      await createAnnouncement(announcementData);
      
      Alert.alert('Успех', 'Обявлението беше създадено успешно!');
      
      resetForm();
      setModalVisibility(false);
      
      if (onAnnouncementCreated) {
        onAnnouncementCreated();
      }
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      Alert.alert('Грешка', error.message || 'Възникна проблем при създаването на обявлението.');
    }
  }, [
    title,
    content,
    isPinned,
    isUrgent,
    tags,
    user,
    selectedEventId,
    createAnnouncement,
    uploadEventCoverPhoto,
    resetForm,
    setModalVisibility,
    onAnnouncementCreated
  ]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      Keyboard.dismiss();
      resetForm();
      setModalVisibility(false);
    }
  }, [isCreating, setModalVisibility, resetForm]);

  const getEventDisplayText = useCallback(() => {
    if (!selectedEventId) return 'Изберете събитие';
    const selected = events.find(e => e.$id === selectedEventId);
    if (!selected) return 'Изберете събитие';
    const date = new Date(selected.eventStartDate);
    const formattedDate = date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${selected.title} (${formattedDate})`;
  }, [selectedEventId, events]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Създай ново обявление</Text>
                  <Text style={styles.headerSubtitle}>
                    Информирайте общността за важни събития и новини.
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleClose} 
                  style={styles.closeButton}
                  disabled={isCreating}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <Section title="Информация за обявлението" icon="information-circle-outline">
                  <TitleInput 
                    value={title} 
                    onChange={setTitle} 
                    editable={!isCreating}
                    placeholder="Въведете заглавие на обявлението"
                  />
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Съдържание *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={content}
                      onChangeText={setContent}
                      placeholder="Въведете съдържание на обявлението"
                      placeholderTextColor="#999"
                      multiline={true}
                      numberOfLines={6}
                      editable={!isCreating}
                      scrollEnabled={false}
                      textAlignVertical="top"
                    />
                  </View>
                </Section>

                <Section title="Свързано събитие" icon="calendar-outline">
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowDropdown(!showDropdown)}
                      disabled={isCreating || eventsLoading}
                    >
                      <View style={styles.dropdownButtonContent}>
                        <Ionicons name="calendar-outline" size={20} color="#0347F2" />
                        <Text style={[
                          styles.dropdownButtonText,
                          !selectedEventId && styles.dropdownButtonPlaceholder
                        ]}>
                          {eventsLoading ? 'Зареждане...' : getEventDisplayText()}
                        </Text>
                      </View>
                      <Ionicons 
                        name={showDropdown ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>

                    {showDropdown && (
                      <View style={styles.dropdownList}>
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            !selectedEventId && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedEventId('');
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemTitle,
                            !selectedEventId && styles.dropdownItemTitleSelected
                          ]}>
                            Без събитие
                          </Text>
                          {!selectedEventId && (
                            <Ionicons name="checkmark-circle" size={24} color="#0347F2" />
                          )}
                        </TouchableOpacity>
                        {events.length === 0 && !eventsLoading ? (
                          <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                              Няма активни събития
                            </Text>
                          </View>
                        ) : (
                          <ScrollView 
                            style={styles.dropdownScrollView}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                          >
                            {events.map((item) => (
                              <TouchableOpacity
                                key={item.$id}
                                style={[
                                  styles.dropdownItem,
                                  selectedEventId === item.$id && styles.dropdownItemSelected
                                ]}
                                onPress={() => {
                                  setSelectedEventId(item.$id);
                                  setShowDropdown(false);
                                }}
                              >
                                <View style={styles.dropdownItemContent}>
                                  <Text style={[
                                    styles.dropdownItemTitle,
                                    selectedEventId === item.$id && styles.dropdownItemTitleSelected
                                  ]}>
                                    {item.title}
                                  </Text>
                                  <Text style={styles.dropdownItemDate}>
                                    {new Date(item.eventStartDate).toLocaleDateString('bg-BG', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                </View>
                                {selectedEventId === item.$id && (
                                  <Ionicons name="checkmark-circle" size={24} color="#0347F2" />
                                )}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>
                </Section>

                <Section title="Етикети" icon="pricetags-outline">
                  <View style={styles.tagInputContainer}>
                    <TextInput
                      style={[styles.input, styles.tagInput]}
                      value={tagInput}
                      onChangeText={setTagInput}
                      placeholder="Добавете етикет"
                      placeholderTextColor="#999"
                      editable={!isCreating}
                      returnKeyType="done"
                      onSubmitEditing={addTag}
                    />
                    <TouchableOpacity 
                      style={styles.addTagButton}
                      onPress={addTag}
                      disabled={isCreating || !tagInput.trim()}
                    >
                      <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {tags.map((tag, index) => (
                        <View key={index} style={styles.tagItem}>
                          <Text style={styles.tagText}>#{tag}</Text>
                          <TouchableOpacity
                            onPress={() => removeTag(tag)}
                            disabled={isCreating}
                          >
                            <Ionicons name="close-circle" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </Section>

                <Section title="Настройки" icon="settings-outline">
                  <TouchableOpacity 
                    style={styles.optionItem}
                    onPress={() => setIsPinned(!isPinned)}
                    disabled={isCreating}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons name="pin-outline" size={24} color="#0347F2" />
                      <Text style={styles.optionLabel}>Закачи отгоре</Text>
                    </View>
                    <View style={[styles.toggle, isPinned && styles.toggleActive]}>
                      <View style={[styles.toggleDot, isPinned && styles.toggleDotActive]} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionItem}
                    onPress={() => setIsUrgent(!isUrgent)}
                    disabled={isCreating}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons name="alert-circle-outline" size={24} color="#ff4444" />
                      <Text style={styles.optionLabel}>Важно обявление</Text>
                    </View>
                    <View style={[styles.toggle, isUrgent && styles.toggleActive]}>
                      <View style={[styles.toggleDot, isUrgent && styles.toggleDotActive]} />
                    </View>
                  </TouchableOpacity>
                </Section>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, isCreating && styles.disabledButton]}
                    onPress={handleClose}
                    disabled={isCreating}
                  >
                    <Text style={styles.cancelButtonText}>Отказ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.submitButton, isCreating && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isCreating || !title.trim() || !content.trim()}
                  >
                    {isCreating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Публикувай</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  dropdownButtonPlaceholder: {
    color: '#999',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f5ff',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  dropdownItemTitleSelected: {
    color: '#0347F2',
    fontWeight: '600',
  },
  dropdownItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0347F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#0347F2',
  },
  toggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0347F2',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});