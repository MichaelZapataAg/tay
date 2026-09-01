import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '@/db/queries/clients';
import { toast } from '@/lib/toast';

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search || ''],
    queryFn: () => getAllClients(search),
  });
}

export function useClientDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => (id ? getClientById(id) : null),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Cliente creado', 'El cliente fue registrado exitosamente.');
    },
    onError: (err) => {
      toast.error('Error al crear cliente', err instanceof Error ? err.message : '');
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClient>[1] }) =>
      updateClient(id, data),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['client', variables.id] });
      toast.success('Cliente actualizado');
    },
    onError: (err) => {
      toast.error('Error al actualizar', err instanceof Error ? err.message : '');
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
      if (res?.deactivated) {
        toast.info('Cliente desactivado', 'Como tiene historial de préstamos, se marcó como inactivo.');
      } else {
        toast.success('Cliente eliminado');
      }
    },
    onError: (err) => {
      toast.error('Error al eliminar', err instanceof Error ? err.message : '');
    },
  });
}
