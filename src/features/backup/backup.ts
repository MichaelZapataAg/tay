import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { clients, loans, payments, capitalMovements, expenses } from '@/db/schema';
import { toast } from '@/lib/toast';

export const BACKUP_VERSION = 1;

export interface TayBackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  data: {
    clients: (typeof clients.$inferSelect)[];
    loans: (typeof loans.$inferSelect)[];
    payments: (typeof payments.$inferSelect)[];
    capitalMovements: (typeof capitalMovements.$inferSelect)[];
    expenses: (typeof expenses.$inferSelect)[];
  };
}

export async function buildBackup(): Promise<TayBackupPayload> {
  const [allClients, allLoans, allPayments, allCapitalMovements, allExpenses] =
    await Promise.all([
      db.select().from(clients),
      db.select().from(loans),
      db.select().from(payments),
      db.select().from(capitalMovements),
      db.select().from(expenses),
    ]);

  return {
    version: BACKUP_VERSION,
    appName: 'Tay Préstamos',
    exportedAt: new Date().toISOString(),
    data: {
      clients: allClients,
      loans: allLoans,
      payments: allPayments,
      capitalMovements: allCapitalMovements,
      expenses: allExpenses,
    },
  };
}

export async function exportAndShareBackup(): Promise<void> {
  try {
    const backup = await buildBackup();
    const json = JSON.stringify(backup, null, 2);
    const filename = `respaldo-tay-${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Respaldo descargado', 'Se descargó el archivo JSON en tu navegador.');
      return;
    }

    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar respaldo de Tay Préstamos',
        UTI: 'public.json',
      });
      toast.success('Respaldo listo', 'Se generó el archivo de respaldo exitosamente.');
    } else {
      toast.info('Respaldo guardado', `Guardado en: ${file.uri}`);
    }
  } catch (err) {
    console.error('[backup] Error exporting backup:', err);
    toast.error('Error al exportar respaldo', err instanceof Error ? err.message : '');
  }
}

const CHUNK = 40;

async function insertChunked<T extends object>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    if (chunk.length > 0) await db.insert(table).values(chunk as never);
  }
}

export async function restoreBackup(jsonContent: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonContent) as TayBackupPayload;

    if (!parsed || !parsed.data) {
      throw new Error('El archivo no tiene el formato válido de respaldo de Tay Préstamos.');
    }

    const {
      clients: cList,
      loans: lList,
      payments: pList,
      capitalMovements: cmList,
      expenses: eList,
    } = parsed.data;

    // Desactivar foreign keys temporalmente
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    try {
      await db.delete(payments);
      await db.delete(loans);
      await db.delete(clients);
      await db.delete(capitalMovements);
      await db.delete(expenses);

      if (cList?.length) await insertChunked(clients, cList);
      if (lList?.length) await insertChunked(loans, lList);
      if (pList?.length) await insertChunked(payments, pList);
      if (cmList?.length) await insertChunked(capitalMovements, cmList);
      if (eList?.length) await insertChunked(expenses, eList);
    } finally {
      await db.run(sql`PRAGMA foreign_keys = ON;`);
    }

    toast.success('Respaldo restaurado', 'Todos tus datos fueron restaurados correctamente.');
    return true;
  } catch (err) {
    console.error('[backup] Error restoring backup:', err);
    toast.error(
      'Error al restaurar respaldo',
      err instanceof Error ? err.message : 'Archivo no válido',
    );
    return false;
  }
}
