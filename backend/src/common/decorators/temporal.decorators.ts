import { applyDecorators, Logger } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Temporal } from 'temporal-polyfill';
import { ApiProperty } from '@nestjs/swagger'; // Opcional: Si usas Swagger

const logger = new Logger('TemporalDecorator');

// --- VALIDATORS INTERNOS ---

function IsTemporalInstantConstraint(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTemporalInstant',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          try {
            if (typeof value !== 'string') return false;
            // Intenta parsear. Temporal.Instant es estricto con el formato ISO
            Temporal.Instant.from(value);
            return true;
          } catch (e) {
            logger.error(e);
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser una fecha ISO 8601 válida (ej. 2025-12-14T15:30:00Z)`;
        },
      },
    });
  };
}

function IsTemporalDateConstraint(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTemporalDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          try {
            if (typeof value !== 'string') return false;
            Temporal.PlainDate.from(value);
            return true;
          } catch (e) {
            logger.error(e);
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser una fecha válida (ej. 2025-12-14)`;
        },
      },
    });
  };
}

// --- DECORADORES PÚBLICOS (Copiar y pegar en DTOs) ---

/**
 * Valida y Transforma un string ISO 8601 a Temporal.Instant (UTC).
 * Úsalo para: createdAt, timestamps, inicio de tareas, logs.
 */
export function IsTemporalInstant(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsTemporalInstantConstraint(validationOptions),
    Transform(({ value }) => {
      try {
        return Temporal.Instant.from(value);
      } catch (e) {
        logger.error(e);
        return value; // Retorna el valor original para que el validador maneje el error
      }
    }),
    // Opcional: Documentación automática para Swagger
    ApiProperty({
      example: '2025-12-14T10:00:00Z',
      description: 'Fecha y hora exacta en formato ISO 8601 (UTC)',
      type: String,
    }),
  );
}

/**
 * Valida y Transforma un string (YYYY-MM-DD) a Temporal.PlainDate.
 * Úsalo para: Cumpleaños, Feriados, Fechas de vencimiento (sin hora).
 */
export function IsTemporalDate(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsTemporalDateConstraint(validationOptions),
    Transform(({ value }) => {
      try {
        return Temporal.PlainDate.from(value);
      } catch (e) {
        logger.error(e);
        return value;
      }
    }),
    ApiProperty({
      example: '2025-12-14',
      description: 'Fecha calendario sin hora (YYYY-MM-DD)',
      type: String,
    }),
  );
}
