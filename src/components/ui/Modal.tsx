import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  contentStyle,
}: ModalProps) {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    haptic.selection();
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing[4]) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeButton}>
              <X size={22} color={colors.inkMuted} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleArea: {
    flex: 1,
    paddingRight: spacing[2],
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing[1],
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
  },
  content: {
    padding: spacing[4],
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
