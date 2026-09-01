import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  badgeVariant?: 'today' | 'due' | 'paid' | 'neutral';
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!isSelected) {
                haptic.selection();
                onChange(opt.value);
              }
            }}
            style={[styles.item, isSelected && styles.itemSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {opt.label}
            </Text>
            {opt.count != null ? (
              <View
                style={[
                  styles.badge,
                  isSelected
                    ? styles.badgeSelected
                    : opt.badgeVariant === 'due'
                    ? styles.badgeDue
                    : opt.badgeVariant === 'today'
                    ? styles.badgeToday
                    : styles.badgeNeutral,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isSelected ? styles.badgeTextSelected : null,
                  ]}
                >
                  {opt.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
  },
  itemSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  labelSelected: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  badge: {
    marginLeft: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  badgeSelected: {
    backgroundColor: colors.primary,
  },
  badgeToday: {
    backgroundColor: colors.todaySoft,
  },
  badgeDue: {
    backgroundColor: colors.dueSoft,
  },
  badgeNeutral: {
    backgroundColor: colors.border,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkSecondary,
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
});
