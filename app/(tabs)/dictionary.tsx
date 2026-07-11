import ThemeToggleButton from '@/components/CustomHeader';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import { useTheme } from '@/context/ThemeContext';
import { databases } from '@/hooks/appwrite';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { BulgarianAlphabet, DictionaryWord, DictionaryWordMeaning, mappingWordClass, WordWithMeanings } from '../../types/word-types-and-maps';

export default function DictionaryScreen() {
  const { isDark } = useTheme();

  const [allWordsData, setAllWordsData] = useState<WordWithMeanings[]>([]);
  const [filteredWordsData, setFilteredWordsData] = useState<WordWithMeanings[]>([]);
  const [allMeanings, setAllMeanings] = useState<DictionaryWordMeaning[]>([]);
  const [allWordsList, setAllWordsList] = useState<DictionaryWord[]>([]);

  const [selectedLetter, setSelectedLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFilterMenuVisible, setMenuVisibilty] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    wordClass: [],
    dialectRegions: [],
    hasPronunciation: false,
    wordLengthRange: { min: 2, max: 20 }
  });

  const filterIcon = require('@/assets/icons/filter.png');

  useEffect(() => {
    fetchAllWords();
  }, []);

  async function fetchAllDocuments<T>(collectionId: string, limit: number): Promise<T[]> {
    let allDocuments: T[] = [];
    let offset = 0;

    while (true) {
      const response = await databases.listDocuments(
        process.env.EXPO_PUBLIC_DATABASE_WORDS_ID || '',
        collectionId,
        [Query.limit(limit), Query.offset(offset)]
      );

      const documents = response.documents as unknown as T[];
      allDocuments = [...allDocuments, ...documents];

      if (documents.length < limit) break;
      offset += limit;
    }

    return allDocuments;
  }

  const fetchAllWords = async () => {
    setLoading(true);
    try {
      const limit = 100;

      const [wordsResult, meaningsResult] = await Promise.all([
        fetchAllDocuments<DictionaryWord>(
          process.env.EXPO_PUBLIC_COLLECTION_DICTIONARY_WORDS_ID || '',
          limit
        ),
        fetchAllDocuments<DictionaryWordMeaning>(
          process.env.EXPO_PUBLIC_COLLECTION_DICTIONARY_WORDS_MEANINGS_ID || '',
          limit
        )
      ]);

      setAllWordsList(wordsResult);
      setAllMeanings(meaningsResult);
      mapMeaningsToWords(wordsResult, meaningsResult);

    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapMeaningsToWords = (words: DictionaryWord[], meanings: DictionaryWordMeaning[]) => {
    const meaningsMap = new Map<string, DictionaryWordMeaning[]>();

    meanings.forEach(meaning => {
      const existing = meaningsMap.get(meaning.word_id) || [];
      meaningsMap.set(meaning.word_id, [...existing, meaning]);
    });

    for (const [wordId, meaningList] of meaningsMap) {
      meaningList.sort((a, b) => a.meaning_order - b.meaning_order);
    }

    const joinedWords = words.map(word => ({
      word,
      meanings: meaningsMap.get(word.$id) || []
    }));

    setAllWordsData(joinedWords);
    setFilteredWordsData(joinedWords);

    console.log(`📚 Mapped ${joinedWords.length} words with ${meanings.length} total meanings`);

    return joinedWords;
  };

  const getMeaningsWithInheritance = useCallback((
    word: DictionaryWord,
    meanings: DictionaryWordMeaning[],
    words: DictionaryWord[]
  ): { meaning: DictionaryWordMeaning; isInherited: boolean; sourceWord?: DictionaryWord }[] => {

    const result: { meaning: DictionaryWordMeaning; isInherited: boolean; sourceWord?: DictionaryWord }[] = [];

    const directMeanings = meanings.filter(m => m.word_id === word.$id);
    directMeanings.forEach(meaning => {
      result.push({ meaning, isInherited: false });
    });

    const inheritedMeanings = meanings.filter(meaning =>
      meaning.assosiated_with_words_ids?.includes(word.$id)
    );

    inheritedMeanings.forEach(meaning => {
      if (!result.some(r => r.meaning.$id === meaning.$id)) {
        const sourceWord = words.find(w => w.$id === meaning.word_id);
        result.push({
          meaning,
          isInherited: true,
          sourceWord
        });
      }
    });

    result.sort((a, b) => a.meaning.meaning_order - b.meaning.meaning_order);

    return result;
  }, []);

  const applyAllFilters = useCallback((
    wordsData: WordWithMeanings[],
    letter: string,
    filters: FilterOptions
  ) => {
    let filtered = [...wordsData];

    if (letter) {
      filtered = filtered.filter(item =>
        item.word.word.toLowerCase().startsWith(letter.toLowerCase())
      );
    }

    if (filters.wordClass.length > 0) {
      filtered = filtered.filter(item =>
        filters.wordClass.includes(item.word.word_class)
      );
    }

    if (filters.dialectRegions.length > 0) {
      filtered = filtered.filter(item =>
        filters.dialectRegions.includes(item.word.dialect_region)
      );
    }

    if (filters.hasPronunciation) {
      filtered = filtered.filter(item => item.word.pronunciation !== null);
    }

    filtered = filtered.filter(item =>
      item.word.word.length >= filters.wordLengthRange.min &&
      item.word.word.length <= filters.wordLengthRange.max
    );

    setFilteredWordsData(filtered);
    console.log(`Filtered to ${filtered.length} words`);
    return filtered;
  }, []);

  const filterByLetter = useCallback((letter: string) => {
    setSelectedLetter(letter);
    applyAllFilters(allWordsData, letter, advancedFilters);
  }, [allWordsData, advancedFilters, applyAllFilters]);

  const applyFilters = useCallback((filters: FilterOptions) => {
    setAdvancedFilters(filters);
    applyAllFilters(allWordsData, selectedLetter, filters);
  }, [allWordsData, selectedLetter, applyAllFilters]);

  const changeFilterVisibility = useCallback(() => {
    setMenuVisibilty(!isFilterMenuVisible);
  }, [isFilterMenuVisible]);

  const renderAlphabetItem = useCallback(({ item }: { item: string }) => (
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
  ), [selectedLetter, filterByLetter]);

  const DictionaryWordItem = useCallback(({
    wordData
  }: {
    wordData: WordWithMeanings;
  }) => {
    const meaningsWithInheritance = getMeaningsWithInheritance(
      wordData.word,
      allMeanings,
      allWordsList
    );

    return (
      <View style={{
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#333' : '#eee'
      }}>
        <Text style={{ color: isDark ? 'white' : 'black', fontWeight: 'bold', fontSize: 18 }}>
          {wordData.word.word}
        </Text>

        {meaningsWithInheritance.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {/* Show first meaning */}
            <View>
              <Text style={{ color: isDark ? '#ccc' : '#666' }}>
                📖 {meaningsWithInheritance[0].meaning.definition}
              </Text>

              {meaningsWithInheritance[0].meaning.example_sentences?.length > 0 && (
                <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 13, marginTop: 4 }}>
                  📝 "{meaningsWithInheritance[0].meaning.example_sentences[0]}"
                </Text>
              )}

              {/* Show associated words using the correct field name */}
              {meaningsWithInheritance[0].meaning.assosiated_with_words_ids?.length > 0 && (
                <Text style={{ color: '#0347F2', fontSize: 12, marginTop: 4 }}>
                  🔗 Related: {meaningsWithInheritance[0].meaning.assosiated_with_words_ids.join(', ')}
                </Text>
              )}
            </View>

            {/* Show additional meanings count */}
            {meaningsWithInheritance.length > 1 && (
              <Text style={{ color: '#0347F2', fontSize: 12, marginTop: 4 }}>
                +{meaningsWithInheritance.length - 1} more meaning{meaningsWithInheritance.length - 1 > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ color: isDark ? '#888' : '#999', marginTop: 8, fontStyle: 'italic' }}>
            No definition available
          </Text>
        )}

        <Text style={{ color: isDark ? '#999' : '#999', fontSize: 12, marginTop: 2 }}>
          📍 {wordData.word.dialect_region}
        </Text>
        <Text style={{ color: isDark ? '#999' : '#999', fontSize: 12 }}>
          📚 {mappingWordClass[wordData.word.word_class]}
        </Text>
      </View>
    );
  }, [isDark, allMeanings, allWordsList, getMeaningsWithInheritance]);

  const renderWordItem = useCallback(({ item }: { item: WordWithMeanings }) => (
    <DictionaryWordItem wordData={item} />
  ), [DictionaryWordItem]);

  const keyExtractor = useCallback((item: WordWithMeanings) => item.word.$id, []);
  const alphabetKeyExtractor = useCallback((item: string) => item, []);

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
        <Image source={filterIcon} style={styles.icon} />
      </TouchableOpacity>

      <View style={{ flex: 1, marginTop: 20 }}>
        <FlatList
          horizontal
          data={BulgarianAlphabet}
          keyExtractor={alphabetKeyExtractor}
          showsHorizontalScrollIndicator={false}
          renderItem={renderAlphabetItem}
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
              Clear Filter ({allWordsData.length} total words)
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: isDark ? 'white' : 'black' }}>
            Loading {allWordsData.length} words...
          </Text>
        ) : (
          <>
            <Text style={{
              padding: 10,
              color: isDark ? '#ccc' : '#666',
              textAlign: 'center'
            }}>
              Showing {filteredWordsData.length} of {allWordsData.length} words
            </Text>

            <FlatList
              data={filteredWordsData}
              keyExtractor={keyExtractor}
              renderItem={renderWordItem}
              initialNumToRender={20}
              maxToRenderPerBatch={30}
              windowSize={5}
              removeClippedSubviews={true}
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