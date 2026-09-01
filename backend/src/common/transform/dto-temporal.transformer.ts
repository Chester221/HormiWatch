import { Transform } from 'class-transformer';
import { Temporal } from 'temporal-polyfill';

export const TransformPlainDate = () =>
  Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Temporal.PlainDate) {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  });

export const TransformInstant = () =>
  Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Temporal.Instant) {
      // Return ISO string
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
