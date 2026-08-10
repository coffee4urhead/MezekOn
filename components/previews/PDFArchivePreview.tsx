// components/previews/PDFArchivePreview.tsx
import { FileType, UserFileData } from '@/hooks/use-user-files';
import { usePDFThumbnail } from '@/hooks/usePDFThumbnail';
import { CommonActions, useNavigation } from "expo-router/react-navigation";
import React from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';

interface FilePreviewItemProps {
  file: UserFileData;
  fileTypesLookingFor?: FileType | FileType[];
  onPress?: (file: UserFileData) => void;
}

const FilePreviewItem = ({ 
  file, 
  fileTypesLookingFor = ['document', 'history_audio'], 
  onPress 
}: FilePreviewItemProps) => {
  const navigation = useNavigation();
  
  const { 
    thumbnailPath, 
    isLoading: isThumbnailLoading, 
    error: thumbnailError 
  } = usePDFThumbnail(
    file.file_type === 'document' ? file.file_id : '',
    file.file_type === 'document' ? file.fileUrl || '' : '',
    file.file_type === 'document' ? 'document' : ''
  );

  const handlePress = () => {
    if (onPress) {
      onPress(file);
      return;
    }

    if (file.file_type === 'document' && file.fileUrl) {
      try {
        // Use CommonActions to navigate from the root
        navigation.dispatch(
          CommonActions.navigate({
            name: 'PDFViewerScreen',
            params: {
              fileUrl: file.fileUrl,
              fileName: file.file_name || file.title || 'Untitled',
              fileId: file.file_id,
            },
          })
        );
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Грешка', 'Не може да се отвори PDF файлът.');
      }
    } else if (file.file_type === 'history_audio' && file.fileUrl) {
      try {
        // Use CommonActions to navigate from the root
        navigation.dispatch(
          CommonActions.navigate({
            name: 'AudioPlayerScreen',
            params: {
              fileUrl: file.fileUrl,
              fileName: file.file_name || file.title || 'Untitled',
              fileId: file.file_id,
              coverPhotoUrl: file.coverPhotoUrl,
            },
          })
        );
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Грешка', 'Не може да се отвори аудио файлът.');
      }
    }
  };

  const getPreviewUrl = () => {
    if (file.file_type === 'document' && thumbnailPath) {
      return thumbnailPath;
    }

    if (file.file_type === 'history_audio') {
      if (file.coverPhotoUrl) {
        console.log('Using cover photo URL:', file.coverPhotoUrl);
        return file.coverPhotoUrl;
      }
      
      if (file.fileUrl) {
        return file.fileUrl;
      }
    }

    return null;
  };

  const getFileTypeInfo = () => {
    switch (file.file_type) {
      case 'document':
        return { 
          icon: '📄', 
          label: 'PDF',
          color: '#ff4444',
          backgroundColor: '#ffebee'
        };
      case 'history_audio':
        return { 
          icon: '🎵', 
          label: 'Audio',
          color: '#4caf50',
          backgroundColor: '#e8f5e9'
        };
      default:
        return { 
          icon: '📎', 
          label: 'File',
          color: '#666',
          backgroundColor: '#f5f5f5'
        };
    }
  };

  const fileTypeInfo = getFileTypeInfo();
  const previewUrl = getPreviewUrl();

  const showImagePreview = () => {
    if (file.file_type === 'document') {
      return !!thumbnailPath;
    }
    
    if (file.file_type === 'history_audio') {
      return !!file.coverPhotoUrl;
    }
    
    return false;
  };

  const renderContent = () => {
    if (isThumbnailLoading) {
      return (
        <View 
          style={{ 
            width: 150, 
            height: 150, 
            borderRadius: 10, 
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ActivityIndicator size="large" color="#0347F2" />
          <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            Зареждане...
          </Text>
        </View>
      );
    }

    if (showImagePreview() && previewUrl) {
      return (
        <Image
          source={{ uri: previewUrl }}
          style={{ width: 150, height: 150, borderRadius: 10 }}
          resizeMode="cover"
          onError={(error) => {
            console.error('Image load error for preview:', error.nativeEvent.error);
            console.log('Failed URL:', previewUrl);
          }}
          onLoad={() => {
            console.log('Image loaded successfully for:', file.file_name);
          }}
        />
      );
    }

    return (
      <View 
        style={{ 
          width: 150, 
          height: 150, 
          borderRadius: 10, 
          backgroundColor: fileTypeInfo.backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e0e0e0',
        }}
      >
        <Text style={{ fontSize: 60, marginBottom: 5 }}>{fileTypeInfo.icon}</Text>
        <Text style={{ 
          fontSize: 12, 
          color: fileTypeInfo.color,
          fontWeight: '600'
        }}>
          {fileTypeInfo.label}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={{ margin: 5, alignItems: 'center', width: 150 }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {renderContent()}
      
      <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12, maxWidth: 150 }}>
        {file.file_name || file.title || 'Untitled'}
      </Text>
      
      <View style={{ 
        backgroundColor: fileTypeInfo.backgroundColor,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4
      }}>
        <Text style={{ 
          fontSize: 10, 
          color: fileTypeInfo.color,
          fontWeight: '500'
        }}>
          {fileTypeInfo.label}
        </Text>
      </View>
      
      {file.is_approved && (
        <View style={{ 
          backgroundColor: '#4CAF50', 
          paddingHorizontal: 8, 
          paddingVertical: 2, 
          borderRadius: 12,
          marginTop: 2
        }}>
          <Text style={{ color: 'white', fontSize: 10 }}>Одобрен</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FilePreviewItem;