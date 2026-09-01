import { Platform } from 'react-native';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'tay.db';

declare global {
  // eslint-disable-next-line no-var
  var __tayExpoDb: SQLiteDatabase | undefined;
}

function getExpoDb(): SQLiteDatabase {
  if (!globalThis.__tayExpoDb) {
    const sqliteDb = openDatabaseSync(DB_NAME, { enableChangeListener: true });
    if (Platform.OS !== 'web') {
      try {
        sqliteDb.execSync('PRAGMA journal_mode = WAL;');
        sqliteDb.execSync('PRAGMA foreign_keys = ON;');
        sqliteDb.execSync('PRAGMA synchronous = NORMAL;');
      } catch (err) {
        console.warn('[db] Error running PRAGMAs:', err);
      }
    }
    globalThis.__tayExpoDb = sqliteDb;
  }
  return globalThis.__tayExpoDb;
}

export const expoDb = getExpoDb();
export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
