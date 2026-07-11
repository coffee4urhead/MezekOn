import { useUser } from '@/context/UserContext';
import { useUserFiles } from '@/hooks/use-user-files';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Dispatch, memo, SetStateAction, useCallback, useState } from 'react';
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

interface HistoryUploadArchiveProps {
    isModalClicked: boolean;
    setModalVisibility: Dispatch<SetStateAction<boolean>>
}

interface DocumentAsset {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
}

const TitleInput = memo(({ 
  value, 
  onChange, 
  editable 
}: { 
  value: string; 
  onChange: (text: string) => void; 
  editable: boolean;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Заглавие *</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="Въведете заглавие на документа"
      placeholderTextColor="#999"
      editable={editable}
      scrollEnabled={false}
      returnKeyType="done"
      blurOnSubmit={true}
    />
  </View>
));

const DescriptionInput = memo(({ 
  value, 
  onChange, 
  editable 
}: { 
  value: string; 
  onChange: (text: string) => void; 
  editable: boolean;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Описание</Text>
    <TextInput
      style={[styles.input, styles.textArea]}
      value={value}
      onChangeText={onChange}
      placeholder="Въведете описание на документа"
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


const Section = memo(({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#0347F2" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
));

const DocumentPickerSection = memo(({ 
  document, 
  isUploading, 
  onPickDocument, 
  onRemoveDocument,
  formatFileSize
}: any) => (
  <Section title="Качване на файл" icon="cloud-upload-outline">
    <View style={styles.uploadArea}>
      {document ? (
        <View style={styles.documentInfo}>
          <View style={styles.documentIcon}>
            <Ionicons 
              name={document.mimeType.includes('pdf') ? 'document-text' : 
                    document.mimeType.includes('image') ? 'image' : 
                    document.mimeType.includes('word') ? 'document' :
                    'document'} 
              size={40} 
              color="#0347F2" 
            />
          </View>
          <View style={styles.documentDetails}>
            <Text style={styles.documentName} numberOfLines={2}>
              {document.name}
            </Text>
            <Text style={styles.documentSize}>
              {formatFileSize(document.size)}
            </Text>
            <Text style={styles.documentType}>
              {document.mimeType}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeDocumentButton}
            onPress={onRemoveDocument}
            disabled={isUploading}
          >
            <Ionicons name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.pickButton} 
          onPress={onPickDocument}
          disabled={isUploading}
        >
          <Ionicons name="cloud-upload-outline" size={48} color="#0347F2" />
          <Text style={styles.pickButtonText}>Изберете файл</Text>
          <Text style={styles.pickButtonSubtext}>
            Поддържани формати: PDF, DOC, DOCX, JPG, PNG
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </Section>
));


export default function UploadHistoryArchive({ isModalClicked, setModalVisibility }: HistoryUploadArchiveProps) {
  const { user } = useUser();
  const { uploadHistoryArchive } = useUserFiles(user?.$id || '');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<DocumentAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled === false) {
        const asset = result.assets[0];
        setDocument({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream'
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Грешка', 'Възникна проблем при избора на файл.');
    }
  }, []);

  const removeDocument = useCallback(() => {
    setDocument(null);
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
    setDocument(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      Keyboard.dismiss();
      setModalVisibility(false);
    }
  }, [isUploading, setModalVisibility]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Грешка', 'Моля, въведете заглавие.');
      return;
    }

    if (!document) {
      Alert.alert('Грешка', 'Моля, изберете документ за качване.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Грешка', 'Моля, влезте в профила си, за да качвате файлове.');
      return;
    }

    setIsUploading(true);
    
    try {
      const fileToUpload = {
        uri: document.uri,
        name: document.name,
        type: document.mimeType,
        size: document.size
      };

      console.log('Starting upload with user ID:', user.$id);
      console.log('File to upload:', fileToUpload);

      await uploadHistoryArchive({
        fileName: document.name,
        fileType: 'document',
        file: fileToUpload,
        title: title,
        description: description,
        is_approved: false
      });

      Alert.alert(
        'Успех', 
        'Документът беше качен успешно! Предстои да бъде одобрен!',
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
      console.error('Upload error:', error);
      
      let errorMessage = 'Възникна проблем при качването на документа.';
      if (error.message) {
        if (error.message.includes('bucket')) {
          errorMessage = 'Грешка в хранилището. Моля, опитайте по-късно.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Нямате нужните права за качване на файлове.';
        } else if (error.message.includes('size')) {
          errorMessage = 'Файлът е твърде голям. Максималният размер е 50MB.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Грешка', errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [title, document, user, uploadHistoryArchive, resetForm, setModalVisibility]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalClicked}
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
                  <Text style={styles.headerTitle}>Качи исторически записи и документи</Text>
                  <Text style={styles.headerSubtitle}>
                    Качвай документи от истинско значение за България и запазването на родната идентичност
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleClose} 
                  style={styles.closeButton}
                  disabled={isUploading}
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
                <Section title="Информация за документа" icon="document-text-outline">
                  <TitleInput 
                    value={title} 
                    onChange={setTitle} 
                    editable={!isUploading} 
                  />
                  <DescriptionInput 
                    value={description} 
                    onChange={setDescription} 
                    editable={!isUploading} 
                  />
                </Section>

                <DocumentPickerSection 
                  document={document}
                  isUploading={isUploading}
                  onPickDocument={pickDocument}
                  onRemoveDocument={removeDocument}
                  formatFileSize={formatFileSize}
                />

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, isUploading && styles.disabledButton]}
                    onPress={handleClose}
                    disabled={isUploading}
                  >
                    <Text style={styles.cancelButtonText}>Отказ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.submitButton, isUploading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isUploading || !document || !title.trim()}
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
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0347F2',
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e8edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  documentType: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  removeDocumentButton: {
    padding: 4,
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