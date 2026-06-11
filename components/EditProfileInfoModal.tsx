import { Ionicons } from '@expo/vector-icons';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeLanguage } from '../hooks/use-user-side-info';

interface EditProfileModalProps {
  isVisible: boolean;
  setVisibility: Dispatch<SetStateAction<boolean>>;
  userInfo: {
    display_name: string | null;
    bio: string | null;
    location: string | null;
    birth_year: Date | null;
    native_language: NativeLanguage | null;
    other_languages: string[] | null;
    dialect_familiarity: string[] | null;
  };
  socialInfo: {
    website_url: string | null;
    facebook_profile: string | null;
    instagram_profile: string | null;
    linked_in_profile: string | null;
  };
  onSave: (updates: {
    display_name?: string | null;
    bio?: string | null;
    location?: string | null;
    birth_year?: Date | null;
    native_language?: NativeLanguage | null;
    other_languages?: string[] | null;
    dialect_familiarity?: string[] | null;
    website_url?: string | null;
    facebook_profile?: string | null;
    instagram_profile?: string | null;
    linked_in_profile?: string | null;
  }) => Promise<void>;
  isSaving: boolean;
}

const NATIVE_LANGUAGES: NativeLanguage[] = ['bulgarian', 'turkish', 'english', 'greek', 'romanian'];
const OTHER_LANGUAGES_OPTIONS = ['Bulgarian', 'Turkish', 'English', 'Greek', 'Romanian', 'German', 'French', 'Spanish', 'Italian', 'Russian'];
const DIALECT_OPTIONS = ['North Bulgarian', 'South Bulgarian', 'East Bulgarian', 'West Bulgarian', 'Rhodope', 'Shop', 'Balkan', 'Dobrudzha', 'Moesian', 'Thracian'];

