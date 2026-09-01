import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllPayments, recordPayment, deletePayment } from '@/db/queries/payments';
import { toast } from '@/lib/toast';

export function usePayments(options?: {
  loanId?: string;
  clientId?: string;
  period?: string;
}) {
  return useQuery({
    queryKey: ['payments', options?.loanId || '', options?.clientId || '', options?.period || ''],
    queryFn: () => getAllPayments(options),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordPayment,
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['payments'] });
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      void qc.invalidateQueries({ queryKey: ['capital'] });
      if (res.isFullyPaid) {
        toast.success('¡Préstamo pagado por completo! 🎉', 'El capital restante fue cancelado.');
      } else {
        toast.success('Pago registrado', 'Recaudo guardado y próxima fecha actualizada.');
      }
    },
    onError: (err) => {
      toast.error('Error al registrar pago', err instanceof Error ? err.message : '');
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] });
      void qc.invalidateQueries({ queryKey: ['loans'] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      void qc.invalidateQueries({ queryKey: ['capital'] });
      toast.success('Pago eliminado', 'Se reversó el saldo de capital del préstamo.');
    },
    onError: (err) => {
      toast.error('Error al eliminar pago', err instanceof Error ? err.message : '');
    },
  });
}
