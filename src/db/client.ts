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
  if (Platform.OS === 'web') {
    // Mock SQLite DB en web para evitar que expo-sqlite intente invocar SharedArrayBuffer sincrónico
    return {
      execSync: () => {},
      runSync: () => ({ lastInsertRowId: 0, changes: 0 }),
      getFirstSync: () => null,
      getAllSync: () => [],
      eachSync: () => {},
      prepareSync: () => ({} as any),
      closeSync: () => {},
      isInTransactionSync: () => false,
      withTransactionSync: (cb: any) => cb(),
      all: async () => [],
      run: async () => ({ lastInsertRowId: 0, changes: 0 }),
    } as unknown as SQLiteDatabase;
  }

  if (!globalThis.__tayExpoDb) {
    const sqliteDb = openDatabaseSync(DB_NAME, { enableChangeListener: true });
    try {
      sqliteDb.execSync('PRAGMA journal_mode = WAL;');
      sqliteDb.execSync('PRAGMA foreign_keys = ON;');
      sqliteDb.execSync('PRAGMA synchronous = NORMAL;');
    } catch (err) {
      console.warn('[db] Error running PRAGMAs:', err);
    }
    globalThis.__tayExpoDb = sqliteDb;
  }
  return globalThis.__tayExpoDb;
}

export const expoDb = getExpoDb();
export const db =
  Platform.OS === 'web'
    ? ({
        select: () => ({
          from: () => ({
            where: () => ({ orderBy: () => Promise.resolve([]) }),
            orderBy: () => Promise.resolve([]),
            leftJoin: () => ({ orderBy: () => Promise.resolve([]) }),
          }),
        }),
        insert: () => ({ values: () => Promise.resolve() }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
        delete: () => ({ where: () => Promise.resolve() }),
        all: () => Promise.resolve([]),
        run: () => Promise.resolve(),
      } as any)
    : drizzle(expoDb, { schema });

export type Database = ReturnType<typeof drizzle<typeof schema>>;
