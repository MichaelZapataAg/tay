import { Platform } from 'react-native';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { loans, clients, payments, type Loan, type NewLoan } from '../schema';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';
import { scheduleLoanDueNotification, cancelLoanNotification } from '@/lib/notifications';

export interface LoanWithDetails extends Loan {
  clientPhone?: string | null;
  clientAlias?: string | null;
  interestAmountPerPeriod: number;
  dueStatus: 'today' | 'due' | 'upcoming';
  diffDays: number;
  totalPaidInterest: number;
  totalPaidCapital: number;
}

export async function getAllLoans(options?: {
  status?: string;
  dueFilter?: 'all' | 'today' | 'due' | 'upcoming';
  search?: string;
}): Promise<LoanWithDetails[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Platform.OS === 'web') {
    const [lRes, cRes, pRes] = await Promise.all([
      supabase.from('loans').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
      supabase.from('payments').select('*'),
    ]);

    const clientMap = new Map((cRes.data || []).map((c: any) => [c.id, c]));
    const allPayments = pRes.data || [];

    const result: LoanWithDetails[] = (lRes.data || []).map((row: any) => {
      const client = clientMap.get(row.client_id);
      const clientName = client?.name || 'Cliente';
      const loanPayments = allPayments.filter((p: any) => p.loan_id === row.id);
      const totalPaidInterest = loanPayments.reduce(
        (sum: number, p: any) => sum + (p.interest_amount || 0),
        0,
      );
      const totalPaidCapital = loanPayments.reduce(
        (sum: number, p: any) => sum + (p.capital_amount || 0),
        0,
      );

      const currentCapital = row.current_capital ?? row.initial_amount;
      const interestAmountPerPeriod = Math.round(
        (currentCapital * (row.interest_rate || 0)) / 100,
      );

      const targetDate = new Date(row.next_due_date);
      targetDate.setHours(0, 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let dueStatus: 'today' | 'due' | 'upcoming' = 'upcoming';
      if (diffDays === 0) dueStatus = 'today';
      else if (diffDays < 0) dueStatus = 'due';

      return {
        id: row.id,
        clientId: row.client_id,
        clientName,
        clientPhone: client?.phone,
        clientAlias: client?.alias,
        initialAmount: row.initial_amount,
        currentCapital,
        interestRate: row.interest_rate,
        paymentFrequency: row.payment_frequency,
        frequencyDays: row.frequency_days,
        loanType: 'solo_interes',
        startDate: row.start_date,
        nextDueDate: row.next_due_date,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        interestAmountPerPeriod,
        dueStatus,
        diffDays,
        totalPaidInterest,
        totalPaidCapital,
      };
    });

    let filtered = result;
    if (options?.status && options.status !== 'todos') {
      filtered = filtered.filter((l) => l.status === options.status);
    }
    if (options?.dueFilter && options.dueFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === 'activo' && l.dueStatus === options.dueFilter);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.clientName.toLowerCase().includes(q) ||
          (l.clientAlias && l.clientAlias.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }

  const allLoans = await db
    .select({
      loan: loans,
      client: clients,
    })
    .from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .orderBy(desc(loans.createdAt));

  const allPayments = await db.select().from(payments);

  const result: LoanWithDetails[] = (allLoans as any[]).map(({ loan, client }: any) => {
    const loanPayments = (allPayments as any[]).filter((p: any) => p.loanId === loan.id);
    const totalPaidInterest = loanPayments.reduce((sum: number, p: any) => sum + p.interestAmount, 0);
    const totalPaidCapital = loanPayments.reduce((sum: number, p: any) => sum + p.capitalAmount, 0);

    const interestAmountPerPeriod = Math.round((loan.currentCapital * loan.interestRate) / 100);

    const targetDate = new Date(loan.nextDueDate);
    targetDate.setHours(0, 0, 0, 0);
    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let dueStatus: 'today' | 'due' | 'upcoming' = 'upcoming';
    if (diffDays === 0) {
      dueStatus = 'today';
    } else if (diffDays < 0) {
      dueStatus = 'due';
    }

    return {
      ...loan,
      clientPhone: client?.phone,
      clientAlias: client?.alias,
      interestAmountPerPeriod,
      dueStatus,
      diffDays,
      totalPaidInterest,
      totalPaidCapital,
    };
  });

  let filtered = result;

  if (options?.status && options.status !== 'todos') {
    filtered = filtered.filter((l) => l.status === options.status);
  }

  if (options?.dueFilter && options.dueFilter !== 'all') {
    filtered = filtered.filter((l) => l.status === 'activo' && l.dueStatus === options.dueFilter);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.clientName.toLowerCase().includes(q) ||
        (l.clientAlias && l.clientAlias.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q)),
    );
  }

  return filtered;
}

