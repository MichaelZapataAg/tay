import { Platform } from 'react-native';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { payments, loans, clients, type Payment, type NewPayment } from '../schema';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';
import { scheduleLoanDueNotification, cancelLoanNotification } from '@/lib/notifications';

export interface PaymentWithDetails extends Payment {
  clientName: string;
  clientAlias?: string | null;
  clientPhone?: string | null;
}

export async function getAllPayments(options?: {
  loanId?: string;
  clientId?: string;
  period?: string; // YYYY-MM
}): Promise<PaymentWithDetails[]> {
  if (Platform.OS === 'web') {
    const [pRes, cRes] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
    ]);

    const clientMap = new Map((cRes.data || []).map((c: any) => [c.id, c]));

    let result: PaymentWithDetails[] = (pRes.data || []).map((row: any) => {
      const client = clientMap.get(row.client_id);
      return {
        id: row.id,
        loanId: row.loan_id,
        clientId: row.client_id,
        paidAt: row.created_at,
        date: row.date,
        periodCovered: row.notes,
        interestAmount: row.interest_amount,
        capitalAmount: row.capital_amount ?? 0,
        totalAmount: row.total_amount,
        paymentMethod: row.payment_method || 'efectivo',
        receiptPhotoUri: row.receipt_photo_uri,
        notes: row.notes,
        createdAt: row.created_at,
        clientName: client?.name || 'Cliente',
        clientAlias: client?.alias,
        clientPhone: client?.phone,
      };
    });

    if (options?.loanId) result = result.filter((p) => p.loanId === options.loanId);
    if (options?.clientId) result = result.filter((p) => p.clientId === options.clientId);
    if (options?.period) result = result.filter((p) => p.date.startsWith(options.period!));
    return result;
  }

  const query = db
    .select({
      payment: payments,
      client: clients,
    })
    .from(payments)
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .orderBy(desc(payments.paidAt));

  const all = await query;

  let result: PaymentWithDetails[] = (all as any[]).map(({ payment, client }: any) => ({
    ...payment,
    clientName: client?.name || 'Cliente',
    clientAlias: client?.alias,
    clientPhone: client?.phone,
  }));

  if (options?.loanId) {
    result = result.filter((p) => p.loanId === options.loanId);
  }

  if (options?.clientId) {
    result = result.filter((p) => p.clientId === options.clientId);
  }

  if (options?.period) {
    result = result.filter((p) => p.date.startsWith(options.period!));
  }

  return result;
}

export function calculateNextDueDate(currentDueDateStr: string, frequencyDays: number): string {
  const [y, m, d] = currentDueDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + (frequencyDays || 15));

  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

export async function recordPayment(params: {
  loanId: string;
  clientId: string;
  interestAmount: number;
  capitalAmount: number;
  paymentMethod: string;
  periodCovered?: string;
  receiptPhotoUri?: string | null;
  notes?: string;
  nextDueDateOverride?: string;
  customPaidDate?: string;
}) {
  const now = new Date();
  const paidAt = now.toISOString();
  const dateStr = params.customPaidDate || paidAt.split('T')[0];
  const totalAmount = (params.interestAmount || 0) + (params.capitalAmount || 0);
  const paymentId = newId();

  if (Platform.OS === 'web') {
    const { data: loan } = await supabase.from('loans').select('*').eq('id', params.loanId).single();
    if (!loan) throw new Error('Préstamo no encontrado');

    const newPayment: any = {
      id: paymentId,
      loan_id: params.loanId,
      client_id: params.clientId,
      date: dateStr,
      interest_amount: params.interestAmount || 0,
      capital_amount: params.capitalAmount || 0,
      total_amount: totalAmount,
      payment_method: params.paymentMethod || 'efectivo',
      receipt_photo_uri: params.receiptPhotoUri || null,
      notes: params.notes || null,
      created_at: paidAt,
      updated_at: paidAt,
    };

    await supabase.from('payments').insert(newPayment);

    const currentCapital = loan.current_capital ?? loan.initial_amount;
    const newCapital = Math.max(0, currentCapital - (params.capitalAmount || 0));
    const isFullyPaid = newCapital === 0;
    const nextDueDate =
      params.nextDueDateOverride ||
      calculateNextDueDate(loan.next_due_date, loan.frequency_days || 15);

    await supabase
      .from('loans')
      .update({
        current_capital: newCapital,
        next_due_date: isFullyPaid ? loan.next_due_date : nextDueDate,
        status: isFullyPaid ? 'pagado' : 'activo',
        updated_at: paidAt,
      })
      .eq('id', loan.id);

    return { payment: newPayment, newCapital, isFullyPaid, nextDueDate };
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, params.loanId));
  if (!loan) throw new Error('Préstamo no encontrado');

  const newPayment: NewPayment = {
    id: paymentId,
    loanId: params.loanId,
    clientId: params.clientId,
    paidAt,
    date: dateStr,
    periodCovered: params.periodCovered || `Corte ${loan.nextDueDate}`,
    interestAmount: params.interestAmount || 0,
    capitalAmount: params.capitalAmount || 0,
    totalAmount,
    paymentMethod: params.paymentMethod || 'efectivo',
    receiptPhotoUri: params.receiptPhotoUri || null,
    notes: params.notes || null,
    createdAt: paidAt,
  };

  await db.insert(payments).values(newPayment);

  // Actualiza saldo de capital y próxima fecha de corte en el préstamo
  const newCapital = Math.max(0, loan.currentCapital - (params.capitalAmount || 0));
  const isFullyPaid = newCapital === 0;

  const nextDueDate =
    params.nextDueDateOverride ||
    calculateNextDueDate(loan.nextDueDate, loan.frequencyDays || 15);

  const updatedStatus = isFullyPaid ? 'pagado' : 'activo';

  await db
    .update(loans)
    .set({
      currentCapital: newCapital,
      nextDueDate: isFullyPaid ? loan.nextDueDate : nextDueDate,
      status: updatedStatus,
      updatedAt: paidAt,
    })
    .where(eq(loans.id, loan.id));

  // Actualizar o cancelar notificación
  if (isFullyPaid) {
    void cancelLoanNotification(loan.id);
  } else {
    const nextInterest = Math.round((newCapital * loan.interestRate) / 100);
    void scheduleLoanDueNotification({
      loanId: loan.id,
      clientName: loan.clientName,
      interestAmount: nextInterest,
      dueDateIso: nextDueDate,
    });
  }

  return {
    payment: newPayment,
    newCapital,
    isFullyPaid,
    nextDueDate,
  };
}

export async function deletePayment(id: string) {
  if (Platform.OS === 'web') {
    const { data: payment } = await supabase.from('payments').select('*').eq('id', id).single();
    if (!payment) return;
    const { data: loan } = await supabase.from('loans').select('*').eq('id', payment.loan_id).single();
    if (loan) {
      const restoredCapital = (loan.current_capital || 0) + (payment.capital_amount || 0);
      await supabase
        .from('loans')
        .update({
          current_capital: restoredCapital,
          status: 'activo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', loan.id);
    }
    await supabase.from('payments').delete().eq('id', id);
    return;
  }

  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  if (!payment) return;

  const [loan] = await db.select().from(loans).where(eq(loans.id, payment.loanId));
  if (loan) {
    const restoredCapital = loan.currentCapital + payment.capitalAmount;
    await db
      .update(loans)
      .set({
        currentCapital: restoredCapital,
        status: 'activo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(loans.id, loan.id));
  }

  await db.delete(payments).where(eq(payments.id, id));
}
