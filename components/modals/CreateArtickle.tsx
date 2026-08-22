import { useUser } from '@/context/UserContext';
import { useArtickles } from '@/hooks/use-user-artickles';
import { useUserFiles } from '@/hooks/use-user-files';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  DescriptionInput,
  Section,
  TitleInput
} from '@/components/shared/FormComponents';

interface CreateArtickleModalProps {
  isVisible: boolean;
  setModalVisibility: Dispatch<SetStateAction<boolean>>;
  onArtickleCreated?: () => void;
}

export default function CreateArtickleModal({ 
  isVisible, 
  setModalVisibility,
  onArtickleCreated 
}: CreateArtickleModalProps) {
  const { user } = useUser();
  const { uploadArtickleMedia, isUploading } = useUserFiles(user?.$id || '');
  const { createArtickle } = useArtickles();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<CoverPhotoAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickMediaFiles = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Please grant gallery permissions to upload media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - mediaFiles.length, 
      });

      if (!result.canceled) {
        const assets = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `media_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          type: asset.mimeType || 'image/jpeg',
        }));
        
        setMediaFiles(prev => {
          const combined = [...prev, ...assets];
          if (combined.length > 10) {
            Alert.alert('Limit', 'Maximum 10 media files allowed.');
            return combined.slice(0, 10);
          }
          return combined;
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media files.');
    }
  }, [mediaFiles.length]);

  const removeMediaFile = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setContent('');
    setTitle('');
    setMediaFiles([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Error', 'Please log in.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedMediaIds: string[] = [];
      
      for (const file of mediaFiles) {
        try {
          const uploadedFile = await uploadArtickleMedia({
            file: {
              uri: file.uri,
              name: file.name || `media_${Date.now()}.jpg`,
              type: file.type || 'image/jpeg',
              size: file.size || 1000
            },
            title: `Article media: ${file.name}`,
            fileName: file.name,
            fileType: 'artickle-media',
            is_approved: true
          });
          
          if (uploadedFile?.file_id) {
            uploadedMediaIds.push(uploadedFile.file_id);
          }
        } catch (uploadError) {
          console.error('Error uploading individual file:', uploadError);
        }
      }

      const artickleData = {
        title: title.trim(),
        content: content.trim(),
        author_id: user.$id,
        mediaIds: uploadedMediaIds,
        createdAt: new Date().toISOString(),
      };

      await createArtickle(artickleData);

      Alert.alert(
        'Success', 
        `Artickle created with ${uploadedMediaIds.length} media files!`
      );
      
      resetForm();
      setModalVisibility(false);
      
      if (onArtickleCreated) {
        onArtickleCreated();
      }
    } catch (error: any) {
      console.error('Error creating artickle:', error);
      Alert.alert('Error', error?.message || 'Failed to create artickle.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    content,
    mediaFiles,
    user,
    uploadArtickleMedia,
    createArtickle,
    resetForm,
    setModalVisibility,
    onArtickleCreated
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      Keyboard.dismiss();
      resetForm();
      setModalVisibility(false);
    }
  }, [isSubmitting, setModalVisibility, resetForm]);

  const isLoading = isSubmitting || isUploading;

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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Create New Artickle</Text>
                  <Text style={styles.headerSubtitle}>
                    Share your thoughts with the community.
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleClose} 
                  style={styles.closeButton}
                  disabled={isLoading}
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
                <Section title="Artickle Details" icon="create-outline">
                  <TitleInput 
                    value={title} 
                    onChange={setTitle} 
                    editable={!isLoading} 
                    placeholder="Enter title..."
                  />
                  <DescriptionInput 
                    value={content} 
                    onChange={setContent} 
                    editable={!isLoading}
                    placeholder="Write your content here..."
                  />
                </Section>

                <Section title="Media" icon="images-outline">
                  <View style={styles.mediaSection}>
                    {mediaFiles.length > 0 && (
                      <View style={styles.mediaGrid}>
                        {mediaFiles.map((item, index) => (
                          <View key={`${item.uri}-${index}`} style={styles.mediaItem}>
                            <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                            <TouchableOpacity 
                              style={styles.removeMediaButton}
                              onPress={() => removeMediaFile(index)}
                              disabled={isLoading}
                            >
                              <Ionicons name="close-circle" size={24} color="#ff4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.uploadButton, isLoading && styles.disabledButton]}
                      onPress={pickMediaFiles}
                      disabled={isLoading || mediaFiles.length >= 10}
                    >
                      <Ionicons name="cloud-upload" size={24} color="#0347F2" />
                      <Text style={styles.uploadButtonText}>
                        {mediaFiles.length > 0 ? 'Add More Media' : 'Upload Media'}
                      </Text>
                      <Text style={styles.uploadSubtext}>
                        {mediaFiles.length}/10 files • Images & Videos
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Section>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.cancelButton, isLoading && styles.disabledButton]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.submitButton, 
                    (isLoading || !title.trim() || !content.trim()) && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading || !title.trim() || !content.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Create {mediaFiles.length > 0 ? `(${mediaFiles.length} media)` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    maxHeight: '65%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  mediaSection: {
    gap: 12,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mediaItem: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 2,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    minHeight: 80,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0347F2',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
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