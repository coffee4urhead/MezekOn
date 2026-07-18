import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { memo, useState } from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export type LocationType = {
  latitude: number;
  longitude: number;
  address?: string;
};

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

export interface CoverPhotoAsset {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export const Section = memo(({ title, icon, children }: SectionProps) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#0347F2" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
));

export const TitleInput = memo(({ 
  value, 
  onChange, 
  editable,
  placeholder = "Въведете заглавие"
}: { 
  value: string; 
  onChange: (text: string) => void; 
  editable: boolean;
  placeholder?: string;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Заглавие *</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#999"
      editable={editable}
      scrollEnabled={false}
      returnKeyType="done"
      blurOnSubmit={true}
    />
  </View>
));

export const DescriptionInput = memo(({ 
  value, 
  onChange, 
  editable,
  placeholder = "Въведете описание"
}: { 
  value: string; 
  onChange: (text: string) => void; 
  editable: boolean;
  placeholder?: string;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Описание *</Text>
    <TextInput
      style={[styles.input, styles.textArea]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#999"
      multiline={true}
      numberOfLines={4}
      editable={editable}
      scrollEnabled={false}
      returnKeyType="default"
      blurOnSubmit={true}
      textAlignVertical="top"
    />
  </View>
));

export const CoverPickerSection = memo(({ 
  coverPhoto, 
  isUploading, 
  onPickCover, 
  onRemoveCover,
  formatFileSize,
  title = "Корица (опционално)",
  icon = "image-outline",
  pickButtonText = "Изберете корица",
  subtext = "Препоръчителен размер: 500x500px"
}: any) => (
  <Section title={title} icon={icon}>
    <View style={styles.uploadArea}>
      {coverPhoto ? (
        <View style={styles.coverInfo}>
          <Image 
            source={{ uri: coverPhoto.uri }} 
            style={styles.coverPreview}
          />
          <View style={styles.coverDetails}>
            <Text style={styles.coverName} numberOfLines={2}>
              {coverPhoto.name}
            </Text>
            <Text style={styles.coverSize}>
              {formatFileSize(coverPhoto.size)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={onRemoveCover}
            disabled={isUploading}
          >
            <Ionicons name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.pickCoverButton} 
          onPress={onPickCover}
          disabled={isUploading}
        >
          <Ionicons name={icon as any} size={40} color="#0347F2" />
          <Text style={styles.pickCoverText}>{pickButtonText}</Text>
          <Text style={styles.pickCoverSubtext}>
            {subtext}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </Section>
));

export const LocationPickerSection = memo(({ 
  location, 
  onPress,
  title = "Локация *",
  icon = "location-outline"
}: { 
  location: LocationType | null; 
  onPress: () => void;
  title?: string;
  icon?: string;
}) => (
  <Section title={title} icon={icon}>
    <TouchableOpacity 
      style={styles.locationButton}
      onPress={onPress}
    >
      {location ? (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={24} color="#0347F2" />
          <View style={styles.locationDetails}>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {location.address || 'Избрана локация'}
            </Text>
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      ) : (
        <View style={styles.pickLocationButton}>
          <Ionicons name="map-outline" size={40} color="#0347F2" />
          <Text style={styles.pickLocationText}>Изберете локация</Text>
          <Text style={styles.pickLocationSubtext}>
            Натиснете за да изберете място на картата
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </Section>
));

export const DateTimeInput = memo(({ 
  label, 
  value, 
  onChange, 
  editable 
}: { 
  label: string; 
  value: Date; 
  onChange: (date: Date) => void; 
  editable: boolean;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TouchableOpacity 
        style={styles.dateTimeButton}
        onPress={() => editable && setShowPicker(true)}
        disabled={!editable}
      >
        <Ionicons name="calendar-outline" size={20} color="#0347F2" />
        <Text style={styles.dateTimeText}>
          {value.toLocaleString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
});

export const OrganizerInputs = memo(({ 
  name,
  phone,
  email,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  editable,
  title = "Информация за организатор",
  icon = "person-outline"
}: {
  name: string;
  phone: string;
  email: string;
  onNameChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  editable: boolean;
  title?: string;
  icon?: string;
}) => (
  <Section title={title} icon={icon}>
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Име на организатор *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onNameChange}
        placeholder="Въведете име на организатор"
        placeholderTextColor="#999"
        editable={editable}
      />
    </View>
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Телефон *</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={onPhoneChange}
        placeholder="Въведете телефонен номер"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        editable={editable}
      />
    </View>
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Имейл *</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={onEmailChange}
        placeholder="Въведете имейл"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  </Section>
));

export const MaxAttendeesInput = memo(({ 
  value, 
  onChange, 
  editable,
  label = "Максимален брой участници (опционално)",
  placeholder = "Оставете празно за неограничен брой"
}: { 
  value: string; 
  onChange: (text: string) => void; 
  editable: boolean;
  label?: string;
  placeholder?: string;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#999"
      keyboardType="numeric"
      editable={editable}
    />
  </View>
));

const styles = StyleSheet.create({
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
});