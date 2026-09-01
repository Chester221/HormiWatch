import { ValueTransformer } from 'typeorm';
import { Temporal } from 'temporal-polyfill';

export const UtcDateTransformer: ValueTransformer = {
  to(value: any): any {
    if (!value) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const date = typeof value === 'string' ? new Date(value) : value;

    const d = date as Date;

    // UTC (App) -> EST (DB)
    // Interpret the JS Date as a UTC Instant
    try {
      const instant = Temporal.Instant.fromEpochMilliseconds(d.getTime());
      // Convert to strict EST (UTC-5)
      const zdt = instant.toZonedDateTimeISO('EST');

      // Return format compatible with MySQL: YYYY-MM-DD HH:mm:ss.SSS
      return zdt.toPlainDateTime().toString().replace('T', ' ');
    } catch (e) {
      console.error('Error transforming date to DB:', value, e);

      return value;
    }
  },
  from(value: any): any {
    if (!value) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const stringValue = value;

      // Handle case where driver returns a Date object despite configuration
      if (value instanceof Date) {
        return value;
      }

      if (typeof stringValue === 'string') {
        // EST (DB) -> UTC (App)
        // Clean string
        const cleanStr = stringValue.replace(' ', 'T');
        // Parse as PlainDateTime (wall-clock time)
        const pdt = Temporal.PlainDateTime.from(cleanStr);
        // Interpret that wall-clock time as being in EST
        const zdt = pdt.toZonedDateTime('EST');
        // Return JS Date (UTC)
        return new Date(zdt.epochMilliseconds);
      }

      return value;
    } catch (e) {
      console.error('Error transforming date from DB:', value, e);

      return value;
    }
  },
};
