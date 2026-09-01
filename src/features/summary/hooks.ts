import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getMonthlyBreakdown } from '@/db/queries/summary';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['summary', 'dashboard'],
    queryFn: getDashboardSummary,
  });
}

export function useMonthlyBreakdown(period: string) {
  return useQuery({
    queryKey: ['summary', 'monthly', period],
    queryFn: () => getMonthlyBreakdown(period),
  });
}
