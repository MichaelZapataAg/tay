import { Platform } from 'react-native';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { clients, loans, payments, type Client, type NewClient } from '../schema';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';

export interface ClientWithDebt extends Client {
  activeLoansCount: number;
  totalCurrentCapital: number;
  totalInterestDueSoon: number;
  hasOverdueLoan: boolean;
  hasTodayLoan: boolean;
}

export async function getAllClients(search?: string): Promise<ClientWithDebt[]> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    const [cRes, lRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('loans').select('*').eq('status', 'activo'),
    ]);

    const rawClients = (cRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      alias: c.alias,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      active: Boolean(c.active ?? 1),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    const activeLoans = lRes.data || [];

    const result: ClientWithDebt[] = rawClients.map((client: any) => {
      const clientLoans = activeLoans.filter((l: any) => l.client_id === client.id);
      const activeLoansCount = clientLoans.length;
      const totalCurrentCapital = clientLoans.reduce(
        (sum: number, l: any) => sum + (l.current_capital || 0),
        0,
      );

      let totalInterestDueSoon = 0;
      let hasOverdueLoan = false;
      let hasTodayLoan = false;

      for (const l of clientLoans) {
        const interestForPeriod = Math.round(
          ((l.current_capital || 0) * (l.interest_rate || 0)) / 100,
        );
        totalInterestDueSoon += interestForPeriod;

        if (l.next_due_date < todayStr) {
          hasOverdueLoan = true;
        } else if (l.next_due_date === todayStr) {
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

    if (!search || !search.trim()) return result;
    const query = search.trim().toLowerCase();
    return result.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.alias && c.alias.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)),
    );
  }

  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  const activeLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.status, 'activo'));

  const result: ClientWithDebt[] = (allClients as any[]).map((client: any) => {
    const clientLoans = (activeLoans as any[]).filter((l: any) => l.clientId === client.id);
    const activeLoansCount = clientLoans.length;
    const totalCurrentCapital = clientLoans.reduce((sum: number, l: any) => sum + l.currentCapital, 0);

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
  if (Platform.OS === 'web') {
    const [cRes, lRes, pRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('loans').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);

    if (!cRes.data) return null;

    const client = {
      id: cRes.data.id,
      name: cRes.data.name,
      alias: cRes.data.alias,
      phone: cRes.data.phone,
      address: cRes.data.address,
      notes: cRes.data.notes,
      active: Boolean(cRes.data.active ?? 1),
      createdAt: cRes.data.created_at,
      updatedAt: cRes.data.updated_at,
    };

    const clientLoans = (lRes.data || []).map((l: any) => ({
      id: l.id,
      clientId: l.client_id,
      clientName: client.name,
      initialAmount: l.initial_amount,
      currentCapital: l.current_capital,
      interestRate: l.interest_rate,
      paymentFrequency: l.payment_frequency,
      frequencyDays: l.frequency_days,
      loanType: 'solo_interes',
      startDate: l.start_date,
      nextDueDate: l.next_due_date,
      notes: l.notes,
      status: l.status,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    const clientPayments = (pRes.data || []).map((p: any) => ({
      id: p.id,
      loanId: p.loan_id,
      clientId: p.client_id,
      paidAt: p.created_at,
      date: p.date,
      interestAmount: p.interest_amount,
      capitalAmount: p.capital_amount,
      totalAmount: p.total_amount,
      paymentMethod: p.payment_method,
      receiptPhotoUri: p.receipt_photo_uri,
      notes: p.notes,
      createdAt: p.created_at,
    }));

    return { client, loans: clientLoans, payments: clientPayments };
  }

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

  if (Platform.OS === 'web') {
    await supabase.from('clients').insert({
      id,
      name: data.name,
      alias: data.alias,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      active: data.active ? 1 : 0,
      created_at: now,
      updated_at: now,
    });
    return newRecord;
  }

  await db.insert(clients).values(newRecord);
  return newRecord;
}

export async function updateClient(
  id: string,
  data: Partial<Omit<NewClient, 'id' | 'createdAt'>>,
) {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    await supabase
      .from('clients')
      .update({
        name: data.name,
        alias: data.alias,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        active: data.active ? 1 : 0,
        updated_at: now,
      })
      .eq('id', id);
    return;
  }

  await db
    .update(clients)
    .set({ ...data, updatedAt: now })
    .where(eq(clients.id, id));
}

export async function deleteClient(id: string) {
  if (Platform.OS === 'web') {
    const { count } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id);

    if (count && count > 0) {
      await supabase.from('clients').update({ active: 0 }).eq('id', id);
      return { deactivated: true };
    }

    await supabase.from('clients').delete().eq('id', id);
    return { deleted: true };
  }

  const countLoans = (
    await db.all(sql`SELECT count(*) as count FROM loans WHERE client_id = ${id};`)
  ) as { count: number }[];

  if (countLoans[0]?.count > 0) {
    await db.update(clients).set({ active: false }).where(eq(clients.id, id));
    return { deactivated: true };
  }

  await db.delete(clients).where(eq(clients.id, id));
  return { deleted: true };
}
