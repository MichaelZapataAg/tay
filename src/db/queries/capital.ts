import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { capitalMovements, loans, payments, type CapitalMovement, type NewCapitalMovement } from '../schema';
import { newId } from '@/lib/id';

export interface CapitalMetrics {
  totalInjected: number; // Total dinero propio inyectado
  totalWithdrawnCapital: number; // Retiros de capital
  totalWithdrawnProfits: number; // Retiros de ganancias
  netCapitalBase: number; // totalInjected - totalWithdrawnCapital

  capitalInStreet: number; // Capital colocado activo actualmente en clientes
  capitalCollectedMonth: number; // Capital que retornó a la caja este mes
  interestEarnedMonth: number; // Utilidad / Intereses cobrados este mes (¡Plata de Tay!)

  totalInterestEarnedAllTime: number; // Ganancia histórica acumulada
  totalCapitalCollectedAllTime: number; // Capital total retornado histórico
}

export async function getCapitalMetrics(period?: string): Promise<CapitalMetrics> {
  const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

  const movements = await db.select().from(capitalMovements);
  const activeLoans = await db.select().from(loans).where(eq(loans.status, 'activo'));
  const allPayments = await db.select().from(payments);

  let totalInjected = 0;
  let totalWithdrawnCapital = 0;
  let totalWithdrawnProfits = 0;

  for (const m of movements) {
    if (m.type === 'inyeccion') totalInjected += m.amount;
    else if (m.type === 'retiro_capital') totalWithdrawnCapital += m.amount;
    else if (m.type === 'retiro_utilidad') totalWithdrawnProfits += m.amount;
  }

  const netCapitalBase = totalInjected - totalWithdrawnCapital;
  const capitalInStreet = activeLoans.reduce((sum, l) => sum + l.currentCapital, 0);

  let capitalCollectedMonth = 0;
  let interestEarnedMonth = 0;
  let totalInterestEarnedAllTime = 0;
  let totalCapitalCollectedAllTime = 0;

  for (const p of allPayments) {
    totalInterestEarnedAllTime += p.interestAmount;
    totalCapitalCollectedAllTime += p.capitalAmount;

    if (p.date.startsWith(currentPeriod)) {
      interestEarnedMonth += p.interestAmount;
      capitalCollectedMonth += p.capitalAmount;
    }
  }

  return {
    totalInjected,
    totalWithdrawnCapital,
    totalWithdrawnProfits,
    netCapitalBase,
    capitalInStreet,
    capitalCollectedMonth,
    interestEarnedMonth,
    totalInterestEarnedAllTime,
    totalCapitalCollectedAllTime,
  };
}

export async function getAllCapitalMovements(): Promise<CapitalMovement[]> {
  return db.select().from(capitalMovements).orderBy(desc(capitalMovements.date));
}

export async function createCapitalMovement(
  data: Omit<NewCapitalMovement, 'id' | 'createdAt'>,
) {
  const id = newId();
  const now = new Date().toISOString();
  const newRecord: NewCapitalMovement = {
    ...data,
    id,
    createdAt: now,
  };

  await db.insert(capitalMovements).values(newRecord);
  return newRecord;
}

export async function deleteCapitalMovement(id: string) {
  await db.delete(capitalMovements).where(eq(capitalMovements.id, id));
}
