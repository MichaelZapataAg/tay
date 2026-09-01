import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'whatsapp'
  | 'accent';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    haptic.selection();
    onPress?.();
  };

  const getContainerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => {
    const list: (ViewStyle | false | undefined)[] = [
      styles.base,
      styles[size],
      styles[variant],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      pressed && !disabled && !loading && styles.pressed,
    ];
    return list.filter(Boolean) as ViewStyle[];
  };

  const getTextColor = (): string => {
    if (disabled) return colors.inkLight;
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'danger':
      case 'whatsapp':
        return '#FFFFFF';
      case 'secondary':
        return colors.primaryDeep;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.inkSecondary;
      default:
        return '#FFFFFF';
    }
  };

  const textColor = getTextColor();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [getContainerStyle({ pressed }), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          {typeof children === 'string' ? (
            <Text style={[styles.text, styles[`text_${size}`], { color: textColor }, textStyle]}>
              {children}
            </Text>
          ) : (
            children
          )}
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    minHeight: 44, // Touch target guideline
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },

  // Sizes
  sm: {
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radii.sm,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    minHeight: 48,
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.lg,
    minHeight: 56,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  accent: {
    backgroundColor: colors.accent,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadows.sm,
  },
  whatsapp: {
    backgroundColor: colors.whatsappDark,
    ...shadows.sm,
  },

  // Text Sizes
  text: {
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
  },
});
