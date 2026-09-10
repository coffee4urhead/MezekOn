import ThemeToggleButton from '@/components/CustomHeader';
import EditProfileModal from '@/components/EditProfileInfoModal';
import ProfileMain from '@/components/user-profile/ProfileMain';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUserSocialContacts } from '@/hooks/use-user-socials';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RNFile, UserFileData, useUserFiles } from '../../hooks/use-user-files';
import { useUserSideInformation } from '../../hooks/use-user-side-info';

// use UseLocalSearchParams and give it only the user id. Then make the check if the given id is the id of the original owner of the account
export default function AboutScreen() {
  const { isDark } = useTheme();
  const {
      user,
      isLoggedIn,
      isLoading,
      email,
      logout, 
   } = useUser();
   
   const { 
    profilePhoto,
    coverPhoto,
    getFilesByType,
    updateProfilePhoto,
    updateCoverPhoto,
  } = useUserFiles(user?.$id || '');

  const coverPhotos = getFilesByType('cover_photo');
  const coverPhotoFromFiles = coverPhotos.length > 0 ? coverPhotos[0] : null;

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
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

  const handleUpdateProfilePhoto = async (asset: RNFile): Promise<UserFileData> => {
    const rnFile: RNFile = {
      uri: asset.uri,
      name: asset.name || 'profile.jpg',
      type: asset.type || 'image/jpeg',
    };

    return await updateProfilePhoto(rnFile);
  };

  const handleUpdateCoverPhoto = async (asset: RNFile): Promise<UserFileData> => {
    const rnFile: RNFile = {
      uri: asset.uri,
      name: asset.name || 'cover.jpg',
      type: asset.type || 'image/jpeg',
    };

    return await updateCoverPhoto(rnFile);
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
  
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <View style={styles.centerContent}>
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Please log in</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ProfileMain
            userInfo={{
              ...userSideInfo,
              email: email,
              profile_picture_id: profilePhoto?.file_id || '',
              cover_photo_id: coverPhotoFromFiles?.file_id || '',
              website_url: socialContacts.website_url || '',
              facebook_profile: socialContacts.facebook_profile || '',
              instagram_profile: socialContacts.instagram_profile || '',
              linked_in_profile: socialContacts.linked_in_profile || '',
            }}
            isDark={isDark}
            onEditPress={handleEditPress}
            onStatsPress={handleStatPress}
          />
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Изход</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <EditProfileModal
        isVisible={isEditModalVisible}
        setVisibility={setIsEditModalVisible}
        userInfo={userSideInfo}
        socialInfo={socialContacts}
        onSave={handleSaveProfile}
        onUpdateProfilePhoto={handleUpdateProfilePhoto}
        onUpdateCoverPhoto={handleUpdateCoverPhoto}
        isSaving={isSaving}
        profilePhotoUrl={profilePhoto?.fileUrl}
        coverPhotoUrl={coverPhoto?.fileUrl}
      />
    </View>
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
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});