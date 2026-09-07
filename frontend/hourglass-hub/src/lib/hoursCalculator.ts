/**
 * Sistema de Cálculo de Horas y Tarifas - HormiWatch
 * 
 * Horario Diurno:  6:00 AM - 6:59 PM → ×1
 * Horario Nocturno: 7:00 PM - 5:59 AM → ×1.5
 * 
 * Multiplicadores por tipo de día (prioridad de mayor a menor):
 * - Domingo → ×2 (siempre, sin importar si es feriado)
 * - Feriado (lunes a sábado) → ×2
 * - Sábado (no feriado) → ×1.5
 * - Lunes a Viernes: Diurno ×1, Nocturno ×1.5
 */

// ============================================
// FERIADOS BANCARIOS DE VENEZUELA
// ============================================

const HOLIDAYS_2026 = [
  "2026-01-01", // Jueves - Año Nuevo
  "2026-01-06", // Martes - Día de Reyes
  "2026-02-24", // Martes - Día de la Independencia
  "2026-03-02", // Lunes - Carnaval
  "2026-03-03", // Martes - Carnaval
  "2026-04-02", // Jueves - Jueves Santo
  "2026-04-03", // Viernes - Viernes Santo
  "2026-04-19", // Domingo - Día de la Independencia
  "2026-05-01", // Viernes - Día del Trabajador
  "2026-06-24", // Miércoles - Batalla de Carabobo
  "2026-07-05", // Domingo - Día de la Independencia
  "2026-07-24", // Viernes - Natalicio de Simón Bolívar
  "2026-10-12", // Lunes - Día de la Resistencia Indígena
  "2026-12-25", // Viernes - Navidad
  "2026-12-31", // Jueves - Fin de Año
];

const HOLIDAYS_2027 = [
  "2027-01-01", // Viernes - Año Nuevo
  "2027-01-06", // Miércoles - Día de Reyes
  "2027-02-16", // Martes - Carnaval
  "2027-02-17", // Miércoles - Carnaval
  "2027-03-25", // Jueves - Jueves Santo
  "2027-03-26", // Viernes - Viernes Santo
  "2027-04-19", // Lunes - Día de la Independencia
  "2027-05-01", // Sábado - Día del Trabajador
  "2027-06-24", // Jueves - Batalla de Carabobo
  "2027-07-05", // Lunes - Día de la Independencia
  "2027-07-24", // Sábado - Natalicio de Simón Bolívar
  "2027-10-12", // Martes - Día de la Resistencia Indígena
  "2027-12-25", // Sábado - Navidad
  "2027-12-31", // Viernes - Fin de Año
];

const HOLIDAYS = [...HOLIDAYS_2026, ...HOLIDAYS_2027];

// ============================================
// HELPERS
// ============================================

export interface DayBreakdown {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  normalHours: number;
  overtimeHours: number;
  normalPay: number;
  overtimePay: number;
  totalHours: number;
  totalPay: number;
  multiplier: number;
  multiplierLabel: string;
}

export interface TaskBreakdown {
  days: DayBreakdown[];
  grandTotalHours: number;
  grandTotalPay: number;
  hasOvertime: boolean;
  hasHoliday: boolean;
  hasWeekend: boolean;
  overallMultiplier: string;
}

export interface HoursBreakdown {
  normalHours: number;
  overtimeHours: number;
  normalPay: number;
  overtimePay: number;
  totalHours: number;
  totalPay: number;
}

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ============================================
// VERIFICACIÓN DE FERIADOS
// ============================================

export const isHoliday = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateStr);
};

export const getHolidaysList = (): string[] => {
  return HOLIDAYS;
};

export const isHolidayDate = (date: Date): boolean => {
  return isHoliday(date);
};

// ============================================
// CÁLCULO DE MULTIPLICADOR
// ============================================

function getDayMultiplier(date: Date, holidaysList: string[]): { multiplier: number; label: string } {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();
  const isHoliday = holidaysList.includes(dateStr);
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  // 🔒 1. DOMINGO siempre tiene prioridad (sin importar si es feriado)
  if (isSunday) return { multiplier: 2, label: 'Domingo ×2' };
  
  // 🔒 2. FERIADO (lunes a sábado)
  if (isHoliday) return { multiplier: 2, label: 'Feriado ×2' };
  
  // 🔒 3. SÁBADO (no feriado)
  if (isSaturday) return { multiplier: 1.5, label: 'Sábado ×1.5' };
  
  // 🔒 4. Lunes a Viernes - se calcula por horario
  return { multiplier: 1, label: 'Diurno ×1' };
}

// ============================================
// CÁLCULO DE DESGLOSE POR DÍA
// ============================================

function calculateDayBreakdown(
  date: Date,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  hourlyRate: number,
  holidaysList: string[]
): DayBreakdown {
  const dateStr = date.toISOString().split('T')[0];
  const { multiplier, label } = getDayMultiplier(date, holidaysList);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = holidaysList.includes(dateStr);
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  let normalMinutes = 0;
  let overtimeMinutes = 0;

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Separar minutos según horario diurno/nocturno
  for (let m = startTotalMinutes; m < endTotalMinutes; m++) {
    const hour = Math.floor(m / 60);
    // Diurno: 6:00 - 18:59 (6 AM - 6:59 PM)
    if (hour >= 6 && hour < 19) {
      normalMinutes++;
    } else {
      // Nocturno: 19:00 - 5:59 (7 PM - 5:59 AM)
      overtimeMinutes++;
    }
  }

  const normalHours = Math.round((normalMinutes / 60) * 100) / 100;
  const overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100;
  const totalHours = Math.round((normalHours + overtimeHours) * 100) / 100;

  // Calcular pagos según el tipo de día
  let normalPay: number;
  let overtimePay: number;

  // Domingo, Feriado o Sábado: todo el día usa el multiplicador correspondiente
  if (isSunday || isHoliday || isSaturday) {
    normalPay = Math.round(normalHours * hourlyRate * multiplier * 100) / 100;
    overtimePay = Math.round(overtimeHours * hourlyRate * multiplier * 100) / 100;
  } else {
    // Lunes a Viernes: diurno ×1, nocturno ×1.5
    normalPay = Math.round(normalHours * hourlyRate * 1 * 100) / 100;
    overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;
  }

  const totalPay = Math.round((normalPay + overtimePay) * 100) / 100;

  return {
    date: dateStr,
    dayOfWeek: DAYS_OF_WEEK[dayOfWeek],
    isWeekend,
    isHoliday,
    normalHours,
    overtimeHours,
    normalPay,
    overtimePay,
    totalHours,
    totalPay,
    multiplier,
    multiplierLabel: label,
  };
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export function calculateTaskBreakdown(
  startTime: string,
  endTime: string,
  hourlyRate: number,
  holidaysList: string[]
): TaskBreakdown {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const days: DayBreakdown[] = [];
  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const effectiveStart = start > dayStart ? start : dayStart;
    const effectiveEnd = end < dayEnd ? end : dayEnd;

    if (effectiveStart < effectiveEnd) {
      const breakdown = calculateDayBreakdown(
        new Date(current),
        effectiveStart.getHours(), effectiveStart.getMinutes(),
        effectiveEnd.getHours(), effectiveEnd.getMinutes(),
        hourlyRate,
        holidaysList
      );
      if (breakdown.totalHours > 0) days.push(breakdown);
    }
    current.setDate(current.getDate() + 1);
  }

  const grandTotalHours = Math.round(days.reduce((sum, d) => sum + d.totalHours, 0) * 100) / 100;
  const grandTotalPay = Math.round(days.reduce((sum, d) => sum + d.totalPay, 0) * 100) / 100;
  const maxMultiplier = Math.max(...days.map(d => d.multiplier), 1);

  return {
    days,
    grandTotalHours,
    grandTotalPay,
    hasOvertime: days.some(d => d.overtimeHours > 0),
    hasHoliday: days.some(d => d.isHoliday),
    hasWeekend: days.some(d => d.isWeekend),
    overallMultiplier: `${maxMultiplier}x`,
  };
}

// ============================================
// FUNCIONES SIMPLIFICADAS PARA EL DASHBOARD
// ============================================

export function calculateHoursWithFactors(task: any): number {
  const startTime = task.start_time;
  const endTime = task.end_time;
  const hourlyRate = task.applied_hourly_rate || 1;

  if (!startTime || !endTime) {
    // Fallback: usar duration_in_minutes si existe
    if (task.duration_in_minutes) {
      return task.duration_in_minutes / 60;
    }
    return 0;
  }

  const breakdown = calculateTaskBreakdown(startTime, endTime, hourlyRate, HOLIDAYS);
  return breakdown.grandTotalHours;
}

export function getHoursBreakdown(task: any) {
  const startTime = task.start_time;
  const endTime = task.end_time;
  const hourlyRate = task.applied_hourly_rate || 1;

  if (!startTime || !endTime) {
    return {
      normalHours: 0,
      overtimeHours: 0,
      totalHours: task.duration_in_minutes ? task.duration_in_minutes / 60 : 0,
    };
  }

  const breakdown = calculateTaskBreakdown(startTime, endTime, hourlyRate, HOLIDAYS);
  return {
    normalHours: breakdown.days.reduce((s, d) => s + d.normalHours, 0),
    overtimeHours: breakdown.days.reduce((s, d) => s + d.overtimeHours, 0),
    totalHours: breakdown.grandTotalHours,
  };
}

// ============================================
// FUNCIONES LEGACY (para compatibilidad)
// ============================================

export function calculateHoursBreakdown(
  startTime: string,
  endTime: string,
  hourlyRate: number,
  isHoliday: boolean = false
): HoursBreakdown {
  const holidaysList = isHoliday ? HOLIDAYS : [];
  const breakdown = calculateTaskBreakdown(startTime, endTime, hourlyRate, holidaysList);
  return {
    normalHours: breakdown.days.reduce((s, d) => s + d.normalHours, 0),
    overtimeHours: breakdown.days.reduce((s, d) => s + d.overtimeHours, 0),
    normalPay: breakdown.days.reduce((s, d) => s + d.normalPay, 0),
    overtimePay: breakdown.days.reduce((s, d) => s + d.overtimePay, 0),
    totalHours: breakdown.grandTotalHours,
    totalPay: breakdown.grandTotalPay,
  };
}

export function calculateTotalHours(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}