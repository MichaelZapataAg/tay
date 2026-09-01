import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const PIN_STORAGE_KEY = '@tay:local_pin';
const DEFAULT_PIN = '0110';

let isUnlocked = false;
let currentPin = DEFAULT_PIN;
let isLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export async function initPin(): Promise<void> {
  try {
    const local = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (local) {
      currentPin = local;
    } else {
      currentPin = DEFAULT_PIN;
      await AsyncStorage.setItem(PIN_STORAGE_KEY, DEFAULT_PIN);
    }

    // Intentar sincronizar con Supabase
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'pin')
        .single();
      if (data && data.value) {
        currentPin = data.value;
        await AsyncStorage.setItem(PIN_STORAGE_KEY, data.value);
      }
    } catch {}
  } finally {
    isLoaded = true;
    notify();
  }
}

export function subscribePin(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIsUnlocked() {
  return isUnlocked;
}

export function getIsLoaded() {
  return isLoaded;
}

export async function checkAndUnlock(enteredPin: string): Promise<boolean> {
  if (enteredPin === currentPin) {
    isUnlocked = true;
    notify();
    return true;
  }
  return false;
}

export async function setPin(newPin: string): Promise<boolean> {
  try {
    currentPin = newPin;
    await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);

    // Guardar en Supabase
    try {
      await supabase.from('app_config').upsert({
        key: 'pin',
        value: newPin,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    notify();
    return true;
  } catch (err) {
    console.error('Error saving PIN:', err);
    return false;
  }
}

export function lockApp() {
  isUnlocked = false;
  notify();
}

export function usePinAuth() {
  const unlocked = useSyncExternalStore(subscribePin, getIsUnlocked);
  const loaded = useSyncExternalStore(subscribePin, getIsLoaded);
  return { isUnlocked: unlocked, isLoaded: loaded };
}
