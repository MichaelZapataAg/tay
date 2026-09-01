import React, { useState } from 'react';
import {
  Linking,
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
  Users,
  MessageCircle,
  Phone,
  HandCoins,
  ChevronRight,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { useClients, useClientDetail, useDeleteClient } from '@/features/clients/hooks';
import { ClientWithDebt } from '@/db/queries/clients';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { NewClientModal } from '@/features/clients/NewClientModal';
import { NewLoanModal } from '@/features/loans/NewLoanModal';
import { sanitizePhone, openWhatsApp } from '@/lib/whatsapp';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { money, dateLong } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function ClientesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data: clientsList = [], refetch, isRefetching } = useClients(search);
  const deleteClientMutation = useDeleteClient();

  const [newClientModalVisible, setNewClientModalVisible] = useState(false);
  const [newLoanForClientId, setNewLoanForClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: clientDetail } = useClientDetail(selectedClientId);

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    haptic.selection();
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone?: string | null, clientName?: string) => {
    if (!phone) return;
    haptic.selection();
    openWhatsApp(phone, `Hola ${clientName || ''}, ¿cómo estás?`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER CON BOTÓN NUEVO CLIENTE INTEGRADO */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>
            {clientsList.length} {clientsList.length === 1 ? 'persona registrada' : 'personas registradas'}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            haptic.selection();
            setNewClientModalVisible(true);
          }}
          style={styles.headerBtnPrestar}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.headerBtnPrestarText}>Nuevo Cliente</Text>
        </Pressable>
      </View>

      {/* BUSCADOR CON AIRE */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar por nombre, alias o teléfono..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.inkLight} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* LISTA */}
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
        {clientsList.length > 0 ? (
          clientsList.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onPress={() => {
                haptic.selection();
                setSelectedClientId(client.id);
              }}
              onPrestar={() => {
                haptic.selection();
                setNewLoanForClientId(client.id);
              }}
              onWhatsApp={() => handleWhatsApp(client.phone, client.name)}
              onCall={() => handleCall(client.phone)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Users size={32} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No hay clientes registrados</Text>
            <Text style={styles.emptySub}>
              {search ? 'No se encontraron coincidencias.' : 'Registra a tus clientes con el botón de arriba.'}
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL NUEVO CLIENTE */}
      <NewClientModal
        visible={newClientModalVisible}
        onClose={() => setNewClientModalVisible(false)}
      />

      {/* MODAL NUEVO PRÉSTAMO PRESELECCIONADO */}
      <NewLoanModal
        visible={!!newLoanForClientId}
        preselectedClientId={newLoanForClientId || undefined}
        onClose={() => setNewLoanForClientId(null)}
      />

      {/* MODAL DETALLE DE CLIENTE */}
      <ClientDetailModal
        visible={!!selectedClientId}
        detail={clientDetail}
        onClose={() => setSelectedClientId(null)}
        onPrestar={() => {
          const cid = selectedClientId;
          setSelectedClientId(null);
          if (cid) setNewLoanForClientId(cid);
        }}
        onDelete={async () => {
          if (selectedClientId) {
            await deleteClientMutation.mutateAsync(selectedClientId);
            setSelectedClientId(null);
          }
        }}
      />
    </View>
  );
}

function ClientCard({
  client,
  onPress,
  onPrestar,
  onWhatsApp,
  onCall,
}: {
  client: ClientWithDebt;
  onPress: () => void;
  onPrestar: () => void;
  onWhatsApp: () => void;
  onCall: () => void;
}) {
  const hasDebt = client.totalCurrentCapital > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.clientCard,
        client.hasTodayLoan && styles.clientCardToday,
        client.hasOverdueLoan && styles.clientCardDue,
      ]}
    >
      <View style={styles.clientCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientNameText}>{client.name}</Text>
          {client.alias ? <Text style={styles.clientAliasText}>{client.alias}</Text> : null}
          {client.phone ? <Text style={styles.clientPhoneText}>📞 {client.phone}</Text> : null}
        </View>

        <Badge
          label={
            client.hasOverdueLoan
              ? '🌸 En mora'
              : client.hasTodayLoan
              ? '✨ Cobra hoy'
              : hasDebt
              ? `${client.activeLoansCount} activo(s)`
              : 'Al día'
          }
          variant={
            client.hasOverdueLoan
              ? 'due'
              : client.hasTodayLoan
              ? 'today'
              : hasDebt
              ? 'accent'
              : 'paid'
          }
        />
      </View>

      {/* Debt overview */}
      {hasDebt ? (
        <View style={styles.debtBox}>
          <View style={styles.debtCol}>
            <Text style={styles.debtLabel}>Capital pendiente:</Text>
            <Text style={styles.debtCapital}>{money(client.totalCurrentCapital)}</Text>
          </View>
          <View style={styles.debtColRight}>
            <Text style={styles.debtLabel}>Interés próximo:</Text>
            <Text style={styles.debtInterest}>{money(client.totalInterestDueSoon)}</Text>
          </View>
        </View>
      ) : null}

      {/* Action Row */}
      <View style={styles.clientActionsRow}>
        <Pressable onPress={onPrestar} style={styles.actionBtnPrestar}>
          <HandCoins size={16} color={colors.primaryDark} style={{ marginRight: 4 }} />
          <Text style={styles.actionBtnPrestarText}>Prestar Plata</Text>
        </Pressable>

        {client.phone ? (
          <>
            <Pressable onPress={onWhatsApp} style={styles.iconActionBtnWhatsApp}>
              <MessageCircle size={18} color={colors.whatsappDark} />
            </Pressable>
            <Pressable onPress={onCall} style={styles.iconActionBtn}>
              <Phone size={18} color={colors.inkSecondary} />
            </Pressable>
          </>
        ) : null}

        <ChevronRight size={18} color={colors.inkLight} style={{ marginLeft: 'auto' }} />
      </View>
    </Pressable>
  );
}

