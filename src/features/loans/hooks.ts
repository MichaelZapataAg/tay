import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
} from '@/db/queries/loans';
import { toast } from '@/lib/toast';

export function useLoans(options?: {
  status?: string;
  dueFilter?: 'all' | 'today' | 'due' | 'upcoming';
  search?: string;
}) {
  return useQuery({
    queryKey: ['loans', options?.status || '', options?.dueFilter || '', options?.search || ''],
    queryFn: () => getAllLoans(options),
  });
}

export function useLoanDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: () => (id ? getLoanById(id) : null),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLoan,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      void qc.invalidateQueries({ queryKey: ['capital'] });
      toast.success('Préstamo registrado', 'El préstamo fue creado exitosamente.');
    },
    onError: (err) => {
      toast.error('Error al registrar préstamo', err instanceof Error ? err.message : '');
    },
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateLoan>[1] }) =>
      updateLoan(id, data),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['loan', variables.id] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Préstamo actualizado');
    },
    onError: (err) => {
      toast.error('Error al actualizar préstamo', err instanceof Error ? err.message : '');
    },
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLoan,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      void qc.invalidateQueries({ queryKey: ['capital'] });
      toast.success('Préstamo eliminado');
    },
    onError: (err) => {
      toast.error('Error al eliminar préstamo', err instanceof Error ? err.message : '');
    },
  });
}
