import React from 'react';
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
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export interface MoneyInputProps {
  label?: string;
  value: number; // Integer COP
  onChangeValue: (value: number) => void;
  error?: string | null;
  helperText?: string | null;
  presets?: number[]; // ej. [100000, 500000, 1000000, 2000000]
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
}

export function MoneyInput({
  label,
  value,
  onChangeValue,
  error,
  helperText,
  presets = [100_000, 500_000, 1_000_000, 2_000_000],
  containerStyle,
  editable = true,
}: MoneyInputProps) {
  const displayValue = value ? value.toLocaleString('es-CO') : '';

  const handleChangeText = (text: string) => {
    const rawNumber = text.replace(/\D/g, '');
    const num = rawNumber ? parseInt(rawNumber, 10) : 0;
    onChangeValue(num);
  };

  const handleAddPreset = (amount: number) => {
    haptic.selection();
    onChangeValue((value || 0) + amount);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputBox, error ? styles.inputError : null]}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.inkLight}
          editable={editable}
          style={styles.textInput}
        />
        {value > 0 && editable ? (
          <Pressable
            onPress={() => {
              haptic.light();
              onChangeValue(0);
            }}
            hitSlop={8}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {editable && presets.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsRow}
        >
          {presets.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => handleAddPreset(preset)}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>+{money(preset)}</Text>
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  currencySymbol: {
    fontFamily: fonts.titleBold,
    fontSize: 22,
    color: colors.primary,
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.titleBold,
    fontSize: 22,
    color: colors.ink,
    paddingVertical: spacing[2],
  },
  clearButton: {
    padding: spacing[1],
  },
  clearText: {
    fontSize: 16,
    color: colors.inkMuted,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  presetChip: {
    backgroundColor: colors.primarySubtle,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2] + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  presetChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
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
