import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { dateLong } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export interface DateFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChangeValue: (isoDate: string) => void;
  error?: string | null;
  helperText?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  shortcuts?: ('hoy' | 'ayer' | '+15d' | '+30d' | '+7d' | '+20d')[];
}

export function DateField({
  label,
  value,
  onChangeValue,
  error,
  helperText,
  containerStyle,
  shortcuts = ['hoy', '+15d', '+30d', '+7d'],
}: DateFieldProps) {
  // value viene en YYYY-MM-DD
  const [year, setYear] = useState(() => (value ? value.split('-')[0] : ''));
  const [month, setMonth] = useState(() => (value ? value.split('-')[1] : ''));
  const [day, setDay] = useState(() => (value ? value.split('-')[2] : ''));

  const updateParent = (y: string, m: string, d: string) => {
    if (y.length === 4 && m.length === 2 && d.length === 2) {
      onChangeValue(`${y}-${m}-${d}`);
    }
  };

  const setDateObj = (date: Date) => {
    haptic.selection();
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setYear(y);
    setMonth(m);
    setDay(d);
    onChangeValue(`${y}-${m}-${d}`);
  };

  const handleShortcut = (sc: string) => {
    const now = new Date();
    switch (sc) {
      case 'hoy':
        setDateObj(now);
        break;
      case 'ayer': {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        setDateObj(d);
        break;
      }
      case '+15d': {
        const d = new Date(now);
        d.setDate(d.getDate() + 15);
        setDateObj(d);
        break;
      }
      case '+30d': {
        const d = new Date(now);
        d.setDate(d.getDate() + 30);
        setDateObj(d);
        break;
      }
      case '+7d': {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        setDateObj(d);
        break;
      }
      case '+20d': {
        const d = new Date(now);
        d.setDate(d.getDate() + 20);
        setDateObj(d);
        break;
      }
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Calendar size={20} color={colors.primary} style={styles.icon} />

        {/* Día */}
        <TextInput
          value={day}
          onChangeText={(val) => {
            const clean = val.replace(/\D/g, '').slice(0, 2);
            setDay(clean);
            updateParent(year, month, clean);
          }}
          placeholder="DD"
          placeholderTextColor={colors.inkLight}
          keyboardType="numeric"
          maxLength={2}
          style={styles.field}
        />
        <Text style={styles.separator}>/</Text>

        {/* Mes */}
        <TextInput
          value={month}
          onChangeText={(val) => {
            const clean = val.replace(/\D/g, '').slice(0, 2);
            setMonth(clean);
            updateParent(year, clean, day);
          }}
          placeholder="MM"
          placeholderTextColor={colors.inkLight}
          keyboardType="numeric"
          maxLength={2}
          style={styles.field}
        />
        <Text style={styles.separator}>/</Text>

        {/* Año */}
        <TextInput
          value={year}
          onChangeText={(val) => {
            const clean = val.replace(/\D/g, '').slice(0, 4);
            setYear(clean);
            updateParent(clean, month, day);
          }}
          placeholder="AAAA"
          placeholderTextColor={colors.inkLight}
          keyboardType="numeric"
          maxLength={4}
          style={[styles.field, styles.yearField]}
        />

        {value ? (
          <Text style={styles.previewDate} numberOfLines={1}>
            {dateLong(value)}
          </Text>
        ) : null}
      </View>

      {shortcuts && shortcuts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
        >
          {shortcuts.map((sc) => (
            <Pressable
              key={sc}
              onPress={() => handleShortcut(sc)}
              style={styles.shortcutChip}
            >
              <Text style={styles.shortcutText}>
                {sc === 'hoy'
                  ? 'Hoy'
                  : sc === 'ayer'
                  ? 'Ayer'
                  : sc === '+15d'
                  ? '+15 días (Quincena)'
                  : sc === '+30d'
                  ? '+30 días (Mes)'
                  : sc === '+7d'
                  ? '+7 días (Semana)'
                  : '+20 días'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing[3],
  },
  label: {
    ...type.captionBold,
    color: colors.inkSecondary,
    marginBottom: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  rowError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  icon: {
    marginRight: spacing[2],
  },
  field: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
    minWidth: 32,
    paddingVertical: spacing[2],
  },
  yearField: {
    minWidth: 54,
  },
  separator: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.inkLight,
    marginHorizontal: 2,
  },
  previewDate: {
    ...type.caption,
    color: colors.primaryDark,
    marginLeft: 'auto',
    backgroundColor: colors.primarySubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  shortcutChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2] + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  errorText: {
    ...type.micro,
    color: colors.danger,
    marginTop: 4,
  },
  helperText: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
