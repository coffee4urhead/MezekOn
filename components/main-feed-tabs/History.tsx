import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { UserFileData, useUserFiles } from '@/hooks/use-user-files';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FilePreviewItem from '../previews/PDFArchivePreview';
import CreateButton, { CreationScreen } from '../ui/CreateButton';

type FilterType = 'document' | 'history_audio';

export default function History() {
  const { isDark } = useTheme();
  const { user } = useUser();
  const [filter, setFilter] = useState<FilterType>('document');
  const [filteredFiles, setFilteredFiles] = useState<UserFileData[]>([]);
  
  const { getAllApprovedHistoryArchives, loading } = useUserFiles(user?.$id || '');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const files = await getAllApprovedHistoryArchives();
      setFilteredFiles(files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    const applyFilter = async () => {
      try {
        const files = await getAllApprovedHistoryArchives();
        
        const filtered = files.filter((file: UserFileData) => file.file_type === filter);
        setFilteredFiles(filtered);

      } catch (error) {
        console.error('Failed to filter files:', error);
      }
    };

    applyFilter();
  }, [filter]);

  const getButtonStyle = (buttonFilter: FilterType) => {
    const isActive = filter === buttonFilter;
    return {
      backgroundColor: isActive 
        ? (isDark ? '#4a6fa5' : '#007AFF')
        : (isDark ? '#2a2a2a' : '#f0f0f0'),
      borderColor: isActive 
        ? (isDark ? '#4a6fa5' : '#007AFF')
        : (isDark ? '#3a3a3a' : '#e0e0e0'),
    };
  };

  const getButtonTextStyle = (buttonFilter: FilterType) => {
    const isActive = filter === buttonFilter;
    return {
      color: isActive 
        ? '#ffffff'
        : (isDark ? '#cccccc' : '#666666'),
    };
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
            📜 Разгледай най актуалните исторически архиви
          </Text>
          <Text style={[styles.sectionText, { color: isDark ? '#cccccc' : '#666666' }]}>
            Историята на диалекта в регион Мезек датира от векове. 
            Тук ще намерите статии и изследвания за развитието на местния говор. Архивите включват и информация за историческите събития от национално значение.
          </Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, getButtonStyle('document')]}
            onPress={() => setFilter('document')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, getButtonTextStyle('document')]}>
              📄 PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, getButtonStyle('history_audio'), styles.filterButtonRight]}
            onPress={() => setFilter('history_audio')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, getButtonTextStyle('history_audio')]}>
              🎵 Аудио
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: isDark ? '#cccccc' : '#666666' }}>
                Зареждане...
              </Text>
            </View>
          ) : filteredFiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: isDark ? '#cccccc' : '#666666', textAlign: 'center' }}>
                {filter === 'document' 
                    ? 'Няма налични PDF файлове' 
                    : 'Няма налични аудио файлове'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFiles}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => (
                <FilePreviewItem file={item} />
              )}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.gridRow}
            />
          )}
        </View>
      </ScrollView>

      <CreateButton creationScreen={CreationScreen.History} />
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
    paddingBottom: 100, 
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
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  filterButtonLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  filterButtonRight: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    paddingVertical: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});