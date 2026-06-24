import { Dispatch, SetStateAction, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterModalProps {
  isVisible: boolean;
  setVisibility: Dispatch<SetStateAction<boolean>>;
  onApplyFilters: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  wordClass: string[];
  dialectRegions: string[];
  hasPronunciation: boolean;
  wordLengthRange: {
    min: number;
    max: number;
  };
}

const WORD_CLASSES = ['noun', 'verb', 'adjective', 'exclamation', 'adverb'];
const DIALECT_REGIONS = ['North', 'South', 'East', 'West', 'Central']; 

export default function FilterModal({ isVisible, setVisibility, onApplyFilters }: FilterModalProps) {
  const [selectedWordClasses, setSelectedWordClasses] = useState<string[]>([]);
  const [selectedDialects, setSelectedDialects] = useState<string[]>([]);
  const [hasPronunciation, setHasPronunciation] = useState(false);
  const [minLength, setMinLength] = useState(2);
  const [maxLength, setMaxLength] = useState(20);

  const toggleWordClass = (wordClass: string) => {
    if (selectedWordClasses.includes(wordClass)) {
      setSelectedWordClasses(selectedWordClasses.filter(wc => wc !== wordClass));
    } else {
      setSelectedWordClasses([...selectedWordClasses, wordClass]);
    }
  };

  const toggleDialect = (dialect: string) => {
    if (selectedDialects.includes(dialect)) {
      setSelectedDialects(selectedDialects.filter(d => d !== dialect));
    } else {
      setSelectedDialects([...selectedDialects, dialect]);
    }
  };

  const resetFilters = () => {
    setSelectedWordClasses([]);
    setSelectedDialects([]);
    setHasPronunciation(false);
    setMinLength(2);
    setMaxLength(20);
  };

  const applyFilters = () => {
    onApplyFilters({
      wordClass: selectedWordClasses,
      dialectRegions: selectedDialects,
      hasPronunciation: hasPronunciation,
      wordLengthRange: {
        min: minLength,
        max: maxLength
      }
    });
    setVisibility(false);
  };

  const WordLengthSlider = () => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>Word Length Range</Text>
      
      <View style={styles.lengthControlContainer}>
        <Text style={styles.lengthLabel}>Minimum:</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.incrementButton, styles.decrementButton]} 
            onPress={() => setMinLength(Math.max(1, minLength - 1))}>
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.lengthValue}>{minLength}</Text>
          <TouchableOpacity 
            style={[styles.incrementButton, styles.incrementButtonRight]} 
            onPress={() => setMinLength(Math.min(maxLength - 1, minLength + 1))}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.lengthControlContainer}>
        <Text style={styles.lengthLabel}>Maximum:</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.incrementButton, styles.decrementButton]} 
            onPress={() => setMaxLength(Math.max(minLength + 1, maxLength - 1))}>
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.lengthValue}>{maxLength}</Text>
          <TouchableOpacity 
            style={[styles.incrementButton, styles.incrementButtonRight]} 
            onPress={() => setMaxLength(Math.min(50, maxLength + 1))}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rangePreview}>
        <Text style={styles.rangePreviewText}>
          Range: {minLength} – {maxLength} letters
        </Text>
        <View style={styles.rangeBar}>
          <View style={[styles.rangeFill, { 
            left: `${((minLength - 1) / 49) * 100}%`,
            right: `${100 - ((maxLength - 1) / 49) * 100}%`
          }]} />
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setVisibility(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔍 Advanced Filters</Text>
            <TouchableOpacity onPress={() => setVisibility(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Word Class</Text>
              <View style={styles.chipContainer}>
                {WORD_CLASSES.map((wordClass) => (
                  <TouchableOpacity
                    key={wordClass}
                    style={[
                      styles.chip,
                      selectedWordClasses.includes(wordClass) && styles.chipSelected
                    ]}
                    onPress={() => toggleWordClass(wordClass)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedWordClasses.includes(wordClass) && styles.chipTextSelected
                    ]}>
                      {wordClass}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Dialect Region</Text>
              <View style={styles.chipContainer}>
                {DIALECT_REGIONS.map((dialect) => (
                  <TouchableOpacity
                    key={dialect}
                    style={[
                      styles.chip,
                      selectedDialects.includes(dialect) && styles.chipSelected
                    ]}
                    onPress={() => toggleDialect(dialect)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedDialects.includes(dialect) && styles.chipTextSelected
                    ]}>
                      {dialect}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔊 Pronunciation</Text>
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setHasPronunciation(!hasPronunciation)}
              >
                <View style={[
                  styles.checkbox,
                  hasPronunciation && styles.checkboxChecked
                ]}>
                  {hasPronunciation && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.toggleLabel}>Only show words with pronunciation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📏 Word Length</Text>
              <WordLengthSlider />
            </View>

            {(selectedWordClasses.length > 0 || selectedDialects.length > 0 || hasPronunciation || minLength > 2 || maxLength < 20) && (
              <View style={styles.activeFiltersSection}>
                <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
                <View style={styles.activeFiltersContainer}>
                  {selectedWordClasses.map(wc => (
                    <View key={wc} style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>{wc}</Text>
                    </View>
                  ))}
                  {selectedDialects.map(d => (
                    <View key={d} style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>{d}</Text>
                    </View>
                  ))}
                  {hasPronunciation && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>Has pronunciation</Text>
                    </View>
                  )}
                  {(minLength > 2 || maxLength < 20) && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>{minLength}-{maxLength} letters</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0347F2',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#0347F2',
    borderColor: '#0347F2',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: 'white',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0347F2',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0347F2',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
  },
  activeFiltersSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginTop: 10,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeFilterBadge: {
    backgroundColor: '#0347F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 11,
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0347F2',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  lengthControlContainer: {
    marginBottom: 20,
  },
  lengthLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0347F2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  decrementButton: {
    backgroundColor: '#ff6b6b',
  },
  incrementButtonRight: {
    backgroundColor: '#51cf66',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  lengthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0347F2',
    minWidth: 50,
    textAlign: 'center',
    marginHorizontal: 15,
  },
  rangePreview: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rangePreviewText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  rangeBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    position: 'relative',
  },
  rangeFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#0347F2',
    borderRadius: 2,
  },
});