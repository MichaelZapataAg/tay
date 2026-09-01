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
}

export function NewCapitalMovementModal({
  visible,
  onClose,
}: NewCapitalMovementModalProps) {
  const createMovementMutation = useCreateCapitalMovement();

  const [typeSelection, setTypeSelection] = useState<'inyeccion' | 'retiro_capital' | 'retiro_utilidad'>('inyeccion');
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
      subtitle="Inyecciones o retiros de tu fondo"
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
          { id: 'inyeccion', label: 'Inyectar Capital', sub: 'Meto más plata al fondo' },
          { id: 'retiro_capital', label: 'Retirar Capital', sub: 'Saco plata de mi fondo' },
          { id: 'retiro_utilidad', label: 'Retirar Ganancia', sub: 'Saco mis intereses ganados' },
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
                {t.label}
              </Text>
              <Text style={styles.typeSub}>{t.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[3] }]}>Monto:</Text>
      <MoneyInput
        value={amount}
        onChangeValue={setAmount}
        presets={[1_000_000, 2_000_000, 5_000_000, 10_000_000]}
      />

      <DateField label="Fecha:" value={date} onChangeValue={setDate} />

      <Input
        label="Descripción o motivo (opcional):"
        placeholder="Ej. Aporte de ahorros personales para nuevos clientes"
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
