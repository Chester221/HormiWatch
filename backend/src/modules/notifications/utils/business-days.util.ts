import { Temporal } from 'temporal-polyfill';

/**
 * Un dia habil es lunes a viernes y no esta marcado como feriado
 * (Holiday.isWorkingDay = false).
 */
export function isBusinessDay(
  date: Temporal.PlainDate,
  nonWorkingDays: ReadonlySet<string> = new Set<string>(),
): boolean {
  if (date.dayOfWeek === 6 || date.dayOfWeek === 7) return false;
  return !nonWorkingDays.has(date.toString());
}

/**
 * Retrocede `businessDays` dias habiles desde `from` (no cuenta el dia actual).
 * Ej: desde el miercoles 21/10 con 3 dias habiles -> viernes 17/10.
 */
export function subtractBusinessDays(
  from: Temporal.PlainDate,
  businessDays: number,
  nonWorkingDays: ReadonlySet<string> = new Set<string>(),
): Temporal.PlainDate {
  if (businessDays <= 0) return from;
  let cursor = from;
  let counted = 0;
  let guard = 0;
  while (counted < businessDays && guard < 3660) {
    cursor = cursor.subtract({ days: 1 });
    guard++;
    if (isBusinessDay(cursor, nonWorkingDays)) counted++;
  }
  return cursor;
}

/**
 * Cuenta los dias habiles dentro del intervalo (from, to].
 */
export function countBusinessDays(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
  nonWorkingDays: ReadonlySet<string> = new Set<string>(),
): number {
  let count = 0;
  let cursor = from;
  let guard = 0;
  while (Temporal.PlainDate.compare(cursor, to) < 0 && guard < 3660) {
    cursor = cursor.add({ days: 1 });
    guard++;
    if (isBusinessDay(cursor, nonWorkingDays)) count++;
  }
  return count;
}
