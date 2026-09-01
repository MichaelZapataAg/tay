/**
 * Manejo de notificaciones locales de cobro para Tay.
 * Import defensivo: no tumba la app si el módulo nativo falta o falla.
 */
import { Platform } from 'react-native';
import { money } from './format';
import { getSettingsSnapshot } from './settings';

let NotificationsModule: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NotificationsModule = require('expo-notifications');
  if (NotificationsModule && NotificationsModule.setNotificationHandler) {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: NotificationsModule?.AndroidNotificationPriority?.HIGH,
      }),
    });
  }
} catch {
  NotificationsModule = null;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!NotificationsModule) return false;
  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notifications] Error requesting permissions:', err);
    return false;
  }
}

/**
 * Programa una notificación de cobro para la fecha indicada (a las 8:00 AM)
 */
export async function scheduleLoanDueNotification({
  loanId,
  clientName,
  interestAmount,
  dueDateIso,
}: {
  loanId: string;
  clientName: string;
  interestAmount: number;
  dueDateIso: string;
}): Promise<string | null> {
  if (!NotificationsModule) return null;

  const settings = getSettingsSnapshot();
  if (!settings.enableNotifications) return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Cancela notificación previa si existe para este loanId
    await cancelLoanNotification(loanId);

    const [year, month, day] = dueDateIso.split('-').map(Number);
    const triggerDate = new Date(
      year,
      month - 1,
      day,
      settings.notificationHour ?? 8,
      settings.notificationMinute ?? 0,
      0,
    );

    // Si ya pasó la fecha/hora, no programar en el pasado
    if (triggerDate.getTime() <= Date.now()) {
      return null;
    }

    const identifier = await NotificationsModule.scheduleNotificationAsync({
      identifier: `loan-due-${loanId}`,
      content: {
        title: `💰 Cobro de hoy: ${clientName}`,
        body: `Hoy corresponde cobrar ${money(interestAmount)} de intereses a ${clientName}.`,
        data: { loanId, clientName, dueDateIso },
        sound: 'default',
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return identifier;
  } catch (err) {
    console.warn('[notifications] Error scheduling loan notification:', err);
    return null;
  }
}

export async function cancelLoanNotification(loanId: string): Promise<void> {
  if (!NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync(`loan-due-${loanId}`);
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  if (!NotificationsModule) return;
  try {
    await NotificationsModule.cancelAllScheduledNotificationsAsync();
  } catch {}
}
