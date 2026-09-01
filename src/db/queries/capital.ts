import { Platform } from 'react-native';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { capitalMovements, loans, payments, type CapitalMovement, type NewCapitalMovement } from '../schema';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';

export interface CapitalMetrics {
  totalInjected: number;
  totalWithdrawnCapital: number;
  netCapitalBase: number;

  totalSpentFromCapital: number;
  totalRestoredCapital: number;
  pendingToRestore: number;

  capitalInStreet: number;
  capitalCollectedMonth: number;
  capitalInBox: number;

  interestEarnedMonth: number;
  totalInterestEarnedAllTime: number;
  totalWithdrawnProfits: number;
  availableProfits: number;

  totalCapitalCollectedAllTime: number;
}

export async function getCapitalMetrics(period?: string): Promise<CapitalMetrics> {
  const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

  if (Platform.OS === 'web') {
    const [mRes, lRes, pRes] = await Promise.all([
      supabase.from('capital_movements').select('*'),
      supabase.from('loans').select('*').eq('status', 'activo'),
      supabase.from('payments').select('*'),
    ]);

    const movements = mRes.data || [];
    const activeLoans = lRes.data || [];
    const allPayments = pRes.data || [];

    let totalInjected = 0;
    let totalWithdrawnCapital = 0;
    let totalWithdrawnProfits = 0;
    let totalSpentFromCapital = 0;
    let totalRestoredCapital = 0;

    for (const m of movements) {
      if (m.type === 'inyeccion') totalInjected += m.amount;
      else if (m.type === 'retiro_capital') totalWithdrawnCapital += m.amount;
      else if (m.type === 'retiro_utilidad') totalWithdrawnProfits += m.amount;
      else if (m.type === 'gasto_capital') totalSpentFromCapital += m.amount;
      else if (m.type === 'reposicion_capital') totalRestoredCapital += m.amount;
    }

    const netCapitalBase = Math.max(0, totalInjected - totalWithdrawnCapital);
    const pendingToRestore = Math.max(0, totalSpentFromCapital - totalRestoredCapital);
    const capitalInStreet = activeLoans.reduce((sum: number, l: any) => sum + (l.current_capital || 0), 0);

    let capitalCollectedMonth = 0;
    let interestEarnedMonth = 0;
    let totalInterestEarnedAllTime = 0;
    let totalCapitalCollectedAllTime = 0;

    for (const p of allPayments) {
      totalInterestEarnedAllTime += p.interest_amount || 0;
      totalCapitalCollectedAllTime += p.capital_amount || 0;

      if (p.date && p.date.startsWith(currentPeriod)) {
        interestEarnedMonth += p.interest_amount || 0;
        capitalCollectedMonth += p.capital_amount || 0;
      }
    }

    const availableProfits = Math.max(0, totalInterestEarnedAllTime - totalWithdrawnProfits);
    const capitalInBox = Math.max(0, netCapitalBase - capitalInStreet - pendingToRestore);

    return {
      totalInjected,
      totalWithdrawnCapital,
      netCapitalBase,
      totalSpentFromCapital,
      totalRestoredCapital,
      pendingToRestore,
      capitalInStreet,
      capitalCollectedMonth,
      capitalInBox,
      interestEarnedMonth,
      totalInterestEarnedAllTime,
      totalWithdrawnProfits,
      availableProfits,
      totalCapitalCollectedAllTime,
    };
  }

  const movements = await db.select().from(capitalMovements);
  const activeLoans = await db.select().from(loans).where(eq(loans.status, 'activo'));
  const allPayments = await db.select().from(payments);

  let totalInjected = 0;
  let totalWithdrawnCapital = 0;
  let totalWithdrawnProfits = 0;
  let totalSpentFromCapital = 0;
  let totalRestoredCapital = 0;

  for (const m of (movements as any[])) {
    if (m.type === 'inyeccion') totalInjected += m.amount;
    else if (m.type === 'retiro_capital') totalWithdrawnCapital += m.amount;
    else if (m.type === 'retiro_utilidad') totalWithdrawnProfits += m.amount;
    else if (m.type === 'gasto_capital') totalSpentFromCapital += m.amount;
    else if (m.type === 'reposicion_capital') totalRestoredCapital += m.amount;
  }

  const netCapitalBase = Math.max(0, totalInjected - totalWithdrawnCapital);
  const pendingToRestore = Math.max(0, totalSpentFromCapital - totalRestoredCapital);
  const capitalInStreet = (activeLoans as any[]).reduce((sum: number, l: any) => sum + l.currentCapital, 0);

  let capitalCollectedMonth = 0;
  let interestEarnedMonth = 0;
  let totalInterestEarnedAllTime = 0;
  let totalCapitalCollectedAllTime = 0;

  for (const p of (allPayments as any[])) {
    totalInterestEarnedAllTime += p.interestAmount;
    totalCapitalCollectedAllTime += p.capitalAmount;

    if (p.date.startsWith(currentPeriod)) {
      interestEarnedMonth += p.interestAmount;
      capitalCollectedMonth += p.capitalAmount;
    }
  }

  const availableProfits = Math.max(0, totalInterestEarnedAllTime - totalWithdrawnProfits);
  const capitalInBox = Math.max(0, netCapitalBase - capitalInStreet - pendingToRestore);

  return {
    totalInjected,
    totalWithdrawnCapital,
    netCapitalBase,
    totalSpentFromCapital,
    totalRestoredCapital,
    pendingToRestore,
    capitalInStreet,
    capitalCollectedMonth,
    capitalInBox,
    interestEarnedMonth,
    totalInterestEarnedAllTime,
    totalWithdrawnProfits,
    availableProfits,
    totalCapitalCollectedAllTime,
  };
}

export async function getAllCapitalMovements(): Promise<CapitalMovement[]> {
  if (Platform.OS === 'web') {
    const { data } = await supabase.from('capital_movements').select('*').order('date', { ascending: false });
    return (data || []).map((m: any) => ({
      id: m.id,
      type: m.type,
      amount: m.amount,
      date: m.date,
      notes: m.notes,
      createdAt: m.created_at,
    }));
  }

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

  if (Platform.OS === 'web') {
    await supabase.from('capital_movements').insert({
      id,
      type: data.type,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      created_at: now,
    });
    return newRecord;
  }

  await db.insert(capitalMovements).values(newRecord);
  return newRecord;
}

export async function deleteCapitalMovement(id: string) {
  if (Platform.OS === 'web') {
    await supabase.from('capital_movements').delete().eq('id', id);
    return;
  }
  await db.delete(capitalMovements).where(eq(capitalMovements.id, id));
}
