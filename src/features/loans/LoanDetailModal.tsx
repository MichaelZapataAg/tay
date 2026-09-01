import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { LoanWithDetails } from '@/db/queries/loans';
import { useDeleteLoan } from '@/features/loans/hooks';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { money, percent, dateLong, frequencyLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export interface LoanDetailModalProps {
  visible: boolean;
  loan: LoanWithDetails | null;
  onClose: () => void;
  onCobrar: () => void;
}

export function LoanDetailModal({
  visible,
  loan,
  onClose,
  onCobrar,
}: LoanDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteLoanMutation = useDeleteLoan();

  if (!loan) return null;

  const handleDelete = async () => {
    haptic.selection();
    await deleteLoanMutation.mutateAsync(loan.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={loan.clientName}
      subtitle={loan.clientAlias || 'Detalle del préstamo'}
    >
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>Información del Préstamo</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Capital prestado original:</Text>
          <Text style={styles.detailVal}>{money(loan.initialAmount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Saldo de capital pendiente:</Text>
          <Text style={[styles.detailVal, { color: colors.primaryDark }]}>
            {money(loan.currentCapital)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tasa de interés:</Text>
          <Text style={styles.detailVal}>
            {percent(loan.interestRate)} ({frequencyLabel(loan.paymentFrequency, loan.frequencyDays)})
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interés por período (Utilidad):</Text>
          <Text style={[styles.detailVal, { color: colors.primaryDark }]}>
            {money(loan.interestAmountPerPeriod)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha de desembolso:</Text>
          <Text style={styles.detailVal}>{dateLong(loan.startDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Próximo corte:</Text>
          <Text style={styles.detailVal}>{dateLong(loan.nextDueDate)}</Text>
        </View>
        {loan.notes ? (
          <View
            style={[
              styles.detailRow,
              { flexDirection: 'column', alignItems: 'flex-start', marginTop: 6 },
            ]}
          >
            <Text style={styles.detailLabel}>Notas / Acuerdos:</Text>
            <Text style={styles.detailNotes}>{loan.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Histórico recaudado */}
      <View
        style={[
          styles.detailSection,
          { backgroundColor: colors.primarySubtle, borderColor: colors.primarySoft },
        ]}
      >
        <Text style={[styles.detailTitle, { color: colors.primaryDeep }]}>
          Historial recaudado de este préstamo
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total intereses cobrados (ganancia):</Text>
          <Text style={[styles.detailVal, { color: colors.primaryDark }]}>
            {money(loan.totalPaidInterest)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total capital recuperado:</Text>
          <Text style={styles.detailVal}>{money(loan.totalPaidCapital)}</Text>
        </View>
      </View>

      {/* Botón registrar cobro */}
      {loan.status === 'activo' && (
        <Button
          onPress={() => {
            haptic.selection();
            onCobrar();
          }}
          size="lg"
          fullWidth
          style={{ marginTop: spacing[3] }}
        >
          Registrar Cobro
        </Button>
      )}

      {/* Borrado destructivo inline */}
      <View style={styles.deleteSection}>
        {confirmDelete ? (
          <View style={styles.confirmDeleteBox}>
            <Text style={styles.confirmDeleteText}>
              ¿Seguro que deseas eliminar este préstamo? Se eliminarán también sus pagos registrados.
            </Text>
            <View style={styles.confirmBtnsRow}>
              <Button variant="ghost" size="sm" onPress={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onPress={handleDelete}>
                Sí, eliminar
              </Button>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteTrigger}>
            <Trash2 size={16} color={colors.danger} />
            <Text style={styles.deleteTriggerText}>Eliminar préstamo</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  detailSection: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
  detailTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  detailVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  detailNotes: {
    ...type.body,
    fontSize: 13,
    color: colors.inkSecondary,
    backgroundColor: '#FFFFFF',
    padding: spacing[3],
    borderRadius: radii.md,
    width: '100%',
    marginTop: 6,
  },
  deleteSection: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  deleteTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing[2],
  },
  deleteTriggerText: {
    ...type.captionBold,
    color: colors.danger,
  },
  confirmDeleteBox: {
    backgroundColor: colors.dangerSoft,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.dueBorder,
    width: '100%',
  },
  confirmDeleteText: {
    ...type.caption,
    color: colors.dangerDark,
    marginBottom: spacing[3],
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
});
