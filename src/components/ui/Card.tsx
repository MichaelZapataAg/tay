import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '@/lib/colors';
import { radii, spacing, shadows } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'subtle' | 'today' | 'due' | 'accent';
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 4,
}: CardProps) {
  const content = (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptic.selection();
          onPress();
        }}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  subtle: {
    backgroundColor: colors.surfaceSubtle,
  },
  today: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.today,
    ...shadows.sm,
  },
  due: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.due,
    ...shadows.sm,
  },
  accent: {
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
});
