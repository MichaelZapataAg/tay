import { Platform } from 'react-native';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { loans, clients, payments, type Loan } from '../schema';
import { supabase } from '@/lib/supabase';
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

  let allPayments: any[] = [];
  if (Platform.OS === 'web') {
    const { data } = await supabase.from('payments').select('*');
    allPayments = (data || []).map((p: any) => ({
      ...p,
      interestAmount: p.interest_amount,
      capitalAmount: p.capital_amount,
      totalAmount: p.total_amount,
    }));
  } else {
    allPayments = await db.select().from(payments);
  }

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
      if (l.diffDays <= 7) {
        upcomingLoans.push(l);
      }
    }
  }

  upcomingLoans.sort((a, b) => a.diffDays - b.diffDays);
  overdueLoans.sort((a, b) => a.diffDays - b.diffDays);

  let monthInterestEarned = 0;
  let monthCapitalRecovered = 0;

  for (const p of allPayments) {
    if (p.date && p.date.startsWith(currentMonthStr)) {
      monthInterestEarned += p.interestAmount || 0;
      monthCapitalRecovered += p.capitalAmount || 0;
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
  let monthPayments: any[] = [];
  if (Platform.OS === 'web') {
    const { data } = await supabase.from('payments').select('*').order('date', { ascending: false });
    monthPayments = (data || []).map((p: any) => ({
      id: p.id,
      loanId: p.loan_id,
      clientId: p.client_id,
      date: p.date,
      interestAmount: p.interest_amount,
      capitalAmount: p.capital_amount,
      totalAmount: p.total_amount,
      paymentMethod: p.payment_method,
      notes: p.notes,
      createdAt: p.created_at,
    }));
  } else {
    monthPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.date));
  }

  const filtered = monthPayments.filter((p) => p.date && p.date.startsWith(period));

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
    totalInterest += p.interestAmount || 0;
    totalCapital += p.capitalAmount || 0;

    const method = p.paymentMethod as keyof typeof byPaymentMethod;
    if (byPaymentMethod[method] != null) {
      byPaymentMethod[method] += p.totalAmount || 0;
    } else {
      byPaymentMethod.otro += p.totalAmount || 0;
    }

    const currentDay = dailyMap.get(p.date) || { interest: 0, capital: 0, total: 0 };
    currentDay.interest += p.interestAmount || 0;
    currentDay.capital += p.capitalAmount || 0;
    currentDay.total += p.totalAmount || 0;
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
