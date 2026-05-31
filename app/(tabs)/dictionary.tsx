import ThemeToggleButton from '@/components/CustomHeader';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import { useTheme } from '@/context/ThemeContext';
import { databases } from '@/hooks/appwrite';
import { Models, Query } from 'appwrite';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BulgarianAlphabet = [
  'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й',
  'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у',
  'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ь', 'ю', 'я'
];

type TypeOfWord = 'noun' | 'verb' | 'adjective' | 'exclamation' | 'adverb';

interface DictionaryWord extends Models.Document {
  word: string;
  dialect_region: string;
  pronunciation: string | null;
  word_class: TypeOfWord;
}

export default function DictionaryScreen() {
  const { isDark } = useTheme();
  const [allWords, setAllWords] = useState<DictionaryWord[]>([]); 
  const [filteredWords, setFilteredWords] = useState<DictionaryWord[]>([]); 
  const [selectedLetter, setSelectedLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFilterMenuVisible, setMenuVisibilty] = useState(false);

  const filterIcon = require('@/assets/icons/filter.png');

  useEffect(() => {
    fetchAllWords();
  }, []);

  const fetchAllWords = async () => {
    setLoading(true);
    try {
      let allDocuments: DictionaryWord[] = [];
      let offset = 0;
      const limit = 100;
      
      while (true) {
        const response = await databases.listDocuments(
          process.env.EXPO_PUBLIC_DATABASE_WORDS_ID || '',
          process.env.EXPO_PUBLIC_COLLECTION_DICTIONARY_WORDS_ID || '',
          [
            Query.limit(limit),
            Query.offset(offset)
          ]
        );
        
        const documents = response.documents as unknown as DictionaryWord[];
        allDocuments = [...allDocuments, ...documents];
        
        if (documents.length < limit) {
          break;
        }
        
        offset += limit;
      }
      
      setAllWords(allDocuments);
      setFilteredWords(allDocuments); 
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByLetter = (letter: string) => {
    setSelectedLetter(letter);
    
    if (!letter) {
      setFilteredWords(allWords);
      return;
    }
    
    const filtered = allWords.filter(word => 
      word.word.toLowerCase().startsWith(letter.toLowerCase())
    );
    
    setFilteredWords(filtered);
    console.log(`Filtered to ${filtered.length} words starting with '${letter}'`);
  };

  const applyFilters = (filters: FilterOptions) => {
    let filtered = [...allWords];
    
    if (selectedLetter) {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().startsWith(selectedLetter.toLowerCase())
      );
    }
    
    if (filters.wordClass.length > 0) {
    filtered = filtered.filter(word => {
      const matches = filters.wordClass.includes(word.word_class);
      if (!matches) {
        console.log(`Filtering out: ${word.word} (${word.word_class}) not in ${filters.wordClass}`);
      }
      return matches;
    });
  }
    
    if (filters.dialectRegions.length > 0) {
      filtered = filtered.filter(word => 
        filters.dialectRegions.includes(word.dialect_region)
      );
    }
    
    if (filters.hasPronunciation) {
      filtered = filtered.filter(word => word.pronunciation !== null);
    }
    
    filtered = filtered.filter(word => 
      word.word.length >= filters.wordLengthRange.min && 
      word.word.length <= filters.wordLengthRange.max
    );
    
    setFilteredWords(filtered);
  };

  const changeFilterVisibility = () => {
    setMenuVisibilty(!isFilterMenuVisible);
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <TouchableOpacity 
        onPress={changeFilterVisibility}
        style={{
          height: 44,
          width: 40,
          padding: 15,
          marginTop: 5,
          backgroundColor: '#0347F2',
          borderRadius: 5,
          position: 'absolute',
          top: 100,
          left: 5,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999, 
        }}>
          <Image
            source={filterIcon}
            style={styles.icon}>
          </Image>
      </TouchableOpacity>
      
      <View style={{ flex: 1, marginTop: 20 }}>
        <FlatList
          horizontal
          data={BulgarianAlphabet}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => filterByLetter(item)}
              style={{
                height: 65,
                width: 40,
                padding: 15,
                margin: 5,
                backgroundColor: selectedLetter === item ? '#24f589' : '#0347F2',
                borderRadius: 5,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        />
        
        <FilterModal 
          isVisible={isFilterMenuVisible} 
          setVisibility={setMenuVisibilty}
          onApplyFilters={applyFilters}
        />
        
        {selectedLetter && (
          <TouchableOpacity 
            onPress={() => filterByLetter('')}
            style={{
              padding: 8,
              margin: 10,
              backgroundColor: '#FF4444',
              borderRadius: 5,
              alignSelf: 'center',
            }}>
            <Text style={{ color: 'white' }}>
              Clear Filter ({allWords.length} total words)
            </Text>
          </TouchableOpacity>
        )}
        
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: isDark ? 'white' : 'black' }}>
            Loading {allWords.length} words...
          </Text>
        ) : (
          <>
            <Text style={{ 
              padding: 10, 
              color: isDark ? '#ccc' : '#666',
              textAlign: 'center' 
            }}>
              Showing {filteredWords.length} of {allWords.length} words
            </Text>
            
            <FlatList
              data={filteredWords}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => (
                <View style={{ 
                  padding: 15, 
                  borderBottomWidth: 1, 
                  borderBottomColor: isDark ? '#333' : '#eee' 
                }}>
                  <Text style={{ color: isDark ? 'white' : 'black', fontWeight: 'bold', fontSize: 18 }}>
                    {item.word}
                  </Text>
                  <Text style={{ color: isDark ? '#ccc' : '#666', fontSize: 14, marginTop: 4 }}>
                    📍 {item.dialect_region}
                  </Text>
                  {item.pronunciation && (
                    <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 13, marginTop: 2 }}>
                      🔊 /{item.pronunciation}/
                    </Text>
                  )}
                  <Text style={{ color: isDark ? '#999' : '#999', fontSize: 12, marginTop: 2 }}>
                    📚 {item.word_class}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20, color: isDark ? 'white' : 'black' }}>
                  {selectedLetter ? `No words starting with '${selectedLetter}'` : 'No words found'}
                </Text>
              }
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  }
});