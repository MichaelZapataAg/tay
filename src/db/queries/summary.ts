import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { loans, clients, payments, type Loan } from '../schema';
import { getAllLoans, type LoanWithDetails } from './loans';

export interface DashboardSummary {
  todayTotalInterest: number;
  todayCount: number;
  overdueTotalInterest: number;
  overdueCount: number;
  activeLoansCount: number;
  activeClientsCount: number;
  capitalInStreet: number;
  monthInterestEarned: number;
  monthCapitalRecovered: number;

  todayLoans: LoanWithDetails[];
  overdueLoans: LoanWithDetails[];
  upcomingLoans: LoanWithDetails[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const allLoans = await getAllLoans({ status: 'activo' });
  const allPayments = await db.select().from(payments);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const todayLoans: LoanWithDetails[] = [];
  const overdueLoans: LoanWithDetails[] = [];
  const upcomingLoans: LoanWithDetails[] = [];

  let todayTotalInterest = 0;
  let overdueTotalInterest = 0;
  let capitalInStreet = 0;

  const clientIdsSet = new Set<string>();

  for (const l of allLoans) {
    capitalInStreet += l.currentCapital;
    clientIdsSet.add(l.clientId);

    if (l.dueStatus === 'today') {
      todayLoans.push(l);
      todayTotalInterest += l.interestAmountPerPeriod;
    } else if (l.dueStatus === 'due') {
      overdueLoans.push(l);
      overdueTotalInterest += l.interestAmountPerPeriod;
    } else {
      // Upcoming (próximos en 7 días)
      if (l.diffDays <= 7) {
        upcomingLoans.push(l);
      }
    }
  }

  // Ordenar próximas por diffDays ascendente
  upcomingLoans.sort((a, b) => a.diffDays - b.diffDays);
  // Ordenar vencidas por diffDays ascendente (las que llevan más tiempo vencidas primero)
  overdueLoans.sort((a, b) => a.diffDays - b.diffDays);

  let monthInterestEarned = 0;
  let monthCapitalRecovered = 0;

  for (const p of allPayments) {
    if (p.date.startsWith(currentMonthStr)) {
      monthInterestEarned += p.interestAmount;
      monthCapitalRecovered += p.capitalAmount;
    }
  }

  return {
    todayTotalInterest,
    todayCount: todayLoans.length,
    overdueTotalInterest,
    overdueCount: overdueLoans.length,
    activeLoansCount: allLoans.length,
    activeClientsCount: clientIdsSet.size,
    capitalInStreet,
    monthInterestEarned,
    monthCapitalRecovered,
    todayLoans,
    overdueLoans,
    upcomingLoans,
  };
}

export interface MonthlyBreakdown {
  period: string; // YYYY-MM
  totalCollected: number;
  totalInterest: number;
  totalCapital: number;
  paymentsCount: number;
  byPaymentMethod: {
    efectivo: number;
    nequi: number;
    daviplata: number;
    bancolombia: number;
    otro: number;
  };
  dailyTotals: { date: string; interest: number; capital: number; total: number }[];
}

export async function getMonthlyBreakdown(period: string): Promise<MonthlyBreakdown> {
  const monthPayments = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.date));

  const filtered = monthPayments.filter((p) => p.date.startsWith(period));

  let totalInterest = 0;
  let totalCapital = 0;

  const byPaymentMethod = {
    efectivo: 0,
    nequi: 0,
    daviplata: 0,
    bancolombia: 0,
    otro: 0,
  };

  const dailyMap = new Map<string, { interest: number; capital: number; total: number }>();

  for (const p of filtered) {
    totalInterest += p.interestAmount;
    totalCapital += p.capitalAmount;

    const method = p.paymentMethod as keyof typeof byPaymentMethod;
    if (byPaymentMethod[method] != null) {
      byPaymentMethod[method] += p.totalAmount;
    } else {
      byPaymentMethod.otro += p.totalAmount;
    }

    const currentDay = dailyMap.get(p.date) || { interest: 0, capital: 0, total: 0 };
    currentDay.interest += p.interestAmount;
    currentDay.capital += p.capitalAmount;
    currentDay.total += p.totalAmount;
    dailyMap.set(p.date, currentDay);
  }

  const dailyTotals = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    period,
    totalCollected: totalInterest + totalCapital,
    totalInterest,
    totalCapital,
    paymentsCount: filtered.length,
    byPaymentMethod,
    dailyTotals,
  };
}
