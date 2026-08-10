import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "expo-router/react-navigation";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function PDFViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  const params = route.params as {
    fileUrl: string;
    fileName: string;
    fileId: string;
  };
  
  const { fileUrl, fileName } = params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this PDF: ${fileName}`,
        url: fileUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const pdfUrl = `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <View style={[styles.header, { 
        backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
        borderBottomColor: isDark ? '#333' : '#e0e0e0'
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]} numberOfLines={1}>
          {fileName}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>

      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0347F2" />
            <Text style={[styles.loadingText, { color: isDark ? '#ccc' : '#666' }]}>
              Зареждане на PDF...
            </Text>
          </View>
        )}
        
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webview}
          startInLoadingState={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0347F2" />
              <Text style={[styles.loadingText, { color: isDark ? '#ccc' : '#666' }]}>
                Зареждане на PDF...
              </Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsFullscreenVideo={true}
          cacheEnabled={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  shareButton: {
    padding: 8,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  webview: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});