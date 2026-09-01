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
  Search,
  Plus,
  HandCoins,
  MessageCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { useLoans, useDeleteLoan } from '@/features/loans/hooks';
import { LoanWithDetails } from '@/db/queries/loans';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Segmented';
import { Badge } from '@/components/ui/Badge';
import { NewLoanModal } from '@/features/loans/NewLoanModal';
import { RecordPaymentModal } from '@/features/payments/RecordPaymentModal';
import { LoanDetailModal } from '@/features/loans/LoanDetailModal';
import { sendPaymentReminder } from '@/lib/whatsapp';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { money, percent, dateLong, frequencyLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function PrestamosScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'today' | 'due' | 'upcoming' | 'pagado'>('todos');

  const { data: allLoans = [], refetch, isRefetching } = useLoans({
    search,
  });

  const [newLoanModalVisible, setNewLoanModalVisible] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanWithDetails | null>(null);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<LoanWithDetails | null>(null);

  // Filtrado
  const filteredLoans = allLoans.filter((l) => {
    if (activeFilter === 'todos') return l.status === 'activo';
    if (activeFilter === 'today') return l.status === 'activo' && l.dueStatus === 'today';
    if (activeFilter === 'due') return l.status === 'activo' && l.dueStatus === 'due';
    if (activeFilter === 'upcoming') return l.status === 'activo' && l.dueStatus === 'upcoming';
    if (activeFilter === 'pagado') return l.status === 'pagado';
    return true;
  });

  const todayCount = allLoans.filter((l) => l.status === 'activo' && l.dueStatus === 'today').length;
  const dueCount = allLoans.filter((l) => l.status === 'activo' && l.dueStatus === 'due').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER CON BOTÓN NUEVO PRÉSTAMO INTEGRADO */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Préstamos</Text>
          <Text style={styles.subtitle}>
            {allLoans.filter((l) => l.status === 'activo').length} activos en total
          </Text>
        </View>

        <Pressable
          onPress={() => {
            haptic.selection();
            setNewLoanModalVisible(true);
          }}
          style={styles.headerBtnPrestar}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.headerBtnPrestarText}>Nuevo Préstamo</Text>
        </Pressable>
      </View>

      {/* BUSCADOR Y FILTROS CON AIRE */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar por cliente o notas..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.inkLight} />}
          containerStyle={{ marginBottom: spacing[3] }}
        />

        <Segmented
          value={activeFilter}
          onChange={(val) => setActiveFilter(val as any)}
          options={[
            { value: 'todos', label: 'Activos' },
            { value: 'today', label: 'Hoy', count: todayCount, badgeVariant: 'today' },
            { value: 'due', label: 'Mora', count: dueCount, badgeVariant: 'due' },
            { value: 'pagado', label: 'Pagados' },
          ]}
        />
      </View>

      {/* LISTA DE PRÉSTAMOS */}
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
        {filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => (
            <LoanCard
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
              onWhatsApp={() => {
                if (!loan.clientPhone) return;
                haptic.selection();
                sendPaymentReminder({
                  clientName: loan.clientName,
                  phone: loan.clientPhone,
                  interestAmount: loan.interestAmountPerPeriod,
                  nextDueDate: loan.nextDueDate,
                  notes: loan.notes,
                });
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <HandCoins size={32} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No hay préstamos en esta categoría</Text>
            <Text style={styles.emptySub}>
              {search ? 'No se encontraron resultados para tu búsqueda.' : 'Crea un nuevo préstamo con el botón de arriba.'}
            </Text>
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

function LoanCard({
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
  const isPaid = loan.status === 'pagado';
  const isToday = loan.status === 'activo' && loan.dueStatus === 'today';
  const isDue = loan.status === 'activo' && loan.dueStatus === 'due';

  const progressPercent = Math.min(
    100,
    Math.round(((loan.initialAmount - loan.currentCapital) / loan.initialAmount) * 100),
  );

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, isToday && styles.cardToday, isDue && styles.cardDue]}
    >
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardClientName}>{loan.clientName}</Text>
          {loan.clientAlias ? <Text style={styles.cardClientAlias}>{loan.clientAlias}</Text> : null}
        </View>
        <Badge
          label={
            isPaid
              ? '✨ Pagado'
              : isToday
              ? '✨ Cobra hoy'
              : isDue
              ? `Vencido ${Math.abs(loan.diffDays)}d`
              : `Cobra en ${loan.diffDays}d`
          }
          variant={isPaid ? 'paid' : isToday ? 'today' : isDue ? 'due' : 'upcoming'}
        />
      </View>

      {/* Financial Details */}
      <View style={styles.cardStatsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Capital actual:</Text>
          <Text style={styles.statValueCapital}>{money(loan.currentCapital)}</Text>
          {loan.currentCapital < loan.initialAmount ? (
            <Text style={styles.statSub}>Original: {money(loan.initialAmount)}</Text>
          ) : null}
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Interés por corte:</Text>
          <Text style={styles.statValueInterest}>{money(loan.interestAmountPerPeriod)}</Text>
          <Text style={styles.statSub}>
            {percent(loan.interestRate)} ({frequencyLabel(loan.paymentFrequency, loan.frequencyDays)})
          </Text>
        </View>
      </View>

      {/* Progress Bar of Capital */}
      {loan.initialAmount > 0 ? (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Abonado: {money(loan.totalPaidCapital)}</Text>
            <Text style={styles.progressLabel}>Ganancia: {money(loan.totalPaidInterest)}</Text>
          </View>
        </View>
      ) : null}

      {/* Dates Row */}
      <View style={styles.datesRow}>
        <Text style={styles.dateText}>📅 Inicio: {dateLong(loan.startDate)}</Text>
        {!isPaid ? (
          <Text style={[styles.dateText, isDue && { color: colors.due, fontFamily: fonts.bold }]}>
            ⏰ Próximo corte: {dateLong(loan.nextDueDate)}
          </Text>
        ) : null}
      </View>

      {/* Actions */}
      {!isPaid ? (
        <View style={styles.cardActions}>
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
              <MessageCircle size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.btnWhatsAppText}>WhatsApp</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  cardToday: {
    borderColor: colors.today,
    borderWidth: 1.5,
  },
  cardDue: {
    borderColor: colors.due,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  cardClientName: {
    ...type.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
  cardClientAlias: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  cardStatsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  statValueCapital: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.ink,
  },
  statValueInterest: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  statSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: spacing[3],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...type.micro,
    color: colors.inkMuted,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing[3],
  },
  dateText: {
    ...type.micro,
    color: colors.inkSecondary,
  },
  cardActions: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...type.title,
    color: colors.ink,
    marginTop: spacing[2],
  },
  emptySub: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
