import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  isVisible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const getHTML = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #map { 
      height: 100vh; 
      width: 100vw; 
    }
    .loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      z-index: 1000;
      font-size: 16px;
      color: #666;
    }
    .attribution {
      position: absolute;
      bottom: 5px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: rgba(0,0,0,0.5);
      background: rgba(255,255,255,0.8);
      padding: 2px;
      z-index: 1000;
    }
    .leaflet-control-zoom {
      margin-top: 20px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="loading" class="loading">Зареждане на картата...</div>
  <div class="attribution">© OpenStreetMap contributors</div>

  <script>
    let map;
    let marker;
    let currentLat = ${lat};
    let currentLng = ${lng};

    function fetchAddress(lat, lng) {
      fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}&zoom=18&addressdetails=1&accept-language=bg\`, {
        headers: { 'User-Agent': 'YourApp/1.0' }
      })
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'address',
            address: data.display_name
          }));
        }
      })
      .catch(error => console.error('Address error:', error));
    }

    function sendLocationUpdate(lat, lng) {
      currentLat = lat;
      currentLng = lng;
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location',
        latitude: lat,
        longitude: lng
      }));
      
      fetchAddress(lat, lng);
    }

    function initMap() {
      try {
        const lat = ${lat};
        const lng = ${lng};
        
        console.log('Initializing map at:', lat, lng);

        map = L.map('map', {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          minZoom: 3,
          attribution: '© OpenStreetMap',
        }).addTo(map);

        const redIcon = L.icon({
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        marker = L.marker([lat, lng], {
          draggable: true,
          icon: redIcon
        }).addTo(map);

        marker.on('dragend', function(e) {
          const pos = marker.getLatLng();
          console.log('Marker dragged to:', pos.lat, pos.lng);
          sendLocationUpdate(pos.lat, pos.lng);
        });

        map.on('click', function(e) {
          const { lat, lng } = e.latlng;
          console.log('Map clicked at:', lat, lng);
          marker.setLatLng([lat, lng]);
          sendLocationUpdate(lat, lng);
        });

        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'none';
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              const { latitude, longitude } = pos.coords;
              console.log('Got current location:', latitude, longitude);
              map.setView([latitude, longitude], 16);
              marker.setLatLng([latitude, longitude]);
              sendLocationUpdate(latitude, longitude);
            },
            function(error) {
              console.warn('Geolocation error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }

        window.map = map;
        window.marker = marker;
        
        window.getCurrentLocation = function() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              function(pos) {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16);
                marker.setLatLng([latitude, longitude]);
                sendLocationUpdate(latitude, longitude);
              },
              function(error) {
                console.warn('Geolocation error:', error.message);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'Неуспешно получаване на локацията'
                }));
              }
            );
          }
        };

        fetchAddress(lat, lng);

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        const loading = document.getElementById('loading');
        if (loading) {
          loading.innerHTML = 'Грешка при зареждане на картата. Моля, опитайте отново.';
        }
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      initMap();
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(initMap, 100);
    }

    window.onerror = function(msg, url, line, col, error) {
      console.error('Global error:', msg, error);
      const loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML = 'Грешка при зареждане на картата. Моля, опитайте отново.';
      }
    };
  </script>
</body>
</html>
`;

export const WebLocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  isVisible,
  onClose
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      setWebViewError(false);
      if (initialLocation) {
        setSelectedLocation(initialLocation);
      }
    }
  }, [isVisible, initialLocation]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message:', data);
      
      if (data.type === 'location') {
        setSelectedLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      } else if (data.type === 'address') {
        setAddress(data.address);
      } else if (data.type === 'error') {
        Alert.alert('Грешка', data.message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        ...selectedLocation,
        address: address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
      });
      onClose();
    } else {
      Alert.alert('Грешка', 'Моля, изберете локация на картата.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('window.getCurrentLocation();');
    }
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setWebViewError(false);
  };

  const handleWebViewError = () => {
    setWebViewError(true);
    setIsLoading(false);
  };

  const lat = initialLocation?.latitude || 42.6977;
  const lng = initialLocation?.longitude || 23.3219;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Изберете локация</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Потвърди</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0347F2" />
              <Text style={styles.loadingText}>Зареждане на картата...</Text>
            </View>
          )}
          
          {webViewError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4444" />
              <Text style={styles.errorText}>Грешка при зареждане на картата</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setWebViewError(false);
                  setIsLoading(true);
                  if (webViewRef.current) {
                    webViewRef.current.reload();
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Опитайте отново</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ html: getHTML(lat, lng) }}
              style={styles.webView}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={handleWebViewLoad}
              onError={handleWebViewError}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              cacheEnabled={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0347F2" />
                  <Text style={styles.loadingText}>Зареждане на картата...</Text>
                </View>
              )}
            />
          )}
          
          {!isLoading && !webViewError && selectedLocation && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#0347F2" />
              <Text style={styles.locationAddress} numberOfLines={2}>
                {address || 'Зареждане на адрес...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleGetCurrentLocation}
          >
            <Ionicons name="locate" size={20} color="#0347F2" />
            <Text style={styles.currentLocationText}>Текуща локация</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: '#0347F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0347F2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  locationAddress: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#0347F2',
  },
});