import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { Sparkles, Delete, ShieldCheck } from 'lucide-react-native';
import { checkAndUnlock } from './pinStore';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export function PinLockScreen() {
  const [pin, setPinState] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-verificar cuando se escriben 4 dígitos
  useEffect(() => {
    if (pin.length === 4) {
      handleVerify(pin);
    }
  }, [pin]);

  const handlePressDigit = (digit: string) => {
    if (pin.length >= 4) return;
    haptic.selection();
    setErrorMsg('');
    setPinState((prev) => prev + digit);
  };

  const handleDeleteDigit = () => {
    if (pin.length === 0) return;
    haptic.selection();
    setErrorMsg('');
    setPinState((prev) => prev.slice(0, -1));
  };

  const handleVerify = async (code: string) => {
    const success = await checkAndUnlock(code);
    if (success) {
      haptic.success();
    } else {
      haptic.error();
      setErrorMsg('PIN incorrecto. Intenta de nuevo.');
      setPinState('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Sparkles size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>Hola Tay ✨</Text>
        <Text style={styles.subtitle}>Ingresa tu PIN de seguridad para acceder</Text>
      </View>

      {/* PIN Indicators */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                !!errorMsg && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {/* Error Message */}
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((d) => (
            <KeypadButton key={d} digit={d} onPress={() => handlePressDigit(d)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((d) => (
            <KeypadButton key={d} digit={d} onPress={() => handlePressDigit(d)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((d) => (
            <KeypadButton key={d} digit={d} onPress={() => handlePressDigit(d)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={styles.emptyKey} />
          <KeypadButton digit="0" onPress={() => handlePressDigit('0')} />
          <Pressable onPress={handleDeleteDigit} style={styles.deleteButton}>
            <Delete size={26} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      {/* Footer Security Badge */}
      <View style={styles.securityBadge}>
        <ShieldCheck size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
        <Text style={styles.securityText}>Acceso 100% privado y protegido</Text>
      </View>
    </SafeAreaView>
  );
}

function KeypadButton({ digit, onPress }: { digit: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.keyButton,
        pressed && styles.keyButtonPressed,
      ]}
    >
      <Text style={styles.keyText}>{digit}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[8],
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginTop: spacing[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  title: {
    ...type.hero,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...type.bodyMedium,
    color: colors.inkMuted,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing[4],
    marginVertical: spacing[4],
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: '#FFFFFF',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.15 }],
  },
  dotError: {
    borderColor: colors.due,
    backgroundColor: colors.dueSoft,
  },
  errorText: {
    ...type.captionBold,
    color: colors.due,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  keyButtonPressed: {
    backgroundColor: colors.primarySoft,
    transform: [{ scale: 0.94 }],
  },
  keyText: {
    fontFamily: fonts.titleBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
  },
  emptyKey: {
    width: 72,
    height: 72,
  },
  deleteButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  securityText: {
    ...type.micro,
    color: colors.primaryDark,
  },
});
