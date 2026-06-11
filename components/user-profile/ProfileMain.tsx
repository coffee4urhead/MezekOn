import { fetchProfilePhoto } from '@/scripts/util';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeLanguage } from '../../hooks/use-user-side-info';

interface UserMainInfo {
  display_name: string | null;
  email: string | null,
  profile_picture_id: string | null,
  cover_photo_id: string | null,
  bio: string | null;
  location: string | null;
  birth_year: Date | null;
  native_language: NativeLanguage | null;
  other_languages: string[] | null;
  dialect_familiarity: string[] | null;
}

interface ProfileMainProps {
  userInfo: UserMainInfo;
  isDark: boolean;
  onEditPress?: () => void;
  onStatsPress?: (stat: string) => void;
}

export default function ProfileMain({ userInfo, isDark, onEditPress, onStatsPress }: ProfileMainProps) {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Load profile photo separately
  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!userInfo.profile_picture_id) {
        setProfilePhotoUrl(null);
        return;
      }

      setProfileLoading(true);
      setProfileError(false);
      try {
        const photoUrl = await fetchProfilePhoto(userInfo.profile_picture_id, 'profile_pictures');
        console.log('Profile photo URL:', photoUrl);
        setProfilePhotoUrl(photoUrl);
      } catch (error) {
        console.error('Failed to load profile photo:', error);
        setProfilePhotoUrl(null);
        setProfileError(true);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfilePhoto();
  }, [userInfo.profile_picture_id]);

  // Load cover photo separately
  useEffect(() => {
    const loadCoverPhoto = async () => {
      if (!userInfo.cover_photo_id) {
        console.log('No cover_photo_id provided');
        setCoverPhotoUrl(null);
        return;
      }

      console.log('Loading cover photo with ID:', userInfo.cover_photo_id);
      setCoverLoading(true);
      setCoverError(false);
      try {
        const photoUrl = await fetchProfilePhoto(userInfo.cover_photo_id, 'profile_pictures');
        console.log('Cover photo URL:', photoUrl);
        setCoverPhotoUrl(photoUrl);
      } catch (error) {
        console.error('Failed to load cover photo:', error);
        setCoverPhotoUrl(null);
        setCoverError(true);
      } finally {
        setCoverLoading(false);
      }
    };

    loadCoverPhoto();
  }, [userInfo.cover_photo_id]); // Fixed: Now depends on cover_photo_id

  const getAge = () => {
    if (!userInfo.birth_year) return null;
    const today = new Date();
    const birthDate = new Date(userInfo.birth_year);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
   
  const age = getAge();
  const locationText = userInfo.location || 'Location not set';
  const ageText = age ? `, ${age} години` : '';

  return (
    <View style={styles.container}>
      <View style={styles.coverPhotoContainer}>
        <View style={[styles.coverPhotoWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0' }]}>
          {coverLoading ? (
            <ActivityIndicator size="large" color="#0347F2" />
          ) : coverPhotoUrl && !coverError ? (
            <Image
              source={{ uri: coverPhotoUrl }}
              style={styles.coverPhotoImage}
              onError={(e) => {
                console.log('Cover photo load error:', e.nativeEvent.error);
                setCoverError(true);
                setCoverPhotoUrl(null);
              }}
            />
          ) : (
            <View style={styles.coverPhotoPlaceholder}>
              <Ionicons name="image-outline" size={40} color={isDark ? '#666' : '#999'} />
              <Text style={[styles.coverPhotoText, { color: isDark ? '#666' : '#999' }]}>
                No cover photo
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: '#0347F2' }]}>
            {profileLoading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : profilePhotoUrl && !profileError ? (
              <Image
                source={{ uri: profilePhotoUrl }}
                style={styles.avatarImage}
                onError={(e) => {
                  console.log('Profile photo load error:', e.nativeEvent.error);
                  setProfileError(true);
                  setProfilePhotoUrl(null);
                }}
              />
            ) : (
              <Image
                source={require('../../assets/icons/avatar.png')}
                style={styles.avatarImage}
              />
            )}
          </View>
          <TouchableOpacity style={styles.editIconButton} onPress={onEditPress}>
            <Ionicons name="pencil" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.userInfoContainer}>
        <Text style={[styles.displayName, { color: isDark ? '#ffffff' : '#000000' }]}>
          {userInfo.display_name || 'Потребител'}
        </Text>
        <Text style={[styles.displayEmail, { color: isDark ? '#ffffff' : '#000000' }]}>
          {userInfo.email || 'anonymous@email.com'}
        </Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={isDark ? '#888888' : '#666666'} />
          <Text style={[styles.location, { color: isDark ? '#888888' : '#666666' }]}>
            {locationText}{ageText}
          </Text>
        </View>
        {userInfo.bio && (
          <Text style={[styles.bio, { color: isDark ? '#cccccc' : '#555555' }]}>
            {userInfo.bio}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statItem} onPress={() => onStatsPress?.('likes')}>
          <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>128</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888888' : '#666666' }]}>Харесани</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} onPress={() => onStatsPress?.('submissions')}>
          <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>24</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888888' : '#666666' }]}>Предложения</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} onPress={() => onStatsPress?.('comments')}>
          <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>3</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888888' : '#666666' }]}>Коментари</Text>
        </TouchableOpacity>
      </View>

      {(userInfo.native_language || userInfo.other_languages?.length) && (
        <View style={[styles.section, { borderTopColor: isDark ? '#333333' : '#e0e0e0' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Езикова информация
          </Text>
          
          {userInfo.native_language && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: isDark ? '#888888' : '#666666' }]}>
                Роден език:
              </Text>
              <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {userInfo.native_language.charAt(0).toUpperCase() + userInfo.native_language.slice(1)}
              </Text>
            </View>
          )}
          
          {userInfo.other_languages && userInfo.other_languages.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: isDark ? '#888888' : '#666666' }]}>
                Други езици:
              </Text>
              <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {userInfo.other_languages.join(', ')}
              </Text>
            </View>
          )}
          
          {userInfo.dialect_familiarity && userInfo.dialect_familiarity.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: isDark ? '#888888' : '#666666' }]}>
                Диалекти:
              </Text>
              <Text style={[styles.infoValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {userInfo.dialect_familiarity.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverPhotoContainer: {
    position: 'relative',
    marginBottom: 60,
  },
  coverPhotoWrapper: {
    width: '100%',
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverPhotoImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  coverPhotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoText: {
    fontSize: 12,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0347F2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  displayEmail: {
    fontSize: 12,
    fontWeight: 'medium',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    width: 110,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});