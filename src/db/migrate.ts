import { useEffect, useState } from 'react';
import { sql } from 'drizzle-orm';
import migrations from './migrations/migrations';
import { db, expoDb } from './client';

declare global {
  // eslint-disable-next-line no-var
  var __tayBootstrap:
    | { migrationsApplied: boolean; walEnabled: boolean; seeded: boolean }
    | undefined;
}

function getBootstrapState() {
  if (!globalThis.__tayBootstrap) {
    globalThis.__tayBootstrap = {
      migrationsApplied: false,
      walEnabled: false,
      seeded: false,
    };
  }
  return globalThis.__tayBootstrap;
}

async function ensureColumn(tableName: string, columnName: string, definition: string) {
  try {
    const tableInfo = (await db.all(sql.raw(`PRAGMA table_info(\`${tableName}\`);`))) as {
      name: string;
    }[];
    const columnExists = tableInfo.some((col) => col.name === columnName);
    if (!columnExists) {
      await db.run(sql.raw(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition};`));
    }
  } catch (err) {
    console.warn(`[db] ensureColumn ${columnName} on ${tableName}:`, err);
  }
}

/**
 * Migrator manual con guard global resistente a HMR.
 */
async function runMigrations() {
  const state = getBootstrapState();
  if (state.migrationsApplied) return;

  await db.run(
    sql`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    );`,
  );

  const journal = migrations.journal as { entries: { idx: number; tag: string }[] };
  const sqlMap = migrations.migrations as Record<string, string>;

  const appliedRows = (await db.all(
    sql`SELECT hash FROM __drizzle_migrations ORDER BY id ASC;`,
  )) as { hash: string }[];
  const appliedHashes = new Set(appliedRows.map((r) => r.hash));

  for (const entry of journal.entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}`;
    const sqlText = sqlMap[key];
    if (!sqlText) throw new Error(`Migration ${key} sin SQL en bundle.`);
    if (appliedHashes.has(entry.tag)) continue;

    const statements = sqlText
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.replace(/--[^\n]*/g, '').trim().length > 0);

    for (const stmt of statements) {
      const alterMatch = stmt.match(
        /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?\s+(.*)/i,
      );
      if (alterMatch) {
        const [, tableName, columnName, colDef] = alterMatch;
        await ensureColumn(tableName, columnName, colDef);
      } else {
        try {
          await db.run(sql.raw(stmt));
        } catch (err: any) {
          if (
            err?.message?.includes('already exists') ||
            err?.message?.includes('duplicate')
          ) {
            continue;
          }
          throw err;
        }
      }
    }

    try {
      await db.run(
        sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${entry.tag}, ${Date.now()});`,
      );
    } catch {}
  }

  state.migrationsApplied = true;
}

export async function enableWalMode() {
  const state = getBootstrapState();
  if (state.walEnabled) return;
  const rows = (await db.all(sql`PRAGMA journal_mode;`)) as { journal_mode: string }[];
  const mode = rows[0]?.journal_mode;
  if (mode !== 'wal') {
    console.warn(
      `[db] journal_mode esperado "wal" pero es "${mode}". Las escrituras pueden no persistir.`,
    );
  }
  state.walEnabled = true;
}

export function getBootstrap() {
  return getBootstrapState();
}

export type MigrationStatus = { success: boolean; error: Error | null };

export function useDbMigrations(): MigrationStatus {
  const [status, setStatus] = useState<MigrationStatus>(() => ({
    success: getBootstrapState().migrationsApplied,
    error: null,
  }));

  useEffect(() => {
    if (status.success) return;
    let cancelled = false;
    runMigrations()
      .then(() => {
        if (!cancelled) setStatus({ success: true, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setStatus({
            success: false,
            error: e instanceof Error ? e : new Error(String(e)),
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
