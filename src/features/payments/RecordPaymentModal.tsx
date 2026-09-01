import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, Switch, Image } from 'react-native';
import { Camera, Check } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DateField } from '@/components/ui/DateField';
import { useRecordPayment } from '@/features/payments/hooks';
import { LoanWithDetails } from '@/db/queries/loans';
import { calculateNextDueDate } from '@/db/queries/payments';
import { sendPaymentReceipt } from '@/lib/whatsapp';
import { pickPaymentReceiptPhoto } from '@/lib/photos';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type } from '@/lib/theme';
import { money } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  loan: LoanWithDetails | null;
}

export function RecordPaymentModal({
  visible,
  onClose,
  loan,
}: RecordPaymentModalProps) {
  const recordPaymentMutation = useRecordPayment();

  const [paymentMode, setPaymentMode] = useState<'solo_interes' | 'abono_capital' | 'total'>('solo_interes');
  const [interestAmount, setInterestAmount] = useState<number>(0);
  const [capitalAmount, setCapitalAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('nequi');

  const todayStr = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhotoUri, setReceiptPhotoUri] = useState<string | null>(null);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Inicializar montos cuando se abre el modal con el préstamo seleccionado
  useEffect(() => {
    if (loan) {
      const defaultInterest = Math.round((loan.currentCapital * loan.interestRate) / 100);
      setInterestAmount(defaultInterest);
      setCapitalAmount(0);
      setPaymentMode('solo_interes');
      setNextDueDate(calculateNextDueDate(loan.nextDueDate, loan.frequencyDays || 15));
      setNotes('');
      setReceiptPhotoUri(null);
    }
  }, [loan]);

  if (!loan) return null;

  const handleModeChange = (mode: 'solo_interes' | 'abono_capital' | 'total') => {
    haptic.selection();
    setPaymentMode(mode);
    const standardInterest = Math.round((loan.currentCapital * loan.interestRate) / 100);

    if (mode === 'solo_interes') {
      setInterestAmount(standardInterest);
      setCapitalAmount(0);
    } else if (mode === 'abono_capital') {
      setInterestAmount(standardInterest);
      setCapitalAmount(Math.round(loan.currentCapital * 0.2)); // Sugiere un abono inicial
    } else if (mode === 'total') {
      setInterestAmount(standardInterest);
      setCapitalAmount(loan.currentCapital); // Cancela todo el capital restante
    }
  };

  const totalPayment = interestAmount + capitalAmount;
  const remainingCapitalAfterPayment = Math.max(0, loan.currentCapital - capitalAmount);
  const isClosingLoan = remainingCapitalAfterPayment === 0;

  const handlePickPhoto = async () => {
    const uri = await pickPaymentReceiptPhoto();
    if (uri) {
      setReceiptPhotoUri(uri);
    }
  };

  const handleSubmit = async () => {
    if (totalPayment <= 0) return;

    await recordPaymentMutation.mutateAsync({
      loanId: loan.id,
      clientId: loan.clientId,
      interestAmount,
      capitalAmount,
      paymentMethod,
      periodCovered: `Corte ${loan.nextDueDate}`,
      receiptPhotoUri,
      notes: notes.trim() || undefined,
      nextDueDateOverride: isClosingLoan ? undefined : nextDueDate,
      customPaidDate: paymentDate,
    });

    if (sendWhatsApp && loan.clientPhone) {
      sendPaymentReceipt({
        clientName: loan.clientName,
        phone: loan.clientPhone,
        totalPaid: totalPayment,
        interestPaid: interestAmount,
        capitalPaid: capitalAmount,
        remainingCapital: remainingCapitalAfterPayment,
        nextDueDate: isClosingLoan ? null : nextDueDate,
      });
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Registrar Cobro"
      subtitle={`Cliente: ${loan.clientName}`}
      footer={
        <Button
          onPress={handleSubmit}
          loading={recordPaymentMutation.isPending}
          disabled={totalPayment <= 0}
          fullWidth
          size="lg"
        >
          Confirmar Cobro ({money(totalPayment)})
        </Button>
      }
    >
      {/* TARJETA DE ESTADO ACTUAL */}
      <View style={styles.loanStateBox}>
        <View style={styles.loanStateRow}>
          <Text style={styles.loanStateLabel}>Capital prestado actual:</Text>
          <Text style={styles.loanStateValue}>{money(loan.currentCapital)}</Text>
        </View>
        <View style={styles.loanStateRow}>
          <Text style={styles.loanStateLabel}>Interés por corte ({loan.interestRate}%):</Text>
          <Text style={styles.loanStateInterest}>{money(loan.interestAmountPerPeriod)}</Text>
        </View>
      </View>

      {/* SELECTOR DE MODO DE PAGO */}
      <Text style={styles.sectionTitle}>1. ¿Qué está pagando el cliente?</Text>
      <View style={styles.modeTabs}>
        <Pressable
          onPress={() => handleModeChange('solo_interes')}
          style={[styles.modeTab, paymentMode === 'solo_interes' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, paymentMode === 'solo_interes' && styles.modeTabTextActive]}>
            Solo Interés
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleModeChange('abono_capital')}
          style={[styles.modeTab, paymentMode === 'abono_capital' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, paymentMode === 'abono_capital' && styles.modeTabTextActive]}>
            Interés + Abono
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleModeChange('total')}
          style={[styles.modeTab, paymentMode === 'total' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, paymentMode === 'total' && styles.modeTabTextActive]}>
            Liquidación Total
          </Text>
        </Pressable>
      </View>

      {/* DESGLOSE DE DINERO */}
      <View style={styles.moneyInputsContainer}>
        {/* INTERÉS: GANANCIA DE TAY */}
        <View style={styles.interestSection}>
          <View style={styles.interestHeaderRow}>
            <Text style={styles.interestTitle}>💵 Interés (Utilidad de Tay)</Text>
            <Text style={styles.interestBadge}>Tu ganancia</Text>
          </View>
          <MoneyInput
            value={interestAmount}
            onChangeValue={setInterestAmount}
            presets={[50_000, 100_000, 200_000, 300_000]}
          />
        </View>

        {/* ABONO A CAPITAL */}
        {paymentMode !== 'solo_interes' && (
          <View style={styles.capitalSection}>
            <View style={styles.interestHeaderRow}>
              <Text style={styles.capitalTitle}>🏦 Abono a Capital</Text>
              <Text style={styles.capitalBadge}>Regresa al fondo</Text>
            </View>
            <MoneyInput
              value={capitalAmount}
              onChangeValue={setCapitalAmount}
              presets={[200_000, 500_000, 1_000_000, loan.currentCapital]}
            />
          </View>
        )}
      </View>

      {/* RESUMEN DEL EFECTO */}
      <View style={styles.effectBox}>
        <View style={styles.effectRow}>
          <Text style={styles.effectLabel}>Total a recibir:</Text>
          <Text style={styles.effectTotal}>{money(totalPayment)}</Text>
        </View>
        <View style={styles.effectRow}>
          <Text style={styles.effectLabel}>Nuevo saldo de capital pendiente:</Text>
          <Text style={styles.effectCapital}>{money(remainingCapitalAfterPayment)}</Text>
        </View>
        {isClosingLoan && (
          <Text style={styles.closedLoanNotice}>
            🎉 Con este pago el préstamo queda 100% CANCELADO y pagado.
          </Text>
        )}
      </View>

      {/* MÉTODO DE PAGO */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[4] }]}>2. Medio de pago recibido</Text>
      <View style={styles.methodsRow}>
        {[
          { id: 'nequi', label: 'Nequi' },
          { id: 'efectivo', label: 'Efectivo' },
          { id: 'bancolombia', label: 'Bancolombia' },
          { id: 'daviplata', label: 'Daviplata' },
        ].map((m) => {
          const isSelected = paymentMethod === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                haptic.selection();
                setPaymentMethod(m.id);
              }}
              style={[styles.methodChip, isSelected && styles.methodChipActive]}
            >
              {isSelected ? <Check size={14} color={colors.primaryDark} style={{ marginRight: 4 }} /> : null}
              <Text style={[styles.methodText, isSelected && styles.methodTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* FECHAS */}
      <Text style={[styles.sectionTitle, { marginTop: spacing[4] }]}>3. Fechas</Text>
      <DateField
        label="Fecha de este pago:"
        value={paymentDate}
        onChangeValue={setPaymentDate}
      />

      {!isClosingLoan && (
        <DateField
          label="Próxima fecha de cobro de intereses:"
          value={nextDueDate}
          onChangeValue={setNextDueDate}
        />
      )}

      {/* COMPROBANTE ADJUNTO */}
      <View style={styles.photoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.photoLabel}>Comprobante de transferencia (opcional):</Text>
          <Text style={styles.photoSub}>Adjunta captura de Nequi o transferencia</Text>
        </View>
        <Pressable onPress={handlePickPhoto} style={styles.photoButton}>
          <Camera size={20} color={colors.primary} />
          <Text style={styles.photoButtonText}>
            {receiptPhotoUri ? 'Cambiar foto' : 'Subir foto'}
          </Text>
        </Pressable>
      </View>

      {receiptPhotoUri ? (
        <View style={styles.receiptPreviewContainer}>
          <Image source={{ uri: receiptPhotoUri }} style={styles.receiptPreview} />
          <Pressable onPress={() => setReceiptPhotoUri(null)} style={styles.removePhotoBtn}>
            <Text style={styles.removePhotoText}>Quitar</Text>
          </Pressable>
        </View>
      ) : null}

      <Input
        label="Notas del pago (opcional):"
        placeholder="Ej. Pagó completo en la mañana"
        value={notes}
        onChangeText={setNotes}
        containerStyle={{ marginTop: spacing[3] }}
      />

      {/* Opción WhatsApp */}
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Enviar comprobante por WhatsApp</Text>
          <Text style={styles.switchSub}>Abre WhatsApp con el mensaje de confirmación listo</Text>
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
  loanStateBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  loanStateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loanStateLabel: {
    ...type.caption,
    color: colors.inkMuted,
  },
  loanStateValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  loanStateInterest: {
    fontFamily: fonts.titleBold,
    fontSize: 15,
    color: colors.primaryDark,
  },
  sectionTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginBottom: spacing[2],
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing[3],
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  modeTabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  moneyInputsContainer: {
    gap: spacing[3],
  },
  interestSection: {
    backgroundColor: colors.primarySubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  capitalSection: {
    backgroundColor: colors.accentSubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  interestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  interestTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDeep,
  },
  interestBadge: {
    ...type.micro,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  capitalTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.accentDark,
  },
  capitalBadge: {
    ...type.micro,
    backgroundColor: colors.accentSoft,
    color: colors.accentDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  effectBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: spacing[3],
  },
  effectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  effectLabel: {
    ...type.captionBold,
    color: colors.inkSecondary,
  },
  effectTotal: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  effectCapital: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.accentDark,
  },
  closedLoanNotice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.successDark,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  methodText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  methodTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  photoLabel: {
    ...type.captionBold,
    color: colors.ink,
  },
  photoSub: {
    ...type.micro,
    color: colors.inkMuted,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  photoButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
    marginLeft: 6,
  },
  receiptPreviewContainer: {
    marginTop: spacing[2],
    alignItems: 'center',
  },
  receiptPreview: {
    width: 140,
    height: 180,
    borderRadius: radii.md,
  },
  removePhotoBtn: {
    marginTop: 4,
  },
  removePhotoText: {
    ...type.caption,
    color: colors.danger,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[3],
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