export default function EditProfileModal({
  isVisible,
  setVisibility,
  userInfo,
  socialInfo,
  onSave,
  isSaving,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | ''>('');
  const [otherLanguages, setOtherLanguages] = useState<string[]>([]);
  const [dialectFamiliarity, setDialectFamiliarity] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showOtherPicker, setShowOtherPicker] = useState(false);
  const [showDialectPicker, setShowDialectPicker] = useState(false);
  const [tempOtherLanguage, setTempOtherLanguage] = useState('');
  const [tempDialect, setTempDialect] = useState('');

  useEffect(() => {
    if (isVisible) {
      setDisplayName(userInfo.display_name || '');
      setBio(userInfo.bio || '');
      setLocation(userInfo.location || '');
      setBirthYear(userInfo.birth_year ? new Date(userInfo.birth_year).getFullYear().toString() : '');
      setNativeLanguage(userInfo.native_language || '');
      setOtherLanguages(userInfo.other_languages || []);
      setDialectFamiliarity(userInfo.dialect_familiarity || []);
      setWebsite(socialInfo.website_url || '');
      setFacebook(socialInfo.facebook_profile || '');
      setInstagram(socialInfo.instagram_profile || '');
      setLinkedin(socialInfo.linked_in_profile || '');
    }
  }, [isVisible, userInfo, socialInfo]);

  const handleSave = async () => {
    const updates: any = {};

    if (displayName !== (userInfo.display_name || '')) updates.display_name = displayName || null;
    if (bio !== (userInfo.bio || '')) updates.bio = bio || null;
    if (location !== (userInfo.location || '')) updates.location = location || null;
    if (birthYear !== (userInfo.birth_year ? new Date(userInfo.birth_year).getFullYear().toString() : '')) {
      updates.birth_year = birthYear ? new Date(parseInt(birthYear), 0, 1) : null;
    }
    if (nativeLanguage !== (userInfo.native_language || '')) updates.native_language = nativeLanguage || null;
    
    const otherLangsChanged = JSON.stringify(otherLanguages.sort()) !== JSON.stringify((userInfo.other_languages || []).sort());
    if (otherLangsChanged) updates.other_languages = otherLanguages.length ? otherLanguages : null;
    
    const dialectsChanged = JSON.stringify(dialectFamiliarity.sort()) !== JSON.stringify((userInfo.dialect_familiarity || []).sort());
    if (dialectsChanged) updates.dialect_familiarity = dialectFamiliarity.length ? dialectFamiliarity : null;

    if (website !== (socialInfo.website_url || '')) updates.website_url = website || null;
    if (facebook !== (socialInfo.facebook_profile || '')) updates.facebook_profile = facebook || null;
    if (instagram !== (socialInfo.instagram_profile || '')) updates.instagram_profile = instagram || null;
    if (linkedin !== (socialInfo.linked_in_profile || '')) updates.linked_in_profile = linkedin || null;

    if (Object.keys(updates).length > 0) {
      await onSave(updates);
    }
    setVisibility(false);
  };

  const addOtherLanguage = () => {
    if (tempOtherLanguage && !otherLanguages.includes(tempOtherLanguage)) {
      setOtherLanguages([...otherLanguages, tempOtherLanguage]);
      setTempOtherLanguage('');
      setShowOtherPicker(false);
    }
  };

  const removeOtherLanguage = (lang: string) => {
    setOtherLanguages(otherLanguages.filter(l => l !== lang));
  };

  const addDialect = () => {
    if (tempDialect && !dialectFamiliarity.includes(tempDialect)) {
      setDialectFamiliarity([...dialectFamiliarity, tempDialect]);
      setTempDialect('');
      setShowDialectPicker(false);
    }
  };

  const removeDialect = (dialect: string) => {
    setDialectFamiliarity(dialectFamiliarity.filter(d => d !== dialect));
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

  const InputField = ({ label, value, onChange, placeholder, multiline = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
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
            <View>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>Update your personal information</Text>
            </View>
            <TouchableOpacity onPress={() => setVisibility(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Basic Information */}
            <Section title="Basic Information" icon="person-outline">
              <InputField
                label="Display Name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Your display name"
              />
              <InputField
                label="Bio"
                value={bio}
                onChange={setBio}
                placeholder="Tell something about yourself"
                multiline
              />
              <InputField
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="City, Country"
              />
              <InputField
                label="Birth Year"
                value={birthYear}
                onChange={setBirthYear}
                placeholder="YYYY"
                keyboardType="numeric"
              />
            </Section>

            {/* Language Information */}
            <Section title="Language Information" icon="language-outline">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Native Language</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowNativePicker(!showNativePicker)}
                >
                  <Text style={styles.pickerButtonText}>
                    {nativeLanguage ? nativeLanguage.charAt(0).toUpperCase() + nativeLanguage.slice(1) : 'Select native language'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {showNativePicker && (
                  <View style={styles.pickerDropdown}>
                    {NATIVE_LANGUAGES.map(lang => (
                      <TouchableOpacity
                        key={lang}
                        style={styles.pickerOption}
                        onPress={() => {
                          setNativeLanguage(lang);
                          setShowNativePicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </Text>
                        {nativeLanguage === lang && <Ionicons name="checkmark" size={20} color="#0347F2" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Other Languages</Text>
                <View style={styles.chipContainer}>
                  {otherLanguages.map(lang => (
                    <View key={lang} style={styles.chip}>
                      <Text style={styles.chipText}>{lang}</Text>
                      <TouchableOpacity onPress={() => removeOtherLanguage(lang)}>
                        <Ionicons name="close-circle" size={18} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addChip}
                    onPress={() => setShowOtherPicker(!showOtherPicker)}
                  >
                    <Ionicons name="add" size={20} color="#0347F2" />
                    <Text style={styles.addChipText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {showOtherPicker && (
                  <View style={styles.pickerDropdown}>
                    <View style={styles.pickerSearch}>
                      <TextInput
                        style={styles.pickerInput}
                        placeholder="Search or add language..."
                        value={tempOtherLanguage}
                        onChangeText={setTempOtherLanguage}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity style={styles.pickerAddButton} onPress={addOtherLanguage}>
                        <Text style={styles.pickerAddButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerList}>
                      {OTHER_LANGUAGES_OPTIONS.filter(l => 
                        l.toLowerCase().includes(tempOtherLanguage.toLowerCase()) &&
                        !otherLanguages.includes(l)
                      ).map(lang => (
                        <TouchableOpacity
                          key={lang}
                          style={styles.pickerOption}
                          onPress={() => {
                            if (!otherLanguages.includes(lang)) {
                              setOtherLanguages([...otherLanguages, lang]);
                              setShowOtherPicker(false);
                              setTempOtherLanguage('');
                            }
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{lang}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dialect Familiarity</Text>
                <View style={styles.chipContainer}>
                  {dialectFamiliarity.map(dialect => (
                    <View key={dialect} style={styles.chip}>
                      <Text style={styles.chipText}>{dialect}</Text>
                      <TouchableOpacity onPress={() => removeDialect(dialect)}>
                        <Ionicons name="close-circle" size={18} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addChip}
                    onPress={() => setShowDialectPicker(!showDialectPicker)}
                  >
                    <Ionicons name="add" size={20} color="#0347F2" />
                    <Text style={styles.addChipText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {showDialectPicker && (
                  <View style={styles.pickerDropdown}>
                    <View style={styles.pickerSearch}>
                      <TextInput
                        style={styles.pickerInput}
                        placeholder="Search dialect..."
                        value={tempDialect}
                        onChangeText={setTempDialect}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity style={styles.pickerAddButton} onPress={addDialect}>
                        <Text style={styles.pickerAddButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerList}>
                      {DIALECT_OPTIONS.filter(d => 
                        d.toLowerCase().includes(tempDialect.toLowerCase()) &&
                        !dialectFamiliarity.includes(d)
                      ).map(dialect => (
                        <TouchableOpacity
                          key={dialect}
                          style={styles.pickerOption}
                          onPress={() => {
                            if (!dialectFamiliarity.includes(dialect)) {
                              setDialectFamiliarity([...dialectFamiliarity, dialect]);
                              setShowDialectPicker(false);
                              setTempDialect('');
                            }
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{dialect}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </Section>

            <Section title="Social Links" icon="share-social-outline">
              <InputField
                label="Website"
                value={website}
                onChange={setWebsite}
                placeholder="https://your-website.com"
              />
              <InputField
                label="Facebook"
                value={facebook}
                onChange={setFacebook}
                placeholder="https://facebook.com/username"
              />
              <InputField
                label="Instagram"
                value={instagram}
                onChange={setInstagram}
                placeholder="https://instagram.com/username"
              />
              <InputField
                label="LinkedIn"
                value={linkedin}
                onChange={setLinkedin}
                placeholder="https://linkedin.com/in/username"
              />
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setVisibility(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerSearch: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  pickerAddButton: {
    backgroundColor: '#0347F2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  pickerAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#0347F2',
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 14,
    color: '#0347F2',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0347F2',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});