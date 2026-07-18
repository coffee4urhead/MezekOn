import { WebLocationPicker } from '@/components/LocationPicker';
import { useUser } from '@/context/UserContext';
import { useEvents } from '@/hooks/use-events';
import { FileType, useUserFiles } from '@/hooks/use-user-files';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import {
  CoverPhotoAsset,
  CoverPickerSection,
  DateTimeInput,
  DescriptionInput,
  LocationPickerSection,
  LocationType,
  MaxAttendeesInput,
  OrganizerInputs,
  Section,
  TitleInput,
} from '@/components/shared/FormComponents';


interface CreateEventModalProps {
  isVisible: boolean;
  setModalVisibility: Dispatch<SetStateAction<boolean>>;
  onEventCreated?: () => void;
}

export default function CreateEventModal({ 
  isVisible, 
  setModalVisibility,
  onEventCreated 
}: CreateEventModalProps) {
  const { user } = useUser();
  const { createEvent, isCreating } = useEvents();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<CoverPhotoAsset | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  
  const [eventStartDate, setEventStartDate] = useState(new Date());
  const [eventEndDate, setEventEndDate] = useState(new Date(Date.now() + 3600000));
  
  const [organizerName, setOrganizerName] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const { uploadEventCoverPhoto } = useUserFiles(user?.$id || '');
  const pickCoverPhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Грешка', 'Нужни са разрешения за достъп до галерията.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setCoverPhoto({
          uri: asset.uri,
          name: asset.fileName || 'cover.jpg',
          size: asset.fileSize || 0,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      Alert.alert('Грешка', 'Възникна проблем при избора на корица.');
    }
  }, []);

  const removeCoverPhoto = useCallback(() => {
    setCoverPhoto(null);
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCoverPhoto(null);
    setSelectedLocation(null);
    setEventStartDate(new Date());
    setEventEndDate(new Date(Date.now() + 3600000));
    setOrganizerName('');
    setOrganizerPhone('');
    setOrganizerEmail('');
    setMaxAttendees('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Грешка', 'Моля, въведете заглавие.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Грешка', 'Моля, въведете описание.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Грешка', 'Моля, изберете локация.');
      return;
    }

    if (!organizerName.trim()) {
      Alert.alert('Грешка', 'Моля, въведете име на организатор.');
      return;
    }

    if (!organizerPhone.trim()) {
      Alert.alert('Грешка', 'Моля, въведете телефонен номер.');
      return;
    }

    if (!organizerEmail.trim()) {
      Alert.alert('Грешка', 'Моля, въведете имейл.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Грешка', 'Моля, влезте в профила си.');
      return;
    }

    let coverPhotoID: string | undefined;

    if (coverPhoto) {
  try {
    const uploadedFile = await uploadEventCoverPhoto({
      file: {
        uri: coverPhoto.uri,
        name: coverPhoto.name,
        type: coverPhoto.type,
        size: coverPhoto.size
      },
      title: coverPhoto.name || 'Event Cover Photo',
      fileName: coverPhoto.name,
      fileType: coverPhoto.type as FileType,
      is_approved: true
    });
    coverPhotoID = uploadedFile.file_id;
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    Alert.alert('Грешка', 'Възникна проблем при качването на корицата.');
    return;
  }
}
    try {
      const googleMapsUrl = `https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`;

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        coverPhotoID: coverPhotoID || '',
        eventAddress: selectedLocation.address || `${selectedLocation.latitude}, ${selectedLocation.longitude}`,
        googleMapsUrl: googleMapsUrl,
        eventStartDate: eventStartDate.toISOString(),
        eventEndDate: eventEndDate.toISOString(),
        organizerName: organizerName.trim(),
        organizerEmail: organizerEmail.trim(),
        organizerPhone: organizerPhone.trim(),
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        status: 'incoming' as const,
        authorID: user.$id,
      };

      await createEvent(eventData);
      
      Alert.alert('Успех', 'Събитието беше създадено успешно!');
      
      resetForm();
      setModalVisibility(false);
      
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Грешка', error.message || 'Възникна проблем при създаването на събитието.');
    }
  }, [
    title,
    description,
    selectedLocation,
    organizerName,
    organizerPhone,
    organizerEmail,
    maxAttendees,
    eventStartDate,
    eventEndDate,
    coverPhoto,
    user,
    createEvent,
    resetForm,
    setModalVisibility,
    onEventCreated
  ]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      Keyboard.dismiss();
      resetForm();
      setModalVisibility(false);
    }
  }, [isCreating, setModalVisibility, resetForm]);

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
                  <Text style={styles.headerTitle}>Създай ново събитие</Text>
                  <Text style={styles.headerSubtitle}>
                    Създаването и провеждането на събития поддържа каузата жива.
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
                {/* Event Information */}
                <Section title="Информация за събитието" icon="information-circle-outline">
                  <TitleInput 
                    value={title} 
                    onChange={setTitle} 
                    editable={!isCreating} 
                  />
                  <DescriptionInput 
                    value={description} 
                    onChange={setDescription} 
                    editable={!isCreating} 
                  />
                </Section>

                {/* Cover Photo */}
                <CoverPickerSection 
                  coverPhoto={coverPhoto}
                  isUploading={isCreating}
                  onPickCover={pickCoverPhoto}
                  onRemoveCover={removeCoverPhoto}
                  formatFileSize={formatFileSize}
                />

                {/* Location */}
                <LocationPickerSection 
                  location={selectedLocation}
                  onPress={() => setIsLocationPickerVisible(true)}
                />

                {/* Date & Time */}
                <Section title="Дата и час" icon="calendar-outline">
                  <DateTimeInput 
                    label="Начало"
                    value={eventStartDate}
                    onChange={setEventStartDate}
                    editable={!isCreating}
                  />
                  <DateTimeInput 
                    label="Край"
                    value={eventEndDate}
                    onChange={setEventEndDate}
                    editable={!isCreating}
                  />
                </Section>

                {/* Organizer Info */}
                <OrganizerInputs 
                  name={organizerName}
                  phone={organizerPhone}
                  email={organizerEmail}
                  onNameChange={setOrganizerName}
                  onPhoneChange={setOrganizerPhone}
                  onEmailChange={setOrganizerEmail}
                  editable={!isCreating}
                />

                {/* Max Attendees */}
                <Section title="Участници" icon="people-outline">
                  <MaxAttendeesInput 
                    value={maxAttendees}
                    onChange={setMaxAttendees}
                    editable={!isCreating}
                  />
                </Section>

                {/* Buttons */}
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
                    disabled={isCreating || !title.trim() || !description.trim() || !selectedLocation || !organizerName.trim()}
                  >
                    {isCreating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Създай</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      {/* Location Picker Modal */}
      <WebLocationPicker
        isVisible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        onLocationSelect={(location: LocationType) => {
          setSelectedLocation(location);
          setIsLocationPickerVisible(false);
        }}
        initialLocation={selectedLocation || undefined}
      />
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  sectionContent: {
    gap: 16,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadArea: {
    marginBottom: 8,
  },
  pickCoverButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    minHeight: 100,
  },
  pickCoverText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0347F2',
    marginTop: 8,
  },
  pickCoverSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  coverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0347F2',
  },
  coverPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  coverDetails: {
    flex: 1,
  },
  coverName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  coverSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  locationButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pickLocationButton: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  pickLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0347F2',
    marginTop: 8,
  },
  pickLocationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
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