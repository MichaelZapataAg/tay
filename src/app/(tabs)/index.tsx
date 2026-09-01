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
import { useRouter } from 'expo-router';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  HandCoins,
  ChevronRight,
} from 'lucide-react-native';
import { useDashboardSummary } from '@/features/summary/hooks';
import { LoanWithDetails } from '@/db/queries/loans';
import { NewLoanModal } from '@/features/loans/NewLoanModal';
import { RecordPaymentModal } from '@/features/payments/RecordPaymentModal';
import { LoanDetailModal } from '@/features/loans/LoanDetailModal';
import { sendPaymentReminder } from '@/lib/whatsapp';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { money, dateLong, percent, frequencyShort } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: summary, refetch, isRefetching } = useDashboardSummary();

  const [newLoanModalVisible, setNewLoanModalVisible] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanWithDetails | null>(null);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<LoanWithDetails | null>(null);

  const handleOpenWhatsApp = (loan: LoanWithDetails) => {
    if (!loan.clientPhone) return;
    haptic.selection();
    sendPaymentReminder({
      clientName: loan.clientName,
      phone: loan.clientPhone,
      interestAmount: loan.interestAmountPerPeriod,
      nextDueDate: loan.nextDueDate,
      notes: loan.notes,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER SUPERIOR CON BOTÓN NUEVO PRÉSTAMO INTEGRADO */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Hola Tay</Text>
            <Sparkles size={16} color={colors.pink} style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.appTitle}>Cobranzas & Préstamos</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              haptic.selection();
              setNewLoanModalVisible(true);
            }}
            style={styles.headerBtnPrestar}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={styles.headerBtnPrestarText}>Prestar</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              haptic.selection();
              router.push('/ajustes');
            }}
            hitSlop={12}
            style={styles.settingsButton}
          >
            <Settings size={20} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* BANNER CTA DIRECTO DE NUEVO PRÉSTAMO */}
        <Pressable
          onPress={() => {
            haptic.selection();
            setNewLoanModalVisible(true);
          }}
          style={styles.ctaBanner}
        >
          <View style={styles.ctaIconBox}>
            <HandCoins size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>+ Prestar Plata</Text>
            <Text style={styles.ctaSubtitle}>Registrar nuevo préstamo, tasa y corte</Text>
          </View>
          <View style={styles.ctaArrowBox}>
            <Plus size={18} color={colors.primaryDark} />
          </View>
        </Pressable>

        {/* HERO METRICS EN PASTEL */}
        <View style={styles.heroRow}>
          {/* Tarjeta 1: Cobros de Hoy (Durazno / Melocotón pastel) */}
          <View style={[styles.heroCard, styles.heroCardToday]}>
            <View style={styles.heroCardHeader}>
              <Text style={styles.heroCardTitle}>Cobros de Hoy</Text>
              <View style={styles.heroBadgeToday}>
                <Text style={styles.heroBadgeTodayText}>
                  {summary?.todayCount || 0} {summary?.todayCount === 1 ? 'pago' : 'pagos'}
                </Text>
              </View>
            </View>
            <Text style={styles.heroCardAmount}>
              {money(summary?.todayTotalInterest || 0)}
            </Text>
            <Text style={styles.heroCardSub}>en intereses para hoy</Text>
          </View>

          {/* Tarjeta 2: En Mora (Rosa pastel suave) */}
          <View style={[styles.heroCard, styles.heroCardDue]}>
            <View style={styles.heroCardHeader}>
              <Text style={styles.heroCardTitle}>En Mora</Text>
              <View style={styles.heroBadgeDue}>
                <Text style={styles.heroBadgeDueText}>
                  {summary?.overdueCount || 0} {summary?.overdueCount === 1 ? 'cliente' : 'clientes'}
                </Text>
              </View>
            </View>
            <Text style={[styles.heroCardAmount, { color: colors.due }]}>
              {money(summary?.overdueTotalInterest || 0)}
            </Text>
            <Text style={styles.heroCardSub}>intereses atrasados</Text>
          </View>
        </View>

        {/* RESUMEN DE CAPITAL EN CALLE Y GANANCIA (Lila & Celeste) */}
        <View style={styles.capitalOverviewBar}>
          <View style={styles.overviewItem}>
            <View style={styles.overviewTag}>
              <Wallet size={14} color={colors.accentDark} style={{ marginRight: 4 }} />
              <Text style={styles.overviewLabel}>Capital en calle</Text>
            </View>
            <Text style={styles.overviewValue}>{money(summary?.capitalInStreet || 0)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <View style={styles.overviewTag}>
              <TrendingUp size={14} color={colors.primaryDark} style={{ marginRight: 4 }} />
              <Text style={styles.overviewLabel}>Ganancia del mes</Text>
            </View>
            <Text style={[styles.overviewValue, { color: colors.primaryDark }]}>
              +{money(summary?.monthInterestEarned || 0)}
            </Text>
          </View>
        </View>

        {/* SECCIÓN 1: COBROS DE HOY */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            ✨ Toca cobrar hoy ({summary?.todayLoans?.length || 0})
          </Text>
        </View>

        {summary?.todayLoans && summary.todayLoans.length > 0 ? (
          summary.todayLoans.map((loan) => (
            <LoanActionCard
              key={loan.id}
              loan={loan}
              onPress={() => {
                haptic.selection();
                setSelectedLoanDetail(loan);
              }}
              onCobrar={() => {
                haptic.selection();
                setSelectedLoanForPayment(loan);
              }}
              onWhatsApp={() => handleOpenWhatsApp(loan)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <CheckCircle2 size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyCardText}>¡Al día! No hay cobros pendientes para hoy.</Text>
          </View>
        )}

        {/* SECCIÓN 2: EN MORA / ATRASADOS */}
        {summary?.overdueLoans && summary.overdueLoans.length > 0 ? (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: spacing[6] }]}>
              <Text style={[styles.sectionTitle, { color: colors.due }]}>
                🌸 Atrasados ({summary.overdueLoans.length})
              </Text>
            </View>

            {summary.overdueLoans.map((loan) => (
              <LoanActionCard
                key={loan.id}
                loan={loan}
                onPress={() => {
                  haptic.selection();
                  setSelectedLoanDetail(loan);
                }}
                onCobrar={() => {
                  haptic.selection();
                  setSelectedLoanForPayment(loan);
                }}
                onWhatsApp={() => handleOpenWhatsApp(loan)}
              />
            ))}
          </>
        ) : null}

        {/* SECCIÓN 3: PRÓXIMOS COBROS (7 DÍAS) */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing[6] }]}>
          <Text style={styles.sectionTitle}>
            🗓️ Próximos cobros ({summary?.upcomingLoans?.length || 0})
          </Text>
        </View>

        {summary?.upcomingLoans && summary.upcomingLoans.length > 0 ? (
          summary.upcomingLoans.map((loan) => (
            <LoanActionCard
              key={loan.id}
              loan={loan}
              onPress={() => {
                haptic.selection();
                setSelectedLoanDetail(loan);
              }}
              onCobrar={() => {
                haptic.selection();
                setSelectedLoanForPayment(loan);
              }}
              onWhatsApp={() => handleOpenWhatsApp(loan)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.accentSoft }]}>
              <Calendar size={24} color={colors.accentDark} />
            </View>
            <Text style={styles.emptyCardText}>No hay cobros en los próximos 7 días.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL NUEVO PRÉSTAMO */}
      <NewLoanModal
        visible={newLoanModalVisible}
        onClose={() => setNewLoanModalVisible(false)}
      />

      {/* MODAL DETALLE DE PRÉSTAMO */}
      <LoanDetailModal
        visible={!!selectedLoanDetail}
        loan={selectedLoanDetail}
        onClose={() => setSelectedLoanDetail(null)}
        onCobrar={() => {
          const l = selectedLoanDetail;
          setSelectedLoanDetail(null);
          if (l) setSelectedLoanForPayment(l);
        }}
      />

      {/* MODAL REGISTRAR COBRO */}
      <RecordPaymentModal
        visible={!!selectedLoanForPayment}
        loan={selectedLoanForPayment}
        onClose={() => setSelectedLoanForPayment(null)}
      />
    </View>
  );
}

function LoanActionCard({
  loan,
  onPress,
  onCobrar,
  onWhatsApp,
}: {
  loan: LoanWithDetails;
  onPress: () => void;
  onCobrar: () => void;
  onWhatsApp: () => void;
}) {
  const isToday = loan.dueStatus === 'today';
  const isDue = loan.dueStatus === 'due';

  const badgeBg = isToday ? colors.todaySoft : isDue ? colors.dueSoft : colors.primarySoft;
  const badgeBorder = isToday ? colors.todayBorder : isDue ? colors.dueBorder : colors.primarySoft;
  const badgeTextColor = isToday ? colors.todayDark : isDue ? colors.dueDark : colors.primaryDark;

  const dueLabel = isToday
    ? '✨ Cobra hoy'
    : isDue
    ? `Vencido ${Math.abs(loan.diffDays)}d`
    : `En ${loan.diffDays}d (${dateLong(loan.nextDueDate)})`;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.loanCard, isToday && styles.loanCardToday, isDue && styles.loanCardDue]}
    >
      {/* Top row */}
      <View style={styles.loanCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{loan.clientName}</Text>
          {loan.clientAlias ? <Text style={styles.clientAlias}>{loan.clientAlias}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.dueBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={[styles.dueBadgeText, { color: badgeTextColor }]}>{dueLabel}</Text>
          </View>
          <ChevronRight size={16} color={colors.inkLight} />
        </View>
      </View>

      {/* Middle row: Montos con pastel styling */}
      <View style={styles.loanCardMiddle}>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Interés a cobrar:</Text>
          <Text style={styles.interestAmount}>{money(loan.interestAmountPerPeriod)}</Text>
        </View>
        <View style={styles.amountColRight}>
          <Text style={styles.amountLabel}>Capital restante:</Text>
          <Text style={styles.capitalAmount}>
            {money(loan.currentCapital)} ({percent(loan.interestRate)} {frequencyShort(loan.paymentFrequency, loan.frequencyDays)})
          </Text>
        </View>
      </View>

      {/* Bottom row: Botones de Acción */}
      <View style={styles.loanCardActions}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onCobrar();
          }}
          style={styles.btnCobrar}
        >
          <Text style={styles.btnCobrarText}>Registrar Cobro</Text>
        </Pressable>

        {loan.clientPhone ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onWhatsApp();
            }}
            style={styles.btnWhatsApp}
          >
            <MessageCircle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnWhatsAppText}>WhatsApp</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    ...type.bodyBold,
    color: colors.primaryDark,
    fontSize: 14,
  },
  appTitle: {
    ...type.title,
    color: colors.ink,
    fontSize: 18,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerBtnPrestar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing[2] + 1,
    paddingHorizontal: spacing[3] + 2,
    borderRadius: radii.full,
    ...shadows.sm,
  },
  headerBtnPrestarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: spacing[2] + 2,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: 120,
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  ctaTitle: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  ctaSubtitle: {
    ...type.caption,
    color: colors.primaryDeep,
    marginTop: 1,
  },
  ctaArrowBox: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    ...shadows.sm,
  },
  heroCardToday: {
    borderColor: colors.todayBorder,
    backgroundColor: '#FFFDF9',
  },
  heroCardDue: {
    borderColor: colors.dueBorder,
    backgroundColor: '#FFF9FA',
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  heroCardTitle: {
    fontFamily: fonts.titleBold,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  heroBadgeToday: {
    backgroundColor: colors.todaySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  heroBadgeTodayText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.todayDark,
  },
  heroBadgeDue: {
    backgroundColor: colors.dueSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  heroBadgeDueText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.dueDark,
  },
  heroCardAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 22,
    color: colors.todayDark,
    marginVertical: 4,
  },
  heroCardSub: {
    ...type.micro,
    color: colors.inkMuted,
  },
  capitalOverviewBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[5],
    ...shadows.sm,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[2],
  },
  overviewLabel: {
    ...type.micro,
    color: colors.inkMuted,
  },
  overviewValue: {
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
    fontSize: 17,
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  loanCardToday: {
    borderColor: colors.today,
    borderWidth: 1.5,
  },
  loanCardDue: {
    borderColor: colors.due,
    borderWidth: 1.5,
  },
  loanCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  clientName: {
    ...type.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
  clientAlias: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dueBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  loanCardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  amountCol: {
    flex: 1,
  },
  amountColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountLabel: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  interestAmount: {
    fontFamily: fonts.titleBold,
    fontSize: 17,
    color: colors.primaryDark,
  },
  capitalAmount: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  loanCardActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  btnCobrar: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  btnCobrarText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  btnWhatsApp: {
    flexDirection: 'row',
    backgroundColor: colors.whatsappDark,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  btnWhatsAppText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing[2],
    ...shadows.sm,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    ...type.bodyMedium,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
