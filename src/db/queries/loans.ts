import { desc, eq, sql, and, or } from 'drizzle-orm';
import { db } from '../client';
import { loans, clients, payments, type Loan, type NewLoan } from '../schema';
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
  const allLoans = await db
    .select({
      loan: loans,
      client: clients,
    })
    .from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .orderBy(desc(loans.createdAt));

  const allPayments = await db.select().from(payments);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: LoanWithDetails[] = allLoans.map(({ loan, client }) => {
    const loanPayments = allPayments.filter((p) => p.loanId === loan.id);
    const totalPaidInterest = loanPayments.reduce((sum, p) => sum + p.interestAmount, 0);
    const totalPaidCapital = loanPayments.reduce((sum, p) => sum + p.capitalAmount, 0);

    const interestAmountPerPeriod = Math.round((loan.currentCapital * loan.interestRate) / 100);

    // Calcular estado de vencimiento
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

  // Elimina pagos asociados y préstamo en transacción
  await db.delete(payments).where(eq(payments.loanId, id));
  await db.delete(loans).where(eq(loans.id, id));
}
