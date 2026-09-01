import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import {
  Bell,
  Download,
  Upload,
  ShieldCheck,
  Percent,
  CreditCard,
  User,
  Sparkles,
  Info,
  KeyRound,
  Cloud,
  RefreshCw,
} from 'lucide-react-native';
import { useSettings, saveSettings } from '@/lib/settings';
import { setPin } from '@/features/auth/pinStore';
import { syncAll } from '@/features/sync/cloudSync';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { exportAndShareBackup, restoreBackup } from '@/features/backup/backup';
import { colors } from '@/lib/colors';
import { fonts, radii, spacing, type, shadows } from '@/lib/theme';
import { APP_VERSION, APP_NAME } from '@/lib/version';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/haptics';

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();

  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [paymentAccounts, setPaymentAccounts] = useState(settings.paymentAccounts);
  const [defaultInterestRate, setDefaultInterestRate] = useState(
    String(settings.defaultInterestRate || 15),
  );
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [notificationHour, setNotificationHour] = useState(
    String(settings.notificationHour ?? 8),
  );

  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSave = async () => {
    haptic.selection();
    setIsSaving(true);
    try {
      await saveSettings({
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        paymentAccounts: paymentAccounts.trim(),
        defaultInterestRate: parseFloat(defaultInterestRate) || 15,
        enableNotifications,
        notificationHour: parseInt(notificationHour, 10) || 8,
      });

      if (newPin.trim().length === 4) {
        await setPin(newPin.trim());
        setNewPin('');
        toast.success('Ajustes y PIN guardados');
      } else {
        toast.success('Ajustes guardados');
      }
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloudSync = async () => {
    haptic.selection();
    setIsSyncing(true);
    try {
      await syncAll();
      toast.success('Sincronizado con Supabase');
    } catch (err) {
      toast.error('Error al sincronizar con la nube');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = async () => {
    haptic.selection();
    await exportAndShareBackup();
  };

  const handleImportBackup = async () => {
    try {
      haptic.selection();
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets[0]?.uri) return;

      const fileUri = res.assets[0].uri;
      const file = new File(fileUri);
      const content = await file.text();

      setIsRestoring(true);
      const success = await restoreBackup(content);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (err) {
      toast.error('Error al leer el archivo');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ajustes" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SECCIÓN 1: DATOS DEL NEGOCIO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <User size={18} color={colors.primaryDark} />
            </View>
            <Text style={styles.cardTitle}>Datos de Tay</Text>
          </View>

          <Input
            label="Tu nombre:"
            placeholder="Tay"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <Input
            label="Tu celular:"
            placeholder="Ej. 312 345 6789"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* SECCIÓN 2: SEGURIDAD Y PIN */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.primarySoft }]}>
              <KeyRound size={18} color={colors.primaryDark} />
            </View>
            <Text style={styles.cardTitle}>PIN de Seguridad (Acceso)</Text>
          </View>

          <Input
            label="Cambiar PIN de acceso (4 dígitos):"
            placeholder="Escribe nuevo PIN de 4 dígitos"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            value={newPin}
            onChangeText={setNewPin}
            helperText="PIN actual activo: 0110. Puedes actualizarlo aquí."
          />
        </View>

        {/* SECCIÓN 3: NUBE SUPABASE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.accentSoft }]}>
              <Cloud size={18} color={colors.accentDark} />
            </View>
            <Text style={styles.cardTitle}>Nube Supabase (Sincronización)</Text>
          </View>

          <Text style={styles.backupExplanation}>
            Todos tus préstamos se sincronizan automáticamente con tu base de datos en Supabase para que puedas verlos en la web o en cualquier celular.
          </Text>

          <Button
            onPress={handleCloudSync}
            loading={isSyncing}
            variant="secondary"
            icon={<RefreshCw size={16} color={colors.primaryDark} />}
            fullWidth
          >
            Sincronizar con la nube ahora
          </Button>
        </View>

        {/* SECCIÓN 4: MEDIOS DE PAGO PARA WHATSAPP */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.accentSoft }]}>
              <CreditCard size={18} color={colors.accentDark} />
            </View>
            <Text style={styles.cardTitle}>Medios de Pago (para WhatsApp)</Text>
          </View>

          <Input
            label="Cuentas para recibir pagos:"
            placeholder="Ej. Nequi / Bancolombia: 312 345 6789"
            value={paymentAccounts}
            onChangeText={setPaymentAccounts}
            helperText="Este texto se adjunta automáticamente en los recordatorios de cobro."
            multiline
            numberOfLines={2}
          />
        </View>

        {/* SECCIÓN 5: PREFERENCIAS DE PRÉSTAMO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.pinkSoft }]}>
              <Percent size={18} color={colors.pinkDark} />
            </View>
            <Text style={styles.cardTitle}>Preferencias de Préstamos</Text>
          </View>

          <Input
            label="Porcentaje sugerido por defecto (%):"
            placeholder="15"
            keyboardType="numeric"
            value={defaultInterestRate}
            onChangeText={setDefaultInterestRate}
            helperText="Puedes cambiarlo libremente en cada nuevo préstamo."
          />
        </View>

        {/* SECCIÓN 6: NOTIFICACIONES DE COBRO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.todaySoft }]}>
              <Bell size={18} color={colors.todayDark} />
            </View>
            <Text style={styles.cardTitle}>Notificaciones y Alertas</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Avisar los días de cobro</Text>
              <Text style={styles.switchSub}>
                Te manda una notificación en el celular el día que a un cliente le toca pagar.
              </Text>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {enableNotifications ? (
            <Input
              label="Hora de la notificación matutina (0-23):"
              placeholder="8"
              keyboardType="numeric"
              value={notificationHour}
              onChangeText={setNotificationHour}
              helperText="Ej. 8 para las 8:00 AM"
              containerStyle={{ marginTop: spacing[2] }}
            />
          ) : null}
        </View>

        {/* BOTÓN GUARDAR AJUSTES */}
        <Button onPress={handleSave} loading={isSaving} fullWidth size="lg" style={{ marginBottom: spacing[4] }}>
          Guardar Cambios
        </Button>

        {/* SECCIÓN 7: RESPALDO Y RESTAURACIÓN */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.primarySoft }]}>
              <ShieldCheck size={18} color={colors.primaryDark} />
            </View>
            <Text style={styles.cardTitle}>Copias de Seguridad Offline</Text>
          </View>

          <Text style={styles.backupExplanation}>
            Además de la nube, puedes generar copias físicas en formato JSON para guardar en WhatsApp o Drive.
          </Text>

          <View style={styles.backupActionRow}>
            <Button
              onPress={handleExportBackup}
              variant="outline"
              icon={<Download size={18} color={colors.primaryDark} />}
              style={{ flex: 1 }}
            >
              Exportar Respaldo
            </Button>
            <Button
              onPress={handleImportBackup}
              loading={isRestoring}
              variant="secondary"
              icon={<Upload size={18} color={colors.primaryDark} />}
              style={{ flex: 1 }}
            >
              Restaurar
            </Button>
          </View>

          <View style={styles.autoBackupBox}>
            <Info size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.autoBackupText}>
              Auto-respaldo diario activo (guarda automáticamente las últimas 7 copias locales).
            </Text>
          </View>
        </View>

        {/* APP INFO */}
        <View style={styles.footerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color={colors.primaryDark} />
            <Text style={styles.footerName}>{APP_NAME}</Text>
          </View>
          <Text style={styles.footerVersion}>Versión {APP_VERSION} • Conectado a Supabase</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  cardTitle: {
    ...type.subtitle,
    color: colors.ink,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  switchTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  switchSub: {
    ...type.micro,
    color: colors.inkMuted,
    marginTop: 2,
  },
  backupExplanation: {
    ...type.caption,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  backupActionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  autoBackupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  autoBackupText: {
    ...type.micro,
    color: colors.primaryDark,
    flex: 1,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  footerName: {
    fontFamily: fonts.titleBold,
    fontSize: 15,
    color: colors.ink,
  },
  footerVersion: {
    ...type.micro,
    color: colors.inkLight,
    marginTop: 3,
  },
});