function ClientDetailModal({
  visible,
  detail,
  onClose,
  onPrestar,
  onDelete,
}: {
  visible: boolean;
  detail: any;
  onClose: () => void;
  onPrestar: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!detail || !detail.client) return null;
  const { client, loans = [], payments = [] } = detail;

  const totalCapitalOutstanding = loans
    .filter((l: any) => l.status === 'activo')
    .reduce((sum: number, l: any) => sum + l.currentCapital, 0);

  return (
    <Modal
      visible={visible}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={client.name}
      subtitle={client.alias || 'Ficha del cliente'}
    >
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>Datos de Contacto</Text>
        {client.phone ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Teléfono / WhatsApp:</Text>
            <Text style={styles.detailVal}>{client.phone}</Text>
          </View>
        ) : null}
        {client.address ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dirección:</Text>
            <Text style={styles.detailVal}>{client.address}</Text>
          </View>
        ) : null}
        {client.notes ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notas:</Text>
            <Text style={styles.detailVal}>{client.notes}</Text>
          </View>
        ) : null}
        <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4 }]}>
          <Text style={styles.detailLabel}>Capital actual en deuda:</Text>
          <Text style={[styles.detailVal, { color: colors.primaryDark, fontFamily: fonts.titleBold }]}>
            {money(totalCapitalOutstanding)}
          </Text>
        </View>
      </View>

      {/* Historial de Préstamos */}
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>Préstamos ({loans.length})</Text>
        {loans.length > 0 ? (
          loans.map((l: any) => (
            <View key={l.id} style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyItemTitle}>
                  {money(l.initialAmount)} ({l.interestRate}% {l.paymentFrequency})
                </Text>
                <Text style={styles.historyItemSub}>
                  {dateLong(l.startDate)} • Saldo: {money(l.currentCapital)}
                </Text>
              </View>
              <Badge
                label={l.status === 'pagado' ? 'Pagado' : 'Activo'}
                variant={l.status === 'pagado' ? 'paid' : 'accent'}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistoryText}>Sin préstamos registrados.</Text>
        )}
      </View>

      {/* Historial de Pagos */}
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>Pagos Recibidos ({payments.length})</Text>
        {payments.length > 0 ? (
          payments.map((p: any) => (
            <View key={p.id} style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyItemTitle}>
                  Total: {money(p.totalAmount)}
                </Text>
                <Text style={styles.historyItemSub}>
                  {dateLong(p.date)} • Int: {money(p.interestAmount)} • Cap: {money(p.capitalAmount)} ({p.paymentMethod})
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistoryText}>Sin pagos registrados aún.</Text>
        )}
      </View>

      <Button onPress={onPrestar} size="lg" fullWidth style={{ marginTop: spacing[3] }}>
        + Prestar a {client.name}
      </Button>

      {/* Eliminar cliente */}
      <View style={styles.deleteSection}>
        {confirmDelete ? (
          <View style={styles.confirmDeleteBox}>
            <Text style={styles.confirmDeleteText}>
              ¿Seguro que deseas eliminar o desactivar este cliente?
            </Text>
            <View style={styles.confirmBtnsRow}>
              <Button variant="ghost" size="sm" onPress={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onPress={onDelete}>
                Sí, eliminar
              </Button>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteTrigger}>
            <Trash2 size={16} color={colors.danger} />
            <Text style={styles.deleteTriggerText}>Eliminar cliente</Text>
          </Pressable>
        )}
      </View>
    </Modal>
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
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  clientCardToday: {
    borderColor: colors.today,
    borderWidth: 1.5,
  },
  clientCardDue: {
    borderColor: colors.due,
    borderWidth: 1.5,
  },
  clientCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  clientNameText: {
    ...type.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
  clientAliasText: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  clientPhoneText: {
    ...type.micro,
    color: colors.inkSecondary,
    marginTop: 3,
  },
  debtBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  debtCol: {
    flex: 1,
  },
  debtColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  debtLabel: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  debtCapital: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.ink,
  },
  debtInterest: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  clientActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtnPrestar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  actionBtnPrestarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  iconActionBtnWhatsApp: {
    padding: spacing[2] + 2,
    borderRadius: radii.md,
    backgroundColor: colors.whatsappSoft,
  },
  iconActionBtn: {
    padding: spacing[2] + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing[3],
    borderRadius: radii.md,
    marginBottom: 4,
  },
  historyItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  historyItemSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  emptyHistoryText: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing[2],
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
