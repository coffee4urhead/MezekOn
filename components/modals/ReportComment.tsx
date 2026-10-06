import { useTheme } from '@/context/ThemeContext';
import { CommentData } from '@/hooks/use-user-comments';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  isOwnComment?: boolean;
  onReport?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function ReportComment({
  visible,
  onClose,
  isOwnComment = false,
  onReport,
  onCopy,
  onDelete,
  onEdit,
}: Props) {
  const { isDark } = useTheme();

  const bg = isDark ? '#1f1f1f' : '#ffffff';
  const textColor = isDark ? '#fff' : '#1a1a1a';
  const dangerColor = '#e74c3c';
  const borderColor = isDark ? '#2a2a2a' : '#eee';

  const handle = (fn?: () => void) => {
    onClose();
    if (fn) setTimeout(fn, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: bg }]}>
              <View style={[styles.handle, { backgroundColor: borderColor }]} />

              {isOwnComment ? (
                <>
                  <MenuItem
                    icon="create-outline"
                    label="Редактирай"
                    color={textColor}
                    onPress={() => handle(onEdit)}
                  />
                  <MenuItem
                    icon="trash-outline"
                    label="Изтрий"
                    color={dangerColor}
                    onPress={() => handle(onDelete)}
                  />
                </>
              ) : (
                <>
                  <MenuItem
                    icon="flag-outline"
                    label="Докладвай"
                    color={dangerColor}
                    onPress={() => handle(onReport)}
                  />
                  <MenuItem
                    icon="copy-outline"
                    label="Копирай текста"
                    color={textColor}
                    onPress={() => handle(onCopy)}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.cancelButton, { borderTopColor: borderColor }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: textColor }]}>Отказ</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});