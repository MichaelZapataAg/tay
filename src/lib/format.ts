/**
 * Formateo estricto para Colombia (es-CO):
 * - Pesos enteros COP sin centavos: $ 1.500.000
 * - Fechas legibles en español
 * - Porcentajes y frecuencias de préstamos
 */

export function money(pesos: number | null | undefined): string {
  if (pesos == null || isNaN(pesos)) return '$ 0';
  const rounded = Math.round(pesos);
  const formatted = Math.abs(rounded).toLocaleString('es-CO');
  return rounded < 0 ? `-$ ${formatted}` : `$ ${formatted}`;
}

export function percent(rate: number | null | undefined): string {
  if (rate == null || isNaN(rate)) return '0%';
  return `${rate}%`;
}

export function frequencyLabel(
  freq: 'quincenal' | 'cada_20_dias' | 'mensual' | 'semanal' | 'personalizado_dias' | string,
  days?: number | null,
): string {
  switch (freq) {
    case 'quincenal':
      return 'Quincenal (15 días)';
    case 'cada_20_dias':
      return 'Cada 20 días';
    case 'mensual':
      return 'Mensual (30 días)';
    case 'semanal':
      return 'Semanal (7 días)';
    case 'personalizado_dias':
      return `Cada ${days || 20} días`;
    default:
      if (days) return `Cada ${days} días`;
      return freq;
  }
}

export function frequencyShort(
  freq: 'quincenal' | 'cada_20_dias' | 'mensual' | 'semanal' | 'personalizado_dias' | string,
  days?: number | null,
): string {
  switch (freq) {
    case 'quincenal':
      return 'Quincenal';
    case 'cada_20_dias':
      return '20 días';
    case 'mensual':
      return 'Mensual';
    case 'semanal':
      return 'Semanal';
    case 'personalizado_dias':
      return `${days || 20}d`;
    default:
      if (days) return `${days}d`;
      return freq;
  }
}

export function date(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function dateLong(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function dayMonth(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
}

export function dateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calcula el estado de vencimiento:
 * - 'today': Vence hoy
 * - 'due': Vencido (hace N días)
 * - 'upcoming': Próximo (en N días)
 */
export function getDueStatus(targetDateIso: string): {
  status: 'today' | 'due' | 'upcoming';
  diffDays: number;
  label: string;
} {
  const target = new Date(targetDateIso);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { status: 'today', diffDays: 0, label: 'Cobra hoy' };
  } else if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      status: 'due',
      diffDays,
      label: abs === 1 ? 'Vencido ayer' : `Vencido hace ${abs} días`,
    };
  } else {
    return {
      status: 'upcoming',
      diffDays,
      label: diffDays === 1 ? 'Cobra mañana' : `En ${diffDays} días`,
    };
  }
}
