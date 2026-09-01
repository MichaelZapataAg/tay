import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Coins,
  CreditCard,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import {
  useCapitalMetrics,
  useCapitalMovements,
  useDeleteCapitalMovement,
} from '@/features/capital/hooks';
import { useMonthlyBreakdown } from '@/features/summary/hooks';
import { usePayments, useDeletePayment } from '@/features/payments/hooks';
import { MonthPicker } from '@/components/MonthPicker';
import { Badge } from '@/components/ui/Badge';
import { NewCapitalMovementModal } from '@/features/capital/NewCapitalMovementModal';
import { currentPeriod, formatPeriod } from '@/lib/period';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { money, dateLong } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function CapitalScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod());
  const [movementModalVisible, setMovementModalVisible] = useState(false);

  const { data: metrics, refetch: refetchMetrics, isRefetching } = useCapitalMetrics(selectedPeriod);
  const { data: monthlyBreakdown, refetch: refetchBreakdown } = useMonthlyBreakdown(selectedPeriod);
  const { data: movements = [], refetch: refetchMovements } = useCapitalMovements();
  const { data: monthPayments = [], refetch: refetchPayments } = usePayments({ period: selectedPeriod });

  const deleteMovementMutation = useDeleteCapitalMovement();
  const deletePaymentMutation = useDeletePayment();

  const handleRefresh = async () => {
    await Promise.all([
      refetchMetrics(),
      refetchBreakdown(),
      refetchMovements(),
      refetchPayments(),
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER CON AIRE */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Caja & Capital</Text>
          <Text style={styles.subtitle}>Tracking financiero de Tay ✨</Text>
        </View>
      </View>

      {/* SELECTOR DE MES */}
      <View style={styles.monthPickerContainer}>
        <MonthPicker value={selectedPeriod} onChange={setSelectedPeriod} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* HERO 1: TU GANANCIA REAL (LILA / MENTA GIRLY) */}
        <View style={styles.profitHeroCard}>
          <View style={styles.profitHeroHeader}>
            <View style={styles.profitBadge}>
              <Sparkles size={15} color={colors.primaryDark} style={{ marginRight: 4 }} />
              <Text style={styles.profitBadgeText}>Tu Ganancia Real (Intereses)</Text>
            </View>
            <Text style={styles.profitPeriodText}>{formatPeriod(selectedPeriod)}</Text>
          </View>

          <Text style={styles.profitAmount}>
            +{money(metrics?.interestEarnedMonth || 0)}
          </Text>
          <Text style={styles.profitSub}>
            Intereses recaudados en el mes • Este dinero es 100% tu utilidad personal
          </Text>
        </View>

        {/* HERO 2: CAPITAL EN LA CALLE VS CAPITAL RECUPERADO (PASTEL) */}
        <View style={styles.capitalSplitRow}>
          {/* Capital en calle (Celeste pastel) */}
          <View style={[styles.capitalCard, styles.capitalCardStreet]}>
            <Text style={styles.capitalCardLabel}>Capital en la calle:</Text>
            <Text style={styles.capitalCardValue}>{money(metrics?.capitalInStreet || 0)}</Text>
            <Text style={styles.capitalCardSub}>Prestado en clientes</Text>
          </View>

          {/* Capital recuperado este mes */}
          <View style={[styles.capitalCard, styles.capitalCardRecovered]}>
            <Text style={styles.capitalCardLabel}>Capital recuperado:</Text>
            <Text style={[styles.capitalCardValue, { color: colors.primaryDark }]}>
              {money(metrics?.capitalCollectedMonth || 0)}
            </Text>
            <Text style={styles.capitalCardSub}>Listo para volver a prestar</Text>
          </View>
        </View>

        {/* DESGLOSE POR MEDIO DE PAGO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>💳 Recaudos por Medio de Pago</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={styles.methodBox}>
              <Text style={styles.methodName}>Nequi</Text>
              <Text style={styles.methodAmount}>
                {money(monthlyBreakdown?.byPaymentMethod?.nequi || 0)}
              </Text>
            </View>

            <View style={styles.methodBox}>
              <Text style={styles.methodName}>Efectivo</Text>
              <Text style={styles.methodAmount}>
                {money(monthlyBreakdown?.byPaymentMethod?.efectivo || 0)}
              </Text>
            </View>

            <View style={styles.methodBox}>
              <Text style={styles.methodName}>Bancolombia</Text>
              <Text style={styles.methodAmount}>
                {money(monthlyBreakdown?.byPaymentMethod?.bancolombia || 0)}
              </Text>
            </View>

            <View style={styles.methodBox}>
              <Text style={styles.methodName}>Daviplata / Otro</Text>
              <Text style={styles.methodAmount}>
                {money(
                  (monthlyBreakdown?.byPaymentMethod?.daviplata || 0) +
                    (monthlyBreakdown?.byPaymentMethod?.otro || 0),
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* LISTA DE PAGOS DEL MES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            📝 Pagos recibidos en {formatPeriod(selectedPeriod)} ({monthPayments.length})
          </Text>
        </View>

        {monthPayments.length > 0 ? (
          monthPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentClientName}>{payment.clientName}</Text>
                  <Text style={styles.paymentDate}>{dateLong(payment.date)} • {payment.paymentMethod}</Text>
                </View>
                <Text style={styles.paymentTotal}>{money(payment.totalAmount)}</Text>
              </View>

              <View style={styles.paymentBreakdownRow}>
                <Text style={styles.paymentInterestPart}>
                  Interés (Ganancia): {money(payment.interestAmount)}
                </Text>
                {payment.capitalAmount > 0 ? (
                  <Text style={styles.paymentCapitalPart}>
                    Abono Capital: {money(payment.capitalAmount)}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={async () => {
                  haptic.selection();
                  await deletePaymentMutation.mutateAsync(payment.id);
                }}
                hitSlop={8}
                style={styles.deletePaymentBtn}
              >
                <Trash2 size={14} color={colors.danger} />
                <Text style={styles.deletePaymentText}>Eliminar pago</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No hay pagos registrados en este mes.</Text>
          </View>
        )}

        {/* MOVIMIENTOS DE CAPITAL DE TAY (INYECCIONES / RETIROS) */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing[6] }]}>
          <Text style={styles.sectionTitle}>🏦 Fondo de Préstamos (Inyecciones y Retiros)</Text>
          <Pressable
            onPress={() => {
              haptic.selection();
              setMovementModalVisible(true);
            }}
            style={styles.btnAddMovement}
          >
            <Plus size={16} color={colors.primaryDark} style={{ marginRight: 4 }} />
            <Text style={styles.btnAddMovementText}>Nuevo</Text>
          </Pressable>
        </View>

        <View style={styles.baseCapitalSummaryBox}>
          <View style={styles.baseCapitalCol}>
            <Text style={styles.baseCapitalLabel}>Total inyectado al fondo:</Text>
            <Text style={styles.baseCapitalVal}>{money(metrics?.totalInjected || 0)}</Text>
          </View>
          <View style={styles.baseCapitalCol}>
            <Text style={styles.baseCapitalLabel}>Retiros de capital:</Text>
            <Text style={styles.baseCapitalVal}>{money(metrics?.totalWithdrawnCapital || 0)}</Text>
          </View>
        </View>

        {movements.length > 0 ? (
          movements.map((m) => {
            const isInyeccion = m.type === 'inyeccion';
            return (
              <View key={m.id} style={styles.movementItem}>
                <View
                  style={[
                    styles.movementIconBox,
                    isInyeccion ? styles.movementIconIn : styles.movementIconOut,
                  ]}
                >
                  {isInyeccion ? (
                    <ArrowDownLeft size={18} color={colors.primaryDark} />
                  ) : (
                    <ArrowUpRight size={18} color={colors.pinkDark} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movementTitle}>
                    {isInyeccion
                      ? 'Inyección al Fondo'
                      : m.type === 'retiro_utilidad'
                      ? 'Retiro de Ganancias'
                      : 'Retiro de Capital'}
                  </Text>
                  <Text style={styles.movementSub}>
                    {dateLong(m.date)} {m.notes ? `• ${m.notes}` : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.movementAmount,
                    isInyeccion ? { color: colors.primaryDark } : { color: colors.ink },
                  ]}
                >
                  {isInyeccion ? '+' : '-'}
                  {money(m.amount)}
                </Text>
                <Pressable
                  onPress={async () => {
                    haptic.selection();
                    await deleteMovementMutation.mutateAsync(m.id);
                  }}
                  hitSlop={8}
                  style={{ marginLeft: 8 }}
                >
                  <Trash2 size={16} color={colors.inkLight} />
                </Pressable>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No hay movimientos de capital registrados.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL MOVIMIENTO DE CAPITAL */}
      <NewCapitalMovementModal
        visible={movementModalVisible}
        onClose={() => setMovementModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#FFFFFF',
  },
  title: {
    ...type.titleLarge,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  monthPickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  profitHeroCard: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radii.xl,
    padding: spacing[4] + 2,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  profitHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  profitBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  profitPeriodText: {
    ...type.caption,
    color: colors.primaryDeep,
    textTransform: 'capitalize',
  },
  profitAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 32,
    color: colors.primaryDark,
    marginVertical: 4,
  },
  profitSub: {
    ...type.caption,
    color: colors.primaryDeep,
    lineHeight: 18,
  },
  capitalSplitRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  capitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  capitalCardStreet: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.accentSoft,
  },
  capitalCardRecovered: {
    backgroundColor: '#FFFFFF',
  },
  capitalCardLabel: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  capitalCardValue: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.accentDark,
  },
  capitalCardSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  sectionCardTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginBottom: spacing[3],
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  methodBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  methodName: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  methodAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  btnAddMovement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  btnAddMovementText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  paymentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  paymentClientName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  paymentDate: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  paymentTotal: {
    fontFamily: fonts.titleBold,
    fontSize: 17,
    color: colors.ink,
  },
  paymentBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing[2] + 2,
    borderRadius: radii.md,
    marginTop: 6,
  },
  paymentInterestPart: {
    ...type.micro,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  paymentCapitalPart: {
    ...type.micro,
    fontFamily: fonts.bold,
    color: colors.accentDark,
  },
  deletePaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  deletePaymentText: {
    ...type.micro,
    color: colors.danger,
  },
  baseCapitalSummaryBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  baseCapitalCol: {
    flex: 1,
  },
  baseCapitalLabel: {
    ...type.micro,
    color: colors.inkMuted,
  },
  baseCapitalVal: {
    fontFamily: fonts.titleBold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 2,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[3] + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  movementIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  movementIconIn: {
    backgroundColor: colors.primarySoft,
  },
  movementIconOut: {
    backgroundColor: colors.pinkSoft,
  },
  movementTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  movementSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  movementAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyCardText: {
    ...type.bodyMedium,
    color: colors.inkMuted,
  },
});
