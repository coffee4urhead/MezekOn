import { useTheme } from '@/context/ThemeContext';
import { UserSocialContactsData } from '@/hooks/use-user-socials';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const faceBookLogo = require('@/assets/icons/facebook.png');
const instagramLogo = require('@/assets/icons/instagram.png');
const linkLogo = require('@/assets/icons/link.png');
const linkedinLogo = require('@/assets/icons/linkedin.png');

const openExternalLink = async (url: string) => {
  try {
    if (!url || !url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid Link', 'The URL is not valid');
      return;
    }
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this link');
    }
  } catch (error) {
    console.error('Error opening link:', error);
    Alert.alert('Error', 'Failed to open the link');
  }
};

export default function SocialsDisplay({ 
  website_url, 
  facebook_profile, 
  instagram_profile, 
  linked_in_profile 
}: UserSocialContactsData) {
  
  const { isDark } = useTheme();
  const socialLinks = [website_url, facebook_profile, instagram_profile, linked_in_profile].filter(Boolean);
  const hasAnySocial = socialLinks.length > 0;

  if (!hasAnySocial) {
    return (
      <View style={[styles.socialsContainer, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIconWrapper}>
            <Ionicons name="share-social-outline" size={32} color="#0347F2" />
          </View>
          <Text style={styles.emptyStateTitle}>Connect Your Socials</Text>
          <Text style={styles.emptyStateSubtitle}>
            Add your social media links to connect with other language learners
          </Text>
          <View style={styles.emptyStateChips}>
            <View style={styles.emptyStateChip}>
              <Ionicons name="logo-facebook" size={16} color="#1877f2" />
              <Text style={styles.emptyStateChipText}>Facebook</Text>
            </View>
            <View style={styles.emptyStateChip}>
              <Ionicons name="logo-instagram" size={16} color="#e4405f" />
              <Text style={styles.emptyStateChipText}>Instagram</Text>
            </View>
            <View style={styles.emptyStateChip}>
              <Ionicons name="logo-linkedin" size={16} color="#0a66c2" />
              <Text style={styles.emptyStateChipText}>LinkedIn</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.socialsContainer}>
      <View style={styles.socialsRow}>
        {website_url && (
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={() => openExternalLink(website_url)}
          >
            <View style={[styles.socialIconWrapper, styles.websiteWrapper]}>
              <Image source={linkLogo} style={styles.socialImage} />
            </View>
            <Text style={styles.socialButtonText}>Website</Text>
          </TouchableOpacity>
        )}

        {facebook_profile && (
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={() => openExternalLink(facebook_profile)}
          >
            <View style={[styles.socialIconWrapper, styles.facebookWrapper]}>
              <Image source={faceBookLogo} style={styles.socialImage} />
            </View>
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        )}

        {instagram_profile && (
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={() => openExternalLink(instagram_profile)}
          >
            <View style={[styles.socialIconWrapper, styles.instagramWrapper]}>
              <Image source={instagramLogo} style={styles.socialImage} />
            </View>
            <Text style={styles.socialButtonText}>Instagram</Text>
          </TouchableOpacity>
        )}

        {linked_in_profile && (
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={() => openExternalLink(linked_in_profile)}
          >
            <View style={[styles.socialIconWrapper, styles.linkedinWrapper]}>
              <Image source={linkedinLogo} style={styles.socialImage} />
            </View>
            <Text style={styles.socialButtonText}>LinkedIn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  socialsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyStateIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emptyStateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  emptyStateChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  socialsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  socialCount: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  socialCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0347F2',
  },
  socialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    alignItems: 'center',
    minWidth: 64,
  },
  socialIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  websiteWrapper: {
    backgroundColor: '#f0f0f0',
  },
  facebookWrapper: {
    backgroundColor: '#e7f0ff',
  },
  instagramWrapper: {
    backgroundColor: '#fde8ee',
  },
  linkedinWrapper: {
    backgroundColor: '#e8f0fa',
  },
  socialImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  socialButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
});