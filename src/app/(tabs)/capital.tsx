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
  AlertCircle,
  RotateCcw,
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
  const [defaultMovementType, setDefaultMovementType] = useState<
    'inyeccion' | 'gasto_capital' | 'reposicion_capital' | 'retiro_utilidad' | 'retiro_capital'
  >('inyeccion');

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

  const openModalWithType = (t: 'inyeccion' | 'gasto_capital' | 'reposicion_capital' | 'retiro_utilidad' | 'retiro_capital') => {
    haptic.selection();
    setDefaultMovementType(t);
    setMovementModalVisible(true);
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
        {/* HERO 1: TU GANANCIA REAL (INTERESES) */}
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

        {/* ALERTA DE GASTOS PENDIENTES POR REPONER AL CAPITAL */}
        {(metrics?.pendingToRestore || 0) > 0 ? (
          <View style={styles.debtAlertCard}>
            <View style={styles.debtAlertHeader}>
              <View style={styles.debtAlertBadge}>
                <AlertCircle size={16} color={colors.dueDark} style={{ marginRight: 4 }} />
                <Text style={styles.debtAlertTitle}>Gastos pendientes por reponer</Text>
              </View>
              <Pressable
                onPress={() => openModalWithType('reposicion_capital')}
                style={styles.btnReponerHeader}
              >
                <RotateCcw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnReponerHeaderText}>Reponer</Text>
              </Pressable>
            </View>
            <Text style={styles.debtAlertAmount}>{money(metrics?.pendingToRestore || 0)}</Text>
            <Text style={styles.debtAlertSub}>
              Sacaste este dinero de tu fondo para gastos. Al reponerlo, tu capital disponible vuelve a cuadrar.
            </Text>
          </View>
        ) : null}

        {/* CUADRE GENERAL DEL FONDO DE CAPITAL */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>💰 Estado de tu Capital</Text>
        </View>

        <View style={styles.capitalGrid}>
          {/* Fondo Total Activo */}
          <View style={styles.capitalGridItem}>
            <Text style={styles.capitalGridLabel}>Fondo Total:</Text>
            <Text style={styles.capitalGridVal}>{money(metrics?.netCapitalBase || 0)}</Text>
            <Text style={styles.capitalGridSub}>Capital total propio</Text>
          </View>

          {/* Capital Disponible en Caja */}
          <View style={[styles.capitalGridItem, { backgroundColor: colors.todaySoft, borderColor: colors.todayBorder }]}>
            <Text style={[styles.capitalGridLabel, { color: colors.todayDark }]}>Disponible en Caja:</Text>
            <Text style={[styles.capitalGridVal, { color: colors.todayDark }]}>{money(metrics?.capitalInBox || 0)}</Text>
            <Text style={[styles.capitalGridSub, { color: colors.todayDark }]}>Listo para prestar</Text>
          </View>

          {/* Capital en la Calle */}
          <View style={[styles.capitalGridItem, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Text style={[styles.capitalGridLabel, { color: '#0369A1' }]}>En la Calle:</Text>
            <Text style={[styles.capitalGridVal, { color: '#0369A1' }]}>{money(metrics?.capitalInStreet || 0)}</Text>
            <Text style={[styles.capitalGridSub, { color: '#0369A1' }]}>Prestado a clientes</Text>
          </View>

          {/* Capital Recuperado este Mes */}
          <View style={[styles.capitalGridItem, { backgroundColor: colors.primarySubtle, borderColor: colors.primarySoft }]}>
            <Text style={[styles.capitalGridLabel, { color: colors.primaryDark }]}>Recuperado este mes:</Text>
            <Text style={[styles.capitalGridVal, { color: colors.primaryDark }]}>{money(metrics?.capitalCollectedMonth || 0)}</Text>
            <Text style={[styles.capitalGridSub, { color: colors.primaryDark }]}>Retornó a tu caja</Text>
          </View>
        </View>

        {/* ACCIONES DE CAPITAL (DISTRIBUCIÓN ELEGANTE Y ESPACIOSA) */}
        <View style={styles.actionContainer}>
          {/* Botón Principal: + Inyectar Capital */}
          <Pressable
            onPress={() => openModalWithType('inyeccion')}
            style={styles.btnPrimaryInyectar}
          >
            <View style={styles.btnPrimaryInyectarIcon}>
              <Plus size={18} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.btnPrimaryInyectarTitle}>+ Inyectar Capital</Text>
              <Text style={styles.btnPrimaryInyectarSub}>Aportar dinero a mi fondo para prestar</Text>
            </View>
          </Pressable>

          {/* Fila con 2 tarjetas de acciones: Gasto vs Reponer */}
          <View style={styles.actionCardsRow}>
            {/* Gasto a reponer */}
            <Pressable
              onPress={() => openModalWithType('gasto_capital')}
              style={styles.actionSubCardGasto}
            >
              <View style={styles.actionSubCardIconGasto}>
                <ArrowDownLeft size={18} color={colors.dueDark} />
              </View>
              <Text style={styles.actionSubCardTitleGasto}>Gasto a Reponer</Text>
              <Text style={styles.actionSubCardSubGasto}>Sacar del fondo</Text>
            </Pressable>

            {/* Reponer capital */}
            <Pressable
              onPress={() => openModalWithType('reposicion_capital')}
              style={styles.actionSubCardReponer}
            >
              <View style={styles.actionSubCardIconReponer}>
                <RotateCcw size={18} color={colors.todayDark} />
              </View>
              <Text style={styles.actionSubCardTitleReponer}>Reponer Dinero</Text>
              <Text style={styles.actionSubCardSubReponer}>Devolver al fondo</Text>
            </Pressable>
          </View>

          {/* Botón Secundario: Retirar Ganancia */}
          <Pressable
            onPress={() => openModalWithType('retiro_utilidad')}
            style={styles.btnRetirarGanancia}
          >
            <Coins size={16} color={colors.inkSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.btnRetirarGananciaText}>Retirar Ganancias de Intereses</Text>
          </Pressable>
        </View>

        {/* DESGLOSE POR MEDIO DE PAGO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>💳 Recaudos por Medio de Pago en {formatPeriod(selectedPeriod)}</Text>
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

        {/* MOVIMIENTOS DE CAPITAL DE TAY */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing[6] }]}>
          <Text style={styles.sectionTitle}>🏦 Historial de Movimientos del Capital</Text>
          <Pressable
            onPress={() => openModalWithType('inyeccion')}
            style={styles.btnAddMovement}
          >
            <Plus size={16} color={colors.primaryDark} style={{ marginRight: 4 }} />
            <Text style={styles.btnAddMovementText}>Nuevo</Text>
          </Pressable>
        </View>

        {movements.length > 0 ? (
          movements.map((m) => {
            const isInyeccion = m.type === 'inyeccion';
            const isGasto = m.type === 'gasto_capital';
            const isReposicion = m.type === 'reposicion_capital';
            const isRetiroUtilidad = m.type === 'retiro_utilidad';

            let tagLabel = 'Inyección de Capital';
            let tagColor = colors.primarySoft;
            let tagTextColor = colors.primaryDark;
            let sign = '+';

            if (isGasto) {
              tagLabel = 'Gasto del Capital (a reponer)';
              tagColor = colors.dueSoft;
              tagTextColor = colors.dueDark;
              sign = '-';
            } else if (isReposicion) {
              tagLabel = 'Reposición de Capital';
              tagColor = colors.todaySoft;
              tagTextColor = colors.todayDark;
              sign = '+';
            } else if (isRetiroUtilidad) {
              tagLabel = 'Retiro de Ganancias';
              tagColor = colors.surfaceSubtle;
              tagTextColor = colors.inkSecondary;
              sign = '-';
            } else if (m.type === 'retiro_capital') {
              tagLabel = 'Retiro de Capital';
              tagColor = colors.surfaceSubtle;
              tagTextColor = colors.danger;
              sign = '-';
            }

            return (
              <View key={m.id} style={styles.movementItem}>
                <View
                  style={[
                    styles.movementIconBox,
                    { backgroundColor: tagColor },
                  ]}
                >
                  {sign === '+' ? (
                    <ArrowDownLeft size={18} color={tagTextColor} />
                  ) : (
                    <ArrowUpRight size={18} color={tagTextColor} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.movementType}>{tagLabel}</Text>
                  <Text style={styles.movementDate}>{dateLong(m.date)}</Text>
                  {m.notes ? <Text style={styles.movementNotes}>{m.notes}</Text> : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.movementAmount,
                      { color: sign === '+' ? colors.primaryDark : colors.dueDark },
                    ]}
                  >
                    {sign}{money(m.amount)}
                  </Text>

                  <Pressable
                    onPress={async () => {
                      haptic.selection();
                      await deleteMovementMutation.mutateAsync(m.id);
                    }}
                    hitSlop={8}
                    style={{ marginTop: 4 }}
                  >
                    <Trash2 size={14} color={colors.inkLight} />
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No hay movimientos de capital registrados.</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL PARA NUEVO MOVIMIENTO */}
      <NewCapitalMovementModal
        visible={movementModalVisible}
        defaultType={defaultMovementType}
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
    paddingBottom: 140,
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
    ...type.micro,
    color: colors.primaryDeep,
  },
  profitAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 32,
    color: colors.primaryDark,
    marginVertical: spacing[1],
  },
  profitSub: {
    ...type.caption,
    color: colors.primaryDeep,
    lineHeight: 18,
  },
  debtAlertCard: {
    backgroundColor: '#FFF9FA',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    borderColor: colors.dueBorder,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  debtAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  debtAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtAlertTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.dueDark,
  },
  btnReponerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.due,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  btnReponerHeaderText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  debtAlertAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 24,
    color: colors.dueDark,
    marginBottom: 4,
  },
  debtAlertSub: {
    ...type.micro,
    color: colors.dueDark,
    lineHeight: 16,
  },
  capitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  capitalGridItem: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  capitalGridLabel: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  capitalGridVal: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.ink,
  },
  capitalGridSub: {
    ...type.micro,
    color: colors.inkLight,
    marginTop: 2,
  },
  actionContainer: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  btnPrimaryInyectar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    borderRadius: radii.xl,
    gap: spacing[3],
    ...shadows.sm,
  },
  btnPrimaryInyectarIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryInyectarTitle: {
    fontFamily: fonts.titleBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  btnPrimaryInyectarSub: {
    ...type.micro,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionSubCardGasto: {
    flex: 1,
    backgroundColor: '#FFF9FA',
    borderWidth: 1.5,
    borderColor: colors.dueBorder,
    borderRadius: radii.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionSubCardIconGasto: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.dueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionSubCardTitleGasto: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.dueDark,
    textAlign: 'center',
  },
  actionSubCardSubGasto: {
    ...type.micro,
    color: colors.dueDark,
    marginTop: 2,
    textAlign: 'center',
  },
  actionSubCardReponer: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: colors.todayBorder,
    borderRadius: radii.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionSubCardIconReponer: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.todaySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionSubCardTitleReponer: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.todayDark,
    textAlign: 'center',
  },
  actionSubCardSubReponer: {
    ...type.micro,
    color: colors.todayDark,
    marginTop: 2,
    textAlign: 'center',
  },
  btnRetirarGanancia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  btnRetirarGananciaText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...type.title,
    color: colors.ink,
  },
  btnAddMovement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  btnAddMovementText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
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
    borderRadius: radii.md,
    padding: spacing[3],
  },
  methodName: {
    ...type.caption,
    color: colors.inkMuted,
  },
  methodAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 2,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
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
    marginBottom: spacing[2],
  },
  paymentClientName: {
    ...type.bodyBold,
    color: colors.ink,
  },
  paymentDate: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 1,
  },
  paymentTotal: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  paymentBreakdownRow: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    marginBottom: spacing[2],
  },
  paymentInterestPart: {
    ...type.micro,
    color: colors.primaryDark,
    fontFamily: fonts.bold,
  },
  paymentCapitalPart: {
    ...type.micro,
    color: colors.inkSecondary,
  },
  deletePaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  deletePaymentText: {
    ...type.micro,
    color: colors.danger,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[2],
    gap: spacing[3],
    ...shadows.sm,
  },
  movementIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementType: {
    ...type.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  movementDate: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 1,
  },
  movementNotes: {
    ...type.micro,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  movementAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
  emptyCardText: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