export async function getLoanById(id: string) {
  if (Platform.OS === 'web') {
    const { data: loan } = await supabase.from('loans').select('*').eq('id', id).single();
    if (!loan) return null;
    const { data: client } = await supabase.from('clients').select('*').eq('id', loan.client_id).single();
    const { data: paymentsList } = await supabase.from('payments').select('*').eq('loan_id', id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(loan.next_due_date);
    targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let dueStatus: 'today' | 'due' | 'upcoming' = 'upcoming';
    if (diffDays === 0) dueStatus = 'today';
    else if (diffDays < 0) dueStatus = 'due';

    return {
      ...loan,
      client,
      payments: paymentsList || [],
      interestAmountPerPeriod: Math.round((loan.current_capital * loan.interest_rate) / 100),
      dueStatus,
      diffDays,
    };
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, id));
  if (!loan) return null;

  const [client] = await db.select().from(clients).where(eq(clients.id, loan.clientId));

  const loanPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.loanId, id))
    .orderBy(desc(payments.paidAt));

  const interestAmountPerPeriod = Math.round((loan.currentCapital * loan.interestRate) / 100);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(loan.nextDueDate);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let dueStatus: 'today' | 'due' | 'upcoming' = 'upcoming';
  if (diffDays === 0) dueStatus = 'today';
  else if (diffDays < 0) dueStatus = 'due';

  return {
    ...loan,
    client,
    payments: loanPayments,
    interestAmountPerPeriod,
    dueStatus,
    diffDays,
  };
}

export async function createLoan(
  data: Omit<NewLoan, 'id' | 'createdAt' | 'updatedAt' | 'currentCapital'> & {
    currentCapital?: number;
  },
) {
  const id = newId();
  const now = new Date().toISOString();
  const newRecord: NewLoan = {
    ...data,
    id,
    currentCapital: data.currentCapital ?? data.initialAmount,
    createdAt: now,
    updatedAt: now,
  };

  if (Platform.OS === 'web') {
    await supabase.from('loans').insert({
      id,
      client_id: data.clientId,
      initial_amount: data.initialAmount,
      current_capital: newRecord.currentCapital,
      interest_rate: data.interestRate,
      payment_frequency: data.paymentFrequency,
      frequency_days: data.frequencyDays,
      start_date: data.startDate,
      next_due_date: data.nextDueDate,
      notes: data.notes,
      status: 'activo',
      created_at: now,
      updated_at: now,
    });
    return newRecord;
  }

  await db.insert(loans).values(newRecord);

  // Programa notificación local
  const interest = Math.round((newRecord.initialAmount * newRecord.interestRate) / 100);
  void scheduleLoanDueNotification({
    loanId: id,
    clientName: newRecord.clientName,
    interestAmount: interest,
    dueDateIso: newRecord.nextDueDate,
  });

  return newRecord;
}

export async function updateLoan(
  id: string,
  data: Partial<Omit<NewLoan, 'id' | 'createdAt'>>,
) {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const updateObj: any = { updated_at: now };
    if (data.currentCapital !== undefined) updateObj.current_capital = data.currentCapital;
    if (data.interestRate !== undefined) updateObj.interest_rate = data.interestRate;
    if (data.paymentFrequency !== undefined) updateObj.payment_frequency = data.paymentFrequency;
    if (data.frequencyDays !== undefined) updateObj.frequency_days = data.frequencyDays;
    if (data.nextDueDate !== undefined) updateObj.next_due_date = data.nextDueDate;
    if (data.notes !== undefined) updateObj.notes = data.notes;
    if (data.status !== undefined) updateObj.status = data.status;

    await supabase.from('loans').update(updateObj).eq('id', id);
    return;
  }

  await db
    .update(loans)
    .set({ ...data, updatedAt: now })
    .where(eq(loans.id, id));

  // Si se actualizó la fecha de corte, re-programar notificación
  if (data.nextDueDate) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    if (loan && loan.status === 'activo') {
      const interest = Math.round((loan.currentCapital * loan.interestRate) / 100);
      void scheduleLoanDueNotification({
        loanId: id,
        clientName: loan.clientName,
        interestAmount: interest,
        dueDateIso: data.nextDueDate,
      });
    }
  }
}

export async function deleteLoan(id: string) {
  // Cancela notificación
  void cancelLoanNotification(id);

  if (Platform.OS === 'web') {
    await supabase.from('payments').delete().eq('loan_id', id);
    await supabase.from('loans').delete().eq('id', id);
    return;
  }

  // Elimina pagos asociados y préstamo en transacción
  await db.delete(payments).where(eq(payments.loanId, id));
  await db.delete(loans).where(eq(loans.id, id));
}
