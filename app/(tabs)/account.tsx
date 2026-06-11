import ThemeToggleButton from '@/components/CustomHeader';
import ProfileMain from '@/components/user-profile/ProfileMain';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useEffect } from 'react';
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
      setEmail,
      password,
      setPassword,
      login,
      logout,
      register,
      clearCredentials
   } = useUser();
   const { files,
    profilePhoto,
    isUploading,
    isDeleting,
    fetchUserFiles,
    fetchFileById,
    uploadFile,
    deleteFile,
    deleteProfilePhoto,
    updateProfilePhoto,
    getFileUrl,
    getFilesByType,
    getProfilePhotoUrl,
    hasProfilePhoto
  } = useUserFiles(user?.$id || '');

  const coverPhotos = getFilesByType('cover_photo');
  const coverPhoto = coverPhotos.length > 0 ? coverPhotos[0] : null;

  const {
    userSideInfo,
    loading,
    error,
    isUpdating,
    fetchUserSideInfo,
    updateDisplayName,
    updateBio,
    updateLocation,
    updateBirthYear,
    updateNativeLanguage,
    updateOtherLanguages,
    updateDialectFamiliarity,
    updateMultipleFields,
    addOtherLanguage,
    removeOtherLanguage,
    addDialectFamiliarity,
    removeDialectFamiliarity,
    resetError,
    refresh,
    getAge,
    getFormattedBirthYear
  } = useUserSideInformation(user?.$id || '');

  useEffect(() => {
    if (user?.name && !userSideInfo.display_name) {
      updateDisplayName(user.name);
    }
  }, [user?.name, userSideInfo.display_name, updateDisplayName]);

  const handleEditPress = () => {
    console.log('Edit profile pressed');
  };

  const handleStatPress = (stat: string) => {
    console.log(`Stat pressed: ${stat}`);
  };
  
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
          onStatsPress={handleStatPress}></ProfileMain>
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <View>
        <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Loading...</Text>
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