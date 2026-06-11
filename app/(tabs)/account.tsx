import ThemeToggleButton from '@/components/CustomHeader';
import EditProfileModal from '@/components/EditProfileInfoModal';
import ProfileMain from '@/components/user-profile/ProfileMain';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUserSocialContacts } from '@/hooks/use-user-socials';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUserFiles } from '../../hooks/use-user-files';
import { useUserSideInformation } from '../../hooks/use-user-side-info';

export default function AboutScreen() {
  const { isDark } = useTheme();
  const {
      user,
      isLoggedIn,
      isLoading,
      email,
   } = useUser();
   
   const { 
    profilePhoto,
    getFilesByType,
  } = useUserFiles(user?.$id || '');

  const coverPhotos = getFilesByType('cover_photo');
  const coverPhoto = coverPhotos.length > 0 ? coverPhotos[0] : null;

  const {
    userSideInfo,
    loading,
    error,
    updateDisplayName,
    updateMultipleFields,
  } = useUserSideInformation(user?.$id || '');

  const {
    socialContacts,
    updateSocialLinks,
  } = useUserSocialContacts(user?.$id || '');

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.name && !userSideInfo.display_name) {
      updateDisplayName(user.name);
    }
  }, [user?.name, userSideInfo.display_name, updateDisplayName]);

  const handleEditPress = () => {
    console.log('Edit profile pressed');
    setIsEditModalVisible(true); 
  };

  const handleStatPress = (stat: string) => {
    console.log(`Stat pressed: ${stat}`);
  };

  const handleSaveProfile = async (updates: any) => {
    setIsSaving(true);
    try {
      const userUpdates: any = {};
      const socialUpdates: any = {};
      
      const userFields = [
        'display_name', 'bio', 'location', 'birth_year', 
        'native_language', 'other_languages', 'dialect_familiarity'
      ];
      const socialFields = [
        'website_url', 'facebook_profile', 'instagram_profile', 'linked_in_profile'
      ];
      
      Object.keys(updates).forEach(key => {
        if (userFields.includes(key)) {
          userUpdates[key] = updates[key];
        } else if (socialFields.includes(key)) {
          socialUpdates[key] = updates[key];
        }
      });
      
      if (Object.keys(userUpdates).length > 0) {
        await updateMultipleFields(userUpdates);
      }
      if (Object.keys(socialUpdates).length > 0) {
        await updateSocialLinks(socialUpdates);
      }
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <View style={styles.centerContent}>
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  return (
    isLoggedIn ? (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <ProfileMain
              userInfo={{
                ...userSideInfo,
                email: email,
                profile_picture_id: profilePhoto?.file_id || '',
                cover_photo_id: coverPhoto?.file_id || ''
              }}
              isDark={isDark}
              onEditPress={handleEditPress}
              onStatsPress={handleStatPress}
            />
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isVisible={isEditModalVisible}
          setVisibility={setIsEditModalVisible}
          userInfo={userSideInfo}
          socialInfo={socialContacts}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
      </View>
    ) : (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <View style={styles.centerContent}>
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Please log in</Text>
        </View>
      </View>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});