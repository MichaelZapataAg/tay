/**
 * Generador de UUID v7 (ordenables por tiempo).
 * Formato estándar: 8-4-4-4-12 hex chars con guiones.
 */
export function newId(): string {
  const now = Date.now();

  // 48 bits de timestamp en milisegundos
  const timeHex = now.toString(16).padStart(12, '0');

  // Random bytes
  const bytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 10; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Version 7: bits 48-51 son 0111 (0x7)
  const b6 = 0x70 | (bytes[0] & 0x0f);
  // Variant RFC 4122: bits 64-65 son 10 (0x8, 0x9, 0xa, 0xb)
  const b8 = 0x80 | (bytes[1] & 0x3f);

  const hex = [
    timeHex.slice(0, 8),
    '-',
    timeHex.slice(8, 12),
    '-',
    b6.toString(16).padStart(2, '0') + bytes[2].toString(16).padStart(2, '0'),
    '-',
    b8.toString(16).padStart(2, '0') + bytes[3].toString(16).padStart(2, '0'),
    '-',
    Array.from(bytes.slice(4))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  ].join('');

  return hex;
}
