import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ImageModalProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageModal({ visible, images, initialIndex, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy > 0) {
          const translateY = dy;
          const opacity = Math.max(0.4, 1 - dy / (height * 0.6));
          fadeAnim.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy > height * 0.25) {
          handleClose();
        } else {
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      fadeAnim.setValue(1);
    });
  };

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item }}
          style={styles.image}
          resizeMode="contain"
          onError={(e) => console.log('Failed to load image:', item)}
        />

        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => {
            console.log('Download image:', index);
          }}
        >
          <Ionicons name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {images.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(_, index) => `image-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          onScroll={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            if (index !== currentIndex) {
              setCurrentIndex(index);
            }
          }}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {images.length > 1 && renderPagination()}

        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.navButton, styles.navLeft]} onPress={goToPrevious}>
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={[styles.navButton, styles.navRight]} onPress={goToNext}>
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  counterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageContainer: {
    width,
    height: height * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  image: {
    width: width - 20,
    height: height * 0.75,
    borderRadius: 8,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
  },
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 30,
  },
  controlButton: {
    padding: 8,
  },
});