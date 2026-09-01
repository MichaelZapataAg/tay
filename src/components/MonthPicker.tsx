import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { addMonths, formatPeriod } from '@/lib/period';
import { haptic } from '@/lib/haptics';

export interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const handlePrev = () => {
    haptic.selection();
    onChange(addMonths(value, -1));
  };

  const handleNext = () => {
    haptic.selection();
    onChange(addMonths(value, 1));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePrev} hitSlop={12} style={styles.arrowButton}>
        <ChevronLeft size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.periodTextContainer}>
        <Text style={styles.periodText}>{formatPeriod(value)}</Text>
      </View>
      <Pressable onPress={handleNext} hitSlop={12} style={styles.arrowButton}>
        <ChevronRight size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowButton: {
    padding: spacing[1],
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  periodTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  periodText: {
    ...type.bodyBold,
    color: colors.ink,
    textTransform: 'capitalize',
  },
});
