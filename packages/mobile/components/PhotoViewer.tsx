import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Avoid useSafeAreaInsets / useWindowDimensions here to prevent ReferenceError in some RN environments
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 0;

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const DOUBLE_TAP_MS = 300;

interface PhotoViewerProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ uri, visible, onClose }: PhotoViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const translateRef = useRef(translate);
  const scaleRef = useRef(scale);
  const lastTapRef = useRef(0);
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });

  translateRef.current = translate;
  scaleRef.current = scale;

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!visible) resetTransform();
  }, [visible, resetTransform]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      setScale((s) => (s > 1 ? MIN_SCALE : 2));
      setTranslate({ x: 0, y: 0 });
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => scaleRef.current > 1,
      onMoveShouldSetPanResponder: () => scaleRef.current > 1,
      onPanResponderGrant: (_, gestureState) => {
        const t = translateRef.current;
        panStartRef.current = {
          x: gestureState.x0,
          y: gestureState.y0,
          translateX: t.x,
          translateY: t.y,
        };
      },
      onPanResponderMove: (_, gestureState) => {
        if (scaleRef.current <= 1) return;
        setTranslate({
          x: panStartRef.current.translateX + (gestureState.dx ?? 0),
          y: panStartRef.current.translateY + (gestureState.dy ?? 0),
        });
      },
    })
  ).current;

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + 0.5));
  const zoomOut = () => {
    setScale((s) => {
      const next = Math.max(MIN_SCALE, s - 0.5);
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: STATUS_BAR_HEIGHT, paddingBottom: BOTTOM_INSET }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { top: STATUS_BAR_HEIGHT + 8 }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.zoomBar}>
          <TouchableOpacity
            onPress={zoomOut}
            disabled={scale <= MIN_SCALE}
            style={[styles.zoomBtn, scale <= MIN_SCALE && styles.zoomBtnDisabled]}
            accessibilityLabel="Zoom out"
            accessibilityRole="button"
          >
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{Math.round(scale * 100)}%</Text>
          <TouchableOpacity
            onPress={zoomIn}
            disabled={scale >= MAX_SCALE}
            style={[styles.zoomBtn, scale >= MAX_SCALE && styles.zoomBtnDisabled]}
            accessibilityLabel="Zoom in"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          style={styles.imageContainer}
          onTouchEnd={handleDoubleTap}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={[
              styles.image,
              {
                transform: [
                  { translateX: translate.x },
                  { translateY: translate.y },
                  { scale },
                ],
              },
            ]}
            resizeMode="contain"
            accessibilityLabel="Photo"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBar: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 10,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnDisabled: {
    opacity: 0.4,
  },
  zoomLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    minWidth: 48,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
