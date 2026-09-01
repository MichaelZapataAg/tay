import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { payments, loans, clients, type Payment, type NewPayment } from '../schema';
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
  const query = db
    .select({
      payment: payments,
      client: clients,
    })
    .from(payments)
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .orderBy(desc(payments.paidAt));

  const all = await query;

  let result: PaymentWithDetails[] = all.map(({ payment, client }) => ({
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

/**
 * Calcula la siguiente fecha sumando los días de frecuencia (ej. +15 días)
 */
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
  const [loan] = await db.select().from(loans).where(eq(loans.id, params.loanId));
  if (!loan) throw new Error('Préstamo no encontrado');

  const now = new Date();
  const paidAt = now.toISOString();
  const dateStr = params.customPaidDate || paidAt.split('T')[0];

  const totalAmount = (params.interestAmount || 0) + (params.capitalAmount || 0);

  const paymentId = newId();
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
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  if (!payment) return;

  const [loan] = await db.select().from(loans).where(eq(loans.id, payment.loanId));
  if (loan) {
    // Reversar abono a capital
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
