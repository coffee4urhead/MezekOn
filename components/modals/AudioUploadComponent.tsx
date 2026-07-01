import { useUser } from '@/context/UserContext';
import { useUserFiles } from '@/hooks/use-user-files';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Dispatch, SetStateAction, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface UploadAudioProps {
    isModalClicked: boolean;
    setModalVisibility: Dispatch<SetStateAction<boolean>>
}

interface AudioAsset {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    duration?: number;
}

export default function UploadAudio({ isModalClicked, setModalVisibility }: UploadAudioProps) {
  const { user } = useUser();
  const { uploadHistoryAudioArchive, isUploading: isHookUploading } = useUserFiles(user?.$id || '');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audio, setAudio] = useState<AudioAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const supportedAudioTypes = [
    'audio/mpeg',      
    'audio/mp4',      
    'audio/wav',       
    'audio/aac',      
    'audio/flac',      
    'audio/ogg',       
    'audio/webm',      
    'audio/amr',       
    'audio/m4a',       
    'audio/x-m4a',     
    'audio/x-mp3',     
    'audio/x-wav',    
    'audio/x-aac',    
    'audio/x-flac',    
    'audio/x-ogg',     
    'audio/x-ms-wma',  
  ];

  const audioFileExtensions = [
    'mp3', 'mp4', 'wav', 'aac', 'flac', 
    'ogg', 'webm', 'amr', 'm4a', 'wma'
  ];

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedAudioTypes,
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled === false) {
        const asset = result.assets[0];
        setAudio({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'audio/mpeg',
        });
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Грешка', 'Възникна проблем при избора на аудио файл.');
    }
  };

  const removeAudio = () => {
    setAudio(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAudioIcon = (mimeType: string): string => {
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'musical-notes';
    if (mimeType.includes('wav')) return 'musical-note';
    if (mimeType.includes('aac') || mimeType.includes('m4a')) return 'musical-note';
    if (mimeType.includes('flac')) return 'musical-note';
    if (mimeType.includes('ogg')) return 'musical-note';
    if (mimeType.includes('wma')) return 'musical-note';
    return 'musical-notes';
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Грешка', 'Моля, въведете заглавие.');
      return;
    }

    if (!audio) {
      Alert.alert('Грешка', 'Моля, изберете аудио файл за качване.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Грешка', 'Моля, влезте в профила си, за да качвате файлове.');
      return;
    }

    setIsUploading(true);
    
    try {
      const fileToUpload = {
        uri: audio.uri,
        name: audio.name,
        type: audio.mimeType,
        size: audio.size
      };

      console.log('Starting audio upload with user ID:', user.$id);
      console.log('Audio file to upload:', fileToUpload);

      const result = await uploadHistoryAudioArchive({
        fileName: audio.name,
        fileType: 'history_audio', 
        file: fileToUpload,
        title: title,
        description: description,
      });

      console.log('Audio upload successful:', result);
      
      Alert.alert(
        'Успех', 
        'Аудио файлът беше качен успешно! Предстои да бъде одобрен!',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setModalVisibility(false);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Audio upload error:', error);
      
      let errorMessage = 'Възникна проблем при качването на аудио файла.';
      if (error.message) {
        if (error.message.includes('bucket')) {
          errorMessage = 'Грешка в хранилището. Моля, опитайте по-късно.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Нямате нужните права за качване на файлове.';
        } else if (error.message.includes('size')) {
          errorMessage = 'Аудио файлът е твърде голям. Максималният размер е 50MB.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Грешка', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAudio(null);
  };

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color="#0347F2" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const InputField = ({ label, value, onChange, placeholder, multiline = false, keyboardType = 'default' }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        editable={!isUploading}
      />
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalClicked}
      onRequestClose={() => {
        if (!isUploading) setModalVisibility(false);
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Качи аудио файл</Text>
              <Text style={styles.headerSubtitle}>
                Качвай аудио записи, свързани с българската история и култура
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => !isUploading && setModalVisibility(false)} 
              style={styles.closeButton}
              disabled={isUploading}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Section title="Информация за аудиото" icon="information-circle-outline">
              <InputField
                label="Заглавие *"
                value={title}
                onChange={setTitle}
                placeholder="Въведете заглавие на аудио файла"
              />
              <InputField
                label="Описание"
                value={description}
                onChange={setDescription}
                placeholder="Въведете описание на аудио файла"
                multiline={true}
              />
            </Section>

            <Section title="Качване на аудио файл" icon="cloud-upload-outline">
              <View style={styles.uploadArea}>
                {audio ? (
                  <View style={styles.audioInfo}>
                    <View style={styles.audioIcon}>
                      <Ionicons 
                        name={getAudioIcon(audio.mimeType) as any} 
                        size={40} 
                        color="#0347F2" 
                      />
                    </View>
                    <View style={styles.audioDetails}>
                      <Text style={styles.audioName} numberOfLines={2}>
                        {audio.name}
                      </Text>
                      <Text style={styles.audioSize}>
                        {formatFileSize(audio.size)}
                      </Text>
                      <Text style={styles.audioType}>
                        {audio.mimeType}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeAudioButton}
                      onPress={removeAudio}
                      disabled={isUploading}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.pickButton} 
                    onPress={pickAudio}
                    disabled={isUploading}
                  >
                    <Ionicons name="musical-notes-outline" size={48} color="#0347F2" />
                    <Text style={styles.pickButtonText}>Изберете аудио файл</Text>
                    <Text style={styles.pickButtonSubtext}>
                      Поддържани формати: {audioFileExtensions.join(', ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Section>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.cancelButton, isUploading && styles.disabledButton]}
                onPress={() => setModalVisibility(false)}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Отказ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, isUploading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isUploading || !audio || !title.trim()}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Качи</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  pickButton: {
    borderWidth: 2,
    borderColor: '#0347F2',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0347F2',
    marginTop: 8,
  },
  pickButtonSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0347F2',
  },
  audioIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e8edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  audioDetails: {
    flex: 1,
  },
  audioName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  audioSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  audioType: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  removeAudioButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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