import { Linking } from 'react-native';
import { money, percent, dateLong, frequencyLabel } from './format';
import { getSettingsSnapshot } from './settings';
import { toast } from './toast';

export function sanitizePhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    // Celular colombiano común (ej. 3123456789 -> 573123456789)
    cleaned = `57${cleaned}`;
  }
  return cleaned;
}

export function openWhatsApp(phone: string, text: string) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) {
    toast.warning('No hay número de teléfono', 'Agrega el teléfono del cliente para escribirle.');
    return;
  }

  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        toast.error('No se pudo abrir WhatsApp', 'Verifica si la app de WhatsApp está instalada.');
      }
    })
    .catch(() => {
      toast.error('Error al abrir WhatsApp');
    });
}

/**
 * Recordatorio cordial de pago de interés / cuota
 */
export function sendPaymentReminder({
  clientName,
  phone,
  interestAmount,
  totalDue,
  nextDueDate,
  notes,
}: {
  clientName: string;
  phone: string;
  interestAmount: number;
  totalDue?: number;
  nextDueDate: string;
  notes?: string | null;
}) {
  const settings = getSettingsSnapshot();
  const owner = settings.ownerName || 'Tay';
  const accounts = settings.paymentAccounts ? `\n💳 *Medios de pago:*\n${settings.paymentAccounts}` : '';

  const text = `Hola *${clientName}*, cordial saludo 😊

Te recuerdo que hoy *${dateLong(nextDueDate)}* corresponde el pago del interés de tu préstamo por valor de *${money(interestAmount)}*.

${accounts}

Quedo muy atenta al comprobante. ¡Muchas gracias y feliz día! ✨
— *${owner}*`;

  openWhatsApp(phone, text);
}

/**
 * Comprobante de recaudo recibido
 */
export function sendPaymentReceipt({
  clientName,
  phone,
  totalPaid,
  interestPaid,
  capitalPaid,
  remainingCapital,
  nextDueDate,
}: {
  clientName: string;
  phone: string;
  totalPaid: number;
  interestPaid: number;
  capitalPaid: number;
  remainingCapital: number;
  nextDueDate?: string | null;
}) {
  const settings = getSettingsSnapshot();
  const owner = settings.ownerName || 'Tay';

  const breakdown = [];
  if (interestPaid > 0) breakdown.push(`• *Interés:* ${money(interestPaid)}`);
  if (capitalPaid > 0) breakdown.push(`• *Abono a capital:* ${money(capitalPaid)}`);

  const nextDateLine =
    remainingCapital > 0 && nextDueDate
      ? `\n📅 *Próxima fecha de corte:* ${dateLong(nextDueDate)}`
      : remainingCapital === 0
      ? `\n🎉 *¡Préstamo cancelado en su totalidad!* Muchas gracias por tu puntualidad.`
      : '';

  const text = `Hola *${clientName}* ✅

He recibido tu pago exitosamente:
💵 *Total abonado:* ${money(totalPaid)}
${breakdown.join('\n')}
💰 *Saldo de capital pendiente:* ${money(remainingCapital)}${nextDateLine}

¡Muchas gracias por tu compromiso!
— *${owner}*`;

  openWhatsApp(phone, text);
}

/**
 * Confirmación de desembolso de nuevo préstamo
 */
export function sendNewLoanConfirmation({
  clientName,
  phone,
  initialAmount,
  rate,
  frequency,
  frequencyDays,
  firstDueDate,
}: {
  clientName: string;
  phone: string;
  initialAmount: number;
  rate: number;
  frequency: string;
  frequencyDays: number;
  firstDueDate: string;
}) {
  const settings = getSettingsSnapshot();
  const owner = settings.ownerName || 'Tay';
  const interestPerPeriod = Math.round((initialAmount * rate) / 100);

  const text = `Hola *${clientName}* 🤝

Confirmamos el desembolso de tu préstamo:
💰 *Capital entregado:* ${money(initialAmount)}
📈 *Tasa de interés:* ${percent(rate)}
⏱️ *Modalidad:* ${frequencyLabel(frequency, frequencyDays)}
💵 *Interés por período:* ${money(interestPerPeriod)}
📅 *Primer corte:* ${dateLong(firstDueDate)}

Quedo a tu disposición.
— *${owner}*`;

  openWhatsApp(phone, text);
}
