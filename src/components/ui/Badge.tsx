import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';

export type BadgeVariant =
  | 'today'
  | 'due'
  | 'paid'
  | 'upcoming'
  | 'neutral'
  | 'accent'
  | 'interest';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'neutral', icon, style }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'today':
        return { bg: colors.todaySoft, text: colors.today, border: colors.todayBorder };
      case 'due':
        return { bg: colors.dueSoft, text: colors.due, border: colors.dueBorder };
      case 'paid':
        return { bg: colors.paidSoft, text: colors.paid, border: colors.primarySoft };
      case 'upcoming':
        return { bg: colors.primarySubtle, text: colors.primaryDark, border: colors.primarySoft };
      case 'accent':
        return { bg: colors.accentSoft, text: colors.accentDark, border: colors.accent };
      case 'interest':
        return { bg: colors.interestSoft, text: colors.interestDark, border: colors.primarySoft };
      default:
        return { bg: colors.surfaceSubtle, text: colors.inkSecondary, border: colors.border };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  },
});
