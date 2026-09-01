import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCapitalMetrics,
  getAllCapitalMovements,
  createCapitalMovement,
  deleteCapitalMovement,
} from '@/db/queries/capital';
import { toast } from '@/lib/toast';

export function useCapitalMetrics(period?: string) {
  return useQuery({
    queryKey: ['capital', 'metrics', period || ''],
    queryFn: () => getCapitalMetrics(period),
  });
}

export function useCapitalMovements() {
  return useQuery({
    queryKey: ['capital', 'movements'],
    queryFn: getAllCapitalMovements,
  });
}

export function useCreateCapitalMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCapitalMovement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['capital'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Movimiento de capital guardado');
    },
    onError: (err) => {
      toast.error('Error al guardar movimiento', err instanceof Error ? err.message : '');
    },
  });
}

export function useDeleteCapitalMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCapitalMovement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['capital'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Movimiento eliminado');
    },
    onError: (err) => {
      toast.error('Error al eliminar movimiento', err instanceof Error ? err.message : '');
    },
  });
}
