import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DateField } from '@/components/ui/DateField';
import { useClients } from '@/features/clients/hooks';
import { useCreateLoan } from '@/features/loans/hooks';
import { useCreateClient } from '@/features/clients/hooks';
import { useSettings } from '@/lib/settings';
import { calculateNextDueDate } from '@/db/queries/payments';
import { sendNewLoanConfirmation } from '@/lib/whatsapp';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { money, percent, frequencyLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export interface NewLoanModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedClientId?: string;
}

export function NewLoanModal({
  visible,
  onClose,
  preselectedClientId,
}: NewLoanModalProps) {
  const settings = useSettings();
  const { data: clientsList = [] } = useClients();
  const createLoanMutation = useCreateLoan();
  const createClientMutation = useCreateClient();

  const [clientId, setClientId] = useState<string>(preselectedClientId || '');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAlias, setNewClientAlias] = useState('');

  const [initialAmount, setInitialAmount] = useState<number>(1_000_000);
  const [interestRate, setInterestRate] = useState<number>(settings.defaultInterestRate || 15);
  const [customRateText, setCustomRateText] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<'quincenal' | 'cada_20_dias' | 'mensual' | 'semanal' | 'personalizado_dias'>(
    settings.defaultFrequency || 'quincenal',
  );
  const [frequencyDays, setFrequencyDays] = useState<number>(settings.defaultFrequencyDays || 15);

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState(() =>
    calculateNextDueDate(todayStr, settings.defaultFrequencyDays || 15),
  );

  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Sincronizar preselectedClientId si cambia
  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
      setIsNewClient(false);
    }
  }, [preselectedClientId]);

  // Recalcular nextDueDate cuando cambia startDate o frequencyDays
  const handleFrequencyChange = (
    freq: 'quincenal' | 'cada_20_dias' | 'mensual' | 'semanal' | 'personalizado_dias',
    days: number,
  ) => {
    haptic.selection();
    setPaymentFrequency(freq);
    setFrequencyDays(days);
    setNextDueDate(calculateNextDueDate(startDate, days));
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setNextDueDate(calculateNextDueDate(newStart, frequencyDays));
  };

  const calculatedInterestPerPeriod = Math.round((initialAmount * interestRate) / 100);

  const handleSubmit = async () => {
    if (initialAmount <= 0) return;

    let targetClientId = clientId;
    let targetClientName = '';
    let targetClientPhone = '';

    if (isNewClient || !clientId) {
      if (!newClientName.trim()) return;
      const created = await createClientMutation.mutateAsync({
        name: newClientName.trim(),
        alias: newClientAlias.trim() || null,
        phone: newClientPhone.trim() || null,
        address: null,
        notes: null,
        active: true,
      });
      targetClientId = created.id;
      targetClientName = created.name;
      targetClientPhone = created.phone || '';
    } else {
      const existing = clientsList.find((c) => c.id === clientId);
      targetClientName = existing?.name || 'Cliente';
      targetClientPhone = existing?.phone || '';
    }

    await createLoanMutation.mutateAsync({
      clientId: targetClientId,
      clientName: targetClientName,
      initialAmount,
      currentCapital: initialAmount,
      interestRate,
      paymentFrequency,
      frequencyDays,
      loanType: 'solo_interes',
      startDate,
      nextDueDate,
      status: 'activo',
      notes: notes.trim() || null,
    });

    if (sendWhatsApp && targetClientPhone) {
      sendNewLoanConfirmation({
        clientName: targetClientName,
        phone: targetClientPhone,
        initialAmount,
        rate: interestRate,
        frequency: paymentFrequency,
        frequencyDays,
        firstDueDate: nextDueDate,
      });
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Nuevo Préstamo"
      subtitle="Registra desembolso y tasa de interés"
      footer={
        <Button
          onPress={handleSubmit}
          loading={createLoanMutation.isPending || createClientMutation.isPending}
          disabled={initialAmount <= 0 || (!clientId && !newClientName.trim())}
          fullWidth
          size="lg"
        >
          Crear Préstamo ({money(initialAmount)})
        </Button>
      }
    >
      {/* SELECCIÓN DE CLIENTE */}
      <Text style={styles.sectionTitle}>1. ¿A quién le prestas?</Text>

      {!preselectedClientId && (
        <View style={styles.clientSelectorTabs}>
          <Pressable
            onPress={() => {
              haptic.selection();
              setIsNewClient(false);
            }}
            style={[styles.clientTab, !isNewClient && styles.clientTabActive]}
          >
            <Text style={[styles.clientTabText, !isNewClient && styles.clientTabTextActive]}>
              Cliente Existente
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              haptic.selection();
              setIsNewClient(true);
            }}
            style={[styles.clientTab, isNewClient && styles.clientTabActive]}
          >
            <Text style={[styles.clientTabText, isNewClient && styles.clientTabTextActive]}>
              + Nuevo Cliente
            </Text>
          </Pressable>
        </View>
      )}

      {isNewClient || clientsList.length === 0 ? (
        <View style={styles.newClientBox}>
          <Input
            label="Nombre completo *"
            placeholder="Ej. Carlos Mendoza"
            value={newClientName}
            onChangeText={setNewClientName}
          />
          <Input
            label="Celular / WhatsApp"
            placeholder="Ej. 312 345 6789"
            keyboardType="phone-pad"
            value={newClientPhone}
            onChangeText={setNewClientPhone}
          />
          <Input
            label="Alias o Negocio (opcional)"
            placeholder="Ej. Carlitos Taller"
            value={newClientAlias}
            onChangeText={setNewClientAlias}
          />
        </View>
      ) : (
        <View style={styles.existingClientBox}>
          <Text style={styles.sublabel}>Selecciona el cliente:</Text>
          <View style={styles.clientChipsList}>
            {clientsList.map((c) => {
              const isSelected = c.id === clientId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    haptic.selection();
                    setClientId(c.id);
                  }}
                  style={[styles.clientChip, isSelected && styles.clientChipActive]}
                >
                  <Text style={[styles.clientChipText, isSelected && styles.clientChipTextActive]}>
                    {c.name} {c.alias ? `(${c.alias})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* MONTO DEL PRÉSTAMO */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[4] }]}>2. Capital a prestar</Text>
      <MoneyInput
        value={initialAmount}
        onChangeValue={setInitialAmount}
        presets={[500_000, 1_000_000, 2_000_000, 5_000_000]}
      />

      {/* TASA DE INTERÉS VARIABLE */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[3] }]}>
        3. Porcentaje de interés acordado
      </Text>
      <View style={styles.ratePresetsRow}>
        {[10, 15, 20, 25].map((rate) => {
          const isSelected = interestRate === rate && !customRateText;
          return (
            <Pressable
              key={rate}
              onPress={() => {
                haptic.selection();
                setInterestRate(rate);
                setCustomRateText('');
              }}
              style={[styles.ratePresetChip, isSelected && styles.ratePresetChipActive]}
            >
              <Text style={[styles.ratePresetText, isSelected && styles.ratePresetTextActive]}>
                {rate}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label="O digita otro porcentaje (%):"
        placeholder="Ej. 12"
        keyboardType="numeric"
        value={customRateText}
        onChangeText={(val) => {
          setCustomRateText(val);
          const parsed = parseFloat(val.replace(',', '.'));
          if (!isNaN(parsed) && parsed > 0) {
            setInterestRate(parsed);
          }
        }}
        containerStyle={{ marginTop: spacing[2] }}
      />

      {/* FRECUENCIA DE COBRO */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[3] }]}>
        4. Frecuencia de cobro de intereses
      </Text>
      <View style={styles.frequencyGrid}>
        <Pressable
          onPress={() => handleFrequencyChange('quincenal', 15)}
          style={[styles.freqCard, paymentFrequency === 'quincenal' && styles.freqCardActive]}
        >
          <Text style={[styles.freqTitle, paymentFrequency === 'quincenal' && styles.freqTitleActive]}>
            Quincenal
          </Text>
          <Text style={styles.freqSub}>Cada 15 días</Text>
        </Pressable>

        <Pressable
          onPress={() => handleFrequencyChange('cada_20_dias', 20)}
          style={[styles.freqCard, paymentFrequency === 'cada_20_dias' && styles.freqCardActive]}
        >
          <Text style={[styles.freqTitle, paymentFrequency === 'cada_20_dias' && styles.freqTitleActive]}>
            Cada 20 días
          </Text>
          <Text style={styles.freqSub}>Cada 20 días</Text>
        </Pressable>

        <Pressable
          onPress={() => handleFrequencyChange('mensual', 30)}
          style={[styles.freqCard, paymentFrequency === 'mensual' && styles.freqCardActive]}
        >
          <Text style={[styles.freqTitle, paymentFrequency === 'mensual' && styles.freqTitleActive]}>
            Mensual
          </Text>
          <Text style={styles.freqSub}>Cada 30 días</Text>
        </Pressable>

        <Pressable
          onPress={() => handleFrequencyChange('semanal', 7)}
          style={[styles.freqCard, paymentFrequency === 'semanal' && styles.freqCardActive]}
        >
          <Text style={[styles.freqTitle, paymentFrequency === 'semanal' && styles.freqTitleActive]}>
            Semanal
          </Text>
          <Text style={styles.freqSub}>Cada 7 días</Text>
        </Pressable>
      </View>

      {/* FECHAS */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[4] }]}>5. Fechas del préstamo</Text>
      <DateField
        label="Fecha de desembolso / inicio:"
        value={startDate}
        onChangeValue={handleStartDateChange}
      />
      <DateField
        label="Primer corte de pago (se avisa automáticamente):"
        value={nextDueDate}
        onChangeValue={setNextDueDate}
      />

      {/* RESUMEN DEL PRÉSTAMO */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📊 Resumen del préstamo:</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Capital entregado:</Text>
          <Text style={styles.summaryValue}>{money(initialAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tasa de interés:</Text>
          <Text style={styles.summaryValue}>{percent(interestRate)} ({frequencyLabel(paymentFrequency, frequencyDays)})</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
          <Text style={styles.summaryLabelHighlight}>Ganancia / Interés por corte:</Text>
          <Text style={styles.summaryValueHighlight}>{money(calculatedInterestPerPeriod)}</Text>
        </View>
      </View>

      <Input
        label="Notas o garantías (opcional):"
        placeholder="Ej. Para surtido de mercancía, garantía firmada"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />

      {/* Opción WhatsApp */}
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Enviar confirmación por WhatsApp</Text>
          <Text style={styles.switchSub}>Abre WhatsApp con los datos del préstamo listos para enviar</Text>
        </View>
        <Switch
          value={sendWhatsApp}
          onValueChange={setSendWhatsApp}
          trackColor={{ false: colors.border, true: colors.whatsappDark }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginBottom: spacing[2],
  },
  sublabel: {
    ...type.caption,
    color: colors.inkMuted,
    marginBottom: spacing[2],
  },
  clientSelectorTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing[3],
  },
  clientTab: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  clientTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientTabText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  clientTabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  newClientBox: {
    backgroundColor: colors.primarySubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  existingClientBox: {
    marginBottom: spacing[2],
  },
  clientChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    maxHeight: 140,
  },
  clientChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  clientChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  clientChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  clientChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  ratePresetsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  ratePresetChip: {
    flex: 1,
    paddingVertical: spacing[2] + 2,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  ratePresetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  ratePresetText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.inkSecondary,
  },
  ratePresetTextActive: {
    color: colors.primaryDark,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  freqCard: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  freqCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  freqTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  freqTitleActive: {
    color: colors.accentDark,
  },
  freqSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radii.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.primarySoft,
    marginVertical: spacing[3],
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  summaryRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: colors.primarySoft,
    paddingTop: spacing[2],
    marginTop: spacing[1],
  },
  summaryLabelHighlight: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  summaryValueHighlight: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[2],
  },
  switchTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  switchSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
