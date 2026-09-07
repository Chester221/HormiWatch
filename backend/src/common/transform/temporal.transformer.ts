import { ValueTransformer } from 'typeorm';
import { Temporal } from 'temporal-polyfill';

// Para columnas tipo timestamp/datetime (ej: start_datetime en Tasks)
export const TemporalInstantTransformer: ValueTransformer = {
  // De la App a la BD (Temporal.Instant -> Date de JS -> EST String)
  to: (value: any): any => {
    if (!value) return null;
    // Assuming value is Temporal.Instant
    const instant = value as Temporal.Instant;

    // Convert to strict EST (UTC-5)
    // instant is already UTC.
    const zdt = instant.toZonedDateTimeISO('EST');

    // Return format compatible with MySQL: YYYY-MM-DD HH:mm:ss.SSS
    return zdt.toPlainDateTime().toString().replace('T', ' ');
  },
  // De la Base de Datos a la App (EST String -> Temporal.Instant)
  from: (value: any): any => {
    if (!value) return null;

    // Check if double shift

    if (
      value &&
      typeof value === 'object' &&
      'epochMilliseconds' in value &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof value.toZonedDateTimeISO === 'function'
    ) {
      return value;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let stringValue = value;

    // Manejo robusto: si la BD devuelve string o Date
    if (value instanceof Date) {
      // Extract "local" time from Date object

      const d = value;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const pad3 = (n: number) => n.toString().padStart(3, '0');
      stringValue = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad3(d.getUTCMilliseconds())}`;
    }

    if (typeof stringValue === 'string') {
      const cleanStr = stringValue.replace(' ', 'T');
      try {
        // Parse as PlainDateTime (wall-clock time in EST)
        const pdt = Temporal.PlainDateTime.from(cleanStr);
        // Interpret as EST
        const zdt = pdt.toZonedDateTime('EST');
        // Return Instant (UTC)
        return zdt.toInstant();
      } catch (e) {
        console.error('Error parsing TemporalInstant:', value, e);
        return null;
      }
    }
    // Fallback? Ideally shouldn't happen with dateStrings: true
    return null;
  },
};

// Para columnas tipo date (ej: holidays, project start_date)
export const TemporalPlainDateTransformer: ValueTransformer = {
  // De la App a la BD (Temporal.PlainDate -> String 'YYYY-MM-DD')
  to: (value: any): any => {
    // Dates are usually timezone agnostic in storage ('YYYY-MM-DD')
    // But if we want to be safe, we just toString it.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return value ? value.toString() : null;
  },
  // De la BD a la App (String/Date -> Temporal.PlainDate)
  from: (value: any): any => {
    if (!value) return null;

    // Fix double-shift

    if (
      value &&
      typeof value === 'object' &&
      'year' in value &&
      'month' in value &&
      'day' in value
    ) {
      return value;
    }

    if (value instanceof Date) {
      // Use string part
      return Temporal.PlainDate.from(value.toISOString().split('T')[0]);
    }
    return Temporal.PlainDate.from(value as string);
  },
};
