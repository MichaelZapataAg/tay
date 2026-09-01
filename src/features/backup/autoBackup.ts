import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildBackup } from './backup';

const LAST_AUTO_BACKUP_KEY = '@tay:lastAutoBackupAt';
const CARPETA = 'respaldos';
const MAX_BACKUP_COPIES = 7;

function carpeta(): Directory | null {
  if (Platform.OS === 'web') return null;
  try {
    const d = new Directory(Paths.document, CARPETA);
    if (!d.exists) d.create({ intermediates: true });
    return d;
  } catch {
    return null;
  }
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function respaldarSiHaceFalta(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const hoy = hoyIso();
    if ((await AsyncStorage.getItem(LAST_AUTO_BACKUP_KEY)) === hoy) return null;

    const dir = carpeta();
    if (!dir) return null;

    const datos = await buildBackup();
    if (datos.data.clients.length === 0 && datos.data.loans.length === 0) {
      return null;
    }

    const archivo = new File(dir, `respaldo-${hoy}.json`);
    if (archivo.exists) archivo.delete();
    archivo.create();
    archivo.write(JSON.stringify(datos));

    await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, hoy);
    limpiarViejos();
    return archivo.uri;
  } catch (err) {
    console.warn('[autoBackup] Error en auto-respaldo:', err);
    return null;
  }
}

function limpiarViejos(): void {
  if (Platform.OS === 'web') return;
  try {
    const dir = carpeta();
    if (!dir) return;
    const archivos = dir
      .list()
      .filter((f) => f.name.startsWith('respaldo-'))
      .sort((a, b) => b.name.localeCompare(a.name));
    for (const viejo of archivos.slice(MAX_BACKUP_COPIES)) {
      viejo.delete();
    }
  } catch {}
}

export type CopiaLocal = { nombre: string; uri: string; fecha: string; tamano: number };

export function copiasLocales(): CopiaLocal[] {
  if (Platform.OS === 'web') return [];
  try {
    const dir = carpeta();
    if (!dir) return [];
    return dir
      .list()
      .filter((f) => f.name.startsWith('respaldo-') && f instanceof File)
      .map((f) => ({
        nombre: f.name,
        uri: f.uri,
        fecha: f.name.replace('respaldo-', '').replace('.json', ''),
        tamano: (f as File).size ?? 0,
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  } catch {
    return [];
  }
}
