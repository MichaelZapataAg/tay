import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react-native';
import { colors } from './colors';
import { radii, spacing, type, shadows } from './theme';
import { haptic } from './haptics';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

let activeToast: ToastMessage | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const toast = {
  show: (type: ToastType, title: string, description?: string, durationMs = 3500) => {
    const id = Date.now().toString();
    activeToast = { id, type, title, description, durationMs };
    if (type === 'success') haptic.success();
    if (type === 'warning') haptic.warning();
    if (type === 'error') haptic.error();
    notify();
  },
  success: (title: string, description?: string) => toast.show('success', title, description),
  warning: (title: string, description?: string) => toast.show('warning', title, description),
  error: (title: string, description?: string) => toast.show('error', title, description),
  info: (title: string, description?: string) => toast.show('info', title, description),
  dismiss: () => {
    activeToast = null;
    notify();
  },
};

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return activeToast;
}

export function Toaster() {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      toast.dismiss();
    }, current.durationMs ?? 3500);
    return () => clearTimeout(timer);
  }, [current]);

  if (!current) return null;

  const IconComponent =
    current.type === 'success'
      ? CheckCircle2
      : current.type === 'warning'
      ? AlertTriangle
      : current.type === 'error'
      ? XCircle
      : Info;

  const iconColor =
    current.type === 'success'
      ? colors.success
      : current.type === 'warning'
      ? colors.today
      : current.type === 'error'
      ? colors.danger
      : colors.primary;

  const bgStyle =
    current.type === 'success'
      ? styles.successBg
      : current.type === 'warning'
      ? styles.warningBg
      : current.type === 'error'
      ? styles.errorBg
      : styles.infoBg;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing[2] }]}
    >
      <Animated.View
        entering={FadeInUp.springify().damping(18)}
        exiting={FadeOutUp.duration(200)}
        style={[styles.toast, bgStyle]}
      >
        <IconComponent size={22} color={iconColor} style={styles.icon} />
        <View style={styles.content}>
          <Text style={styles.title}>{current.title}</Text>
          {current.description ? (
            <Text style={styles.description}>{current.description}</Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 99999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  successBg: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.successSoft,
  },
  warningBg: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.todayBorder,
  },
  errorBg: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.dueBorder,
  },
  infoBg: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  icon: {
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    ...type.bodyBold,
    color: colors.ink,
  },
  description: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
