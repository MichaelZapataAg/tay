import { Directory, File, Paths } from 'expo-file-system';
import { toast } from './toast';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require('expo-image-picker');
} catch {
  ImagePicker = null;
}

export const photosAvailable = ImagePicker !== null;

export const PHOTO_DIRS = {
  comprobantes: 'comprobantes',
} as const;

export type PhotoDir = (typeof PHOTO_DIRS)[keyof typeof PHOTO_DIRS];

function directory(dir: PhotoDir): Directory {
  const d = new Directory(Paths.document, dir);
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

function uniqueName(name: string): string {
  return `${name}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function pickPaymentReceiptPhoto(): Promise<string | null> {
  if (!ImagePicker) {
    toast.error('Módulo de fotos no disponible');
    return null;
  }

  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permiso denegado', 'Se necesita acceso a la galería para adjuntar comprobantes.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });

    if (result.canceled || !result.assets[0]?.uri) return null;

    const sourceUri = result.assets[0].uri;
    const source = new File(sourceUri);
    const target = new File(
      directory('comprobantes'),
      `${uniqueName('comprobante')}${source.extension || '.jpg'}`,
    );
    source.copy(target);
    return target.uri;
  } catch (err) {
    console.warn('[photos] Error picking photo:', err);
    toast.error('Error al guardar comprobante');
    return null;
  }
}
