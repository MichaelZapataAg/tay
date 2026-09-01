import { desc, eq, sql, like, and, or } from 'drizzle-orm';
import { db } from '../client';
import { clients, loans, payments, type Client, type NewClient } from '../schema';
import { newId } from '@/lib/id';

export interface ClientWithDebt extends Client {
  activeLoansCount: number;
  totalCurrentCapital: number;
  totalInterestDueSoon: number;
  hasOverdueLoan: boolean;
  hasTodayLoan: boolean;
}

export async function getAllClients(search?: string): Promise<ClientWithDebt[]> {
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  // Traer préstamos activos para calcular deuda
  const activeLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.status, 'activo'));

  const todayStr = new Date().toISOString().split('T')[0];

  const result: ClientWithDebt[] = allClients.map((client) => {
    const clientLoans = activeLoans.filter((l) => l.clientId === client.id);
    const activeLoansCount = clientLoans.length;
    const totalCurrentCapital = clientLoans.reduce((sum, l) => sum + l.currentCapital, 0);

    let totalInterestDueSoon = 0;
    let hasOverdueLoan = false;
    let hasTodayLoan = false;

    for (const l of clientLoans) {
      const interestForPeriod = Math.round((l.currentCapital * l.interestRate) / 100);
      totalInterestDueSoon += interestForPeriod;

      if (l.nextDueDate < todayStr) {
        hasOverdueLoan = true;
      } else if (l.nextDueDate === todayStr) {
        hasTodayLoan = true;
      }
    }

    return {
      ...client,
      activeLoansCount,
      totalCurrentCapital,
      totalInterestDueSoon,
      hasOverdueLoan,
      hasTodayLoan,
    };
  });

  if (!search || !search.trim()) {
    return result;
  }

  const query = search.trim().toLowerCase();
  return result.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.alias && c.alias.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)),
  );
}

export async function getClientById(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) return null;

  const clientLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.clientId, id))
    .orderBy(desc(loans.createdAt));

  const clientPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.clientId, id))
    .orderBy(desc(payments.paidAt));

  return {
    client,
    loans: clientLoans,
    payments: clientPayments,
  };
}

export async function createClient(data: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = newId();
  const now = new Date().toISOString();
  const newRecord: NewClient = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(clients).values(newRecord);
  return newRecord;
}

export async function updateClient(
  id: string,
  data: Partial<Omit<NewClient, 'id' | 'createdAt'>>,
) {
  const now = new Date().toISOString();
  await db
    .update(clients)
    .set({ ...data, updatedAt: now })
    .where(eq(clients.id, id));
}

export async function deleteClient(id: string) {
  // Solo se puede eliminar si no tiene préstamos registrados
  const countLoans = (
    await db.all(sql`SELECT count(*) as count FROM loans WHERE client_id = ${id};`)
  ) as { count: number }[];

  if (countLoans[0]?.count > 0) {
    // Si tiene historial, solo desactivar
    await db.update(clients).set({ active: false }).where(eq(clients.id, id));
    return { deactivated: true };
  }

  await db.delete(clients).where(eq(clients.id, id));
  return { deleted: true };
}
