import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  // Mapeo de códigos de error por driver
  private readonly errorCodes = {
    postgres: {
      uniqueViolation: ['23505'], // unique_violation
      foreignKeyViolationMissing: ['23503'], // foreign_key_violation
      notNullViolation: ['23502'], // not_null_violation
    },
  };

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const driver = 'postgres';

    const driverError = exception.driverError as {
      code?: string;
      errno?: number;
    };

    const errorCode = driverError.errno || driverError.code;

    this.logger.error(
      `Error de base de datos: ${exception.message} (Code: ${errorCode})`,
    );

    if (this.isError(driver, 'uniqueViolation', errorCode)) {
      const status = HttpStatus.CONFLICT;
      return response.status(status).json({
        statusCode: status,
        message: 'Ya existe un registro con esos datos',
        error: 'Conflict',
      });
    }

    if (this.isError(driver, 'foreignKeyViolationMissing', errorCode)) {
      const status = HttpStatus.UNPROCESSABLE_ENTITY;
      return response.status(status).json({
        statusCode: status,
        message: 'El recurso referenciado no existe',
        error: 'Unprocessable Entity',
      });
    }

    if (this.isError(driver, 'notNullViolation', errorCode)) {
      const status = HttpStatus.BAD_REQUEST;
      return response.status(status).json({
        statusCode: status,
        message: 'Falta un campo obligatorio',
        error: 'Bad Request',
      });
    }

    // Fallback para errores no mapeados
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno de base de datos',
    });
  }

  private isError(
    driver: keyof typeof this.errorCodes,
    type: keyof (typeof this.errorCodes)['postgres'],
    code: number | string | undefined,
  ): boolean {
    if (!code) return false;
    return this.errorCodes[driver][type].some(
      (c) => c.toString() === code.toString(),
    );
  }
}
