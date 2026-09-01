import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DateField } from '@/components/ui/DateField';
import { useCreateCapitalMovement } from '@/features/capital/hooks';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

export interface NewCapitalMovementModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: 'inyeccion' | 'gasto_capital' | 'reposicion_capital' | 'retiro_utilidad' | 'retiro_capital';
}

export function NewCapitalMovementModal({
  visible,
  onClose,
  defaultType = 'inyeccion',
}: NewCapitalMovementModalProps) {
  const createMovementMutation = useCreateCapitalMovement();

  const [typeSelection, setTypeSelection] = useState<
    'inyeccion' | 'gasto_capital' | 'reposicion_capital' | 'retiro_utilidad' | 'retiro_capital'
  >(defaultType);
  const [amount, setAmount] = useState<number>(1_000_000);
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (amount <= 0) return;

    await createMovementMutation.mutateAsync({
      type: typeSelection,
      amount,
      date,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Movimiento de Capital"
      subtitle="Controla tu fondo, gastos y ganancias"
      footer={
        <Button
          onPress={handleSubmit}
          loading={createMovementMutation.isPending}
          disabled={amount <= 0}
          fullWidth
          size="lg"
        >
          Guardar Movimiento
        </Button>
      }
    >
      <Text style={styles.sectionTitle}>Tipo de movimiento:</Text>
      <View style={styles.typeRow}>
        {[
          {
            id: 'inyeccion',
            icon: '💰',
            label: 'Inyectar Capital',
            sub: 'Meto más plata propia a mi fondo para prestar',
          },
          {
            id: 'gasto_capital',
            icon: '💸',
            label: 'Gasto del Capital (a reponer)',
            sub: 'Saqué plata del capital para un gasto y debo reponerla',
          },
          {
            id: 'reposicion_capital',
            icon: '🔄',
            label: 'Reponer Capital',
            sub: 'Devuelvo plata al fondo para saldar lo que saqué',
          },
          {
            id: 'retiro_utilidad',
            icon: '👛',
            label: 'Retirar Ganancias',
            sub: 'Saco mis intereses cobrados para mi uso personal',
          },
          {
            id: 'retiro_capital',
            icon: '🚫',
            label: 'Retiro Definitivo de Capital',
            sub: 'Reduzco el tamaño de mi fondo de préstamos',
          },
        ].map((t) => {
          const isSelected = typeSelection === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                haptic.selection();
                setTypeSelection(t.id as any);
              }}
              style={[styles.typeCard, isSelected && styles.typeCardActive]}
            >
              <Text style={[styles.typeTitle, isSelected && styles.typeTitleActive]}>
                {t.icon} {t.label}
              </Text>
              <Text style={styles.typeSub}>{t.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[3] }]}>Monto en Pesos:</Text>
      <MoneyInput
        value={amount}
        onChangeValue={setAmount}
        presets={[100_000, 500_000, 1_000_000, 2_000_000, 5_000_000]}
      />

      <DateField label="Fecha:" value={date} onChangeValue={setDate} />

      <Input
        label="Descripción o motivo (opcional):"
        placeholder="Ej. Arreglo moto / Reposición quincena / Aporte inicial"
        value={notes}
        onChangeText={setNotes}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginBottom: spacing[2],
  },
  typeRow: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  typeCard: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  typeTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  typeTitleActive: {
    color: colors.primaryDark,
  },
  typeSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
