import React, { useState, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Switch, TextInput, ScrollView } from 'react-native';
import { Search, Check, User, ChevronDown, UserPlus, X } from 'lucide-react-native';
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
  const [clientSearch, setClientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(!preselectedClientId);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAlias, setNewClientAlias] = useState('');

  const selectedClient = useMemo(() => {
    return clientsList.find((c) => c.id === clientId);
  }, [clientsList, clientId]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clientsList;
    const q = clientSearch.trim().toLowerCase();
    return clientsList.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const aliasMatch = c.alias ? c.alias.toLowerCase().includes(q) : false;
      const phoneMatch = c.phone ? c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) : false;
      return nameMatch || aliasMatch || phoneMatch;
    });
  }, [clientsList, clientSearch]);

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

  // Sincronizar preselectedClientId si cambia o cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (preselectedClientId) {
        setClientId(preselectedClientId);
        setIsNewClient(false);
        setIsDropdownOpen(false);
      } else if (!clientId) {
        setIsDropdownOpen(true);
      }
      setClientSearch('');
    }
  }, [visible, preselectedClientId]);

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
          {/* CLIENTE SELECCIONADO (Tarjeta compacta cuando está seleccionado y dropdown cerrado) */}
          {selectedClient && !isDropdownOpen ? (
            <View style={styles.selectedClientCard}>
              <View style={styles.selectedClientAvatar}>
                <Text style={styles.selectedClientAvatarText}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.selectedClientInfo}>
                <Text style={styles.selectedClientName} numberOfLines={1}>
                  {selectedClient.name}
                </Text>
                <View style={styles.selectedClientMetaRow}>
                  {selectedClient.alias ? (
                    <Text style={styles.selectedClientAlias}>({selectedClient.alias})</Text>
                  ) : null}
                  {selectedClient.phone ? (
                    <Text style={styles.selectedClientPhone}>📞 {selectedClient.phone}</Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={() => {
                  haptic.selection();
                  setIsDropdownOpen(true);
                }}
                style={styles.changeClientBtn}
              >
                <Text style={styles.changeClientBtnText}>Cambiar</Text>
              </Pressable>
            </View>
          ) : (
            /* BUSCADOR Y LISTA ESCROLLEABLE DE CLIENTES */
            <View style={styles.pickerContainer}>
              {/* Barra de búsqueda */}
              <View style={styles.searchBar}>
                <Search size={16} color={colors.inkMuted} style={{ marginRight: spacing[2] }} />
                <TextInput
                  placeholder="Buscar por nombre, alias o celular..."
                  placeholderTextColor={colors.inkLight}
                  value={clientSearch}
                  onChangeText={setClientSearch}
                  style={styles.searchInput}
                  autoCapitalize="words"
                />
                {clientSearch ? (
                  <Pressable
                    onPress={() => setClientSearch('')}
                    hitSlop={8}
                    style={styles.clearSearchBtn}
                  >
                    <X size={14} color={colors.inkMuted} />
                  </Pressable>
                ) : null}
              </View>

              {/* Acceso rápido / Recientes (primeros 6) cuando no hay búsqueda */}
              {!clientSearch.trim() && clientsList.length > 0 && (
                <View style={styles.quickChipsWrapper}>
                  <Text style={styles.quickChipsTitle}>Acceso rápido:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickChipsRow}
                    nestedScrollEnabled
                  >
                    {clientsList.slice(0, 6).map((c) => {
                      const isSelected = c.id === clientId;
                      return (
                        <Pressable
                          key={`quick-${c.id}`}
                          onPress={() => {
                            haptic.selection();
                            setClientId(c.id);
                            setIsDropdownOpen(false);
                            setClientSearch('');
                          }}
                          style={[styles.quickChip, isSelected && styles.quickChipActive]}
                        >
                          <Text
                            style={[styles.quickChipText, isSelected && styles.quickChipTextActive]}
                            numberOfLines={1}
                          >
                            {c.name.split(' ')[0]} {c.alias ? `(${c.alias})` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Lista Escrolleable de Clientes */}
              <View style={styles.scrollableListFrame}>
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={styles.clientsScrollView}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredClients.length > 0 ? (
                    filteredClients.map((c, idx) => {
                      const isSelected = c.id === clientId;
                      const isLast = idx === filteredClients.length - 1;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => {
                            haptic.selection();
                            setClientId(c.id);
                            setIsDropdownOpen(false);
                            setClientSearch('');
                          }}
                          style={[
                            styles.clientItemRow,
                            isSelected && styles.clientItemRowActive,
                            !isLast && styles.clientItemRowBorder,
                          ]}
                        >
                          <View
                            style={[
                              styles.clientItemAvatar,
                              isSelected && styles.clientItemAvatarActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.clientItemAvatarText,
                                isSelected && styles.clientItemAvatarTextActive,
                              ]}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.clientItemInfo}>
                            <Text
                              style={[
                                styles.clientItemName,
                                isSelected && styles.clientItemNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {c.name}
                            </Text>
                            <View style={styles.clientItemMeta}>
                              {c.alias ? (
                                <Text style={styles.clientItemAlias} numberOfLines={1}>
                                  {c.alias}
                                </Text>
                              ) : null}
                              {c.alias && c.phone ? (
                                <Text style={styles.clientItemDot}>•</Text>
                              ) : null}
                              {c.phone ? (
                                <Text style={styles.clientItemPhone}>{c.phone}</Text>
                              ) : null}
                            </View>
                          </View>

                          {isSelected ? (
                            <View style={styles.selectedCheckIcon}>
                              <Check size={16} color={colors.primaryDark} strokeWidth={2.5} />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.emptySearchBox}>
                      <Text style={styles.emptySearchText}>
                        No encontramos a "{clientSearch}"
                      </Text>
                      <Pressable
                        onPress={() => {
                          haptic.selection();
                          setIsNewClient(true);
                          setNewClientName(clientSearch);
                          setClientSearch('');
                          setIsDropdownOpen(false);
                        }}
                        style={styles.createFromSearchBtn}
                      >
                        <UserPlus size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
                        <Text style={styles.createFromSearchText}>
                          Crear "{clientSearch}" como nuevo
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* Botón para colapsar lista si ya hay un cliente seleccionado */}
              {selectedClient && (
                <Pressable
                  onPress={() => setIsDropdownOpen(false)}
                  style={styles.collapseDropdownBtn}
                >
                  <Text style={styles.collapseDropdownText}>Cerrar lista de clientes</Text>
                </Pressable>
              )}
            </View>
          )}
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
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[1],
  },
  selectedClientAvatar: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  selectedClientAvatarText: {
    fontFamily: fonts.titleBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  selectedClientInfo: {
    flex: 1,
    paddingRight: spacing[2],
  },
  selectedClientName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  selectedClientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  selectedClientAlias: {
    ...type.caption,
    color: colors.primaryDark,
    fontFamily: fonts.semiBold,
  },
  selectedClientPhone: {
    ...type.caption,
    color: colors.inkMuted,
  },
  changeClientBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: spacing[3],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  changeClientBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  pickerContainer: {
    marginBottom: spacing[2],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 2,
  },
  clearSearchBtn: {
    padding: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
  },
  quickChipsWrapper: {
    marginBottom: spacing[2],
  },
  quickChipsTitle: {
    ...type.micro,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
  },
  quickChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  quickChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  quickChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  scrollableListFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    maxHeight: 180,
  },
  clientsScrollView: {
    maxHeight: 180,
  },
  clientItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[3],
  },
  clientItemRowActive: {
    backgroundColor: colors.primarySubtle,
  },
  clientItemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  clientItemAvatarActive: {
    backgroundColor: colors.primarySoft,
  },
  clientItemAvatarText: {
    fontFamily: fonts.titleBold,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  clientItemAvatarTextActive: {
    color: colors.primaryDark,
  },
  clientItemInfo: {
    flex: 1,
  },
  clientItemName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  clientItemNameActive: {
    color: colors.primaryDark,
  },
  clientItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientItemAlias: {
    ...type.micro,
    color: colors.primaryDark,
  },
  clientItemDot: {
    ...type.micro,
    color: colors.inkLight,
  },
  clientItemPhone: {
    ...type.micro,
    color: colors.inkMuted,
  },
  selectedCheckIcon: {
    marginLeft: spacing[2],
  },
  emptySearchBox: {
    padding: spacing[4],
    alignItems: 'center',
  },
  emptySearchText: {
    ...type.caption,
    color: colors.inkMuted,
    marginBottom: spacing[2],
  },
  createFromSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  createFromSearchText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  collapseDropdownBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
    marginTop: 4,
  },
  collapseDropdownText: {
    ...type.caption,
    color: colors.primaryDark,
    fontFamily: fonts.semiBold,
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
