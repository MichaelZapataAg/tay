import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export interface TaySettings {
  ownerName: string;
  phone: string;
  defaultInterestRate: number;
  defaultFrequency: 'quincenal' | 'cada_20_dias' | 'mensual' | 'semanal' | 'personalizado_dias';
  defaultFrequencyDays: number;
  paymentAccounts: string;
  notificationHour: number; // 8 = 8:00 AM
  notificationMinute: number;
  enableNotifications: boolean;
}

export const DEFAULT_SETTINGS: TaySettings = {
  ownerName: 'Tay',
  phone: '',
  defaultInterestRate: 15,
  defaultFrequency: 'quincenal',
  defaultFrequencyDays: 15,
  paymentAccounts: 'Nequi / Bancolombia: [Tu número]',
  notificationHour: 8,
  notificationMinute: 0,
  enableNotifications: true,
};

const STORAGE_KEY = '@tay_settings_v1';

let currentSettings: TaySettings = { ...DEFAULT_SETTINGS };
let isLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function loadFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[settings] Error loading settings:', err);
  } finally {
    isLoaded = true;
    notify();
  }
}

// Inicia carga en background
void loadFromStorage();

export async function saveSettings(newSettings: Partial<TaySettings>): Promise<TaySettings> {
  currentSettings = { ...currentSettings, ...newSettings };
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch (err) {
    console.warn('[settings] Error saving settings:', err);
  }
  return currentSettings;
}

export function getSettingsSnapshot(): TaySettings {
  return currentSettings;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useSettings(): TaySettings & { isLoaded: boolean } {
  const settings = useSyncExternalStore(subscribe, getSettingsSnapshot);
  return { ...settings, isLoaded };
}
