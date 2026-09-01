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

  // Mapeo de códigos de error agnóstico al driver
  // Puedes extender esto para otros drivers (Postgres, Oracle, etc.)
  private readonly errorCodes = {
    mysql: {
      uniqueViolation: [1062], // ER_DUP_ENTRY
      foreignKeyViolationMissing: [1452], // ER_NO_REFERENCED_ROW (cuando intentas usar un ID que no existe)
      foreignKeyViolationDependency: [1451], // ER_ROW_IS_REFERENCED (cuando intentas borrar algo que está en uso)
    },
    // postgres: { uniqueViolation: ['23505'] ... }
  };

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const driver = 'mysql'; // Idealmente, esto podría inyectarse o inferirse de la config. Por ahora hardcodeado a mysql.

    const driverError = exception.driverError as {
      code?: string;
      errno?: number;
    };

    // Tratamos de obtener el código numérico o string del error
    const errorCode = driverError.errno || driverError.code;

    this.logger.error(
      `Database Error: ${exception.message} (Code: ${errorCode})`,
    );

    if (this.isError(driver, 'uniqueViolation', errorCode)) {
      const status = HttpStatus.CONFLICT;
      return response.status(status).json({
        statusCode: status,
        message: 'Data already exists or unique constraint check failed',
        error: 'Conflict',
      });
    }

    if (this.isError(driver, 'foreignKeyViolationMissing', errorCode)) {
      const status = HttpStatus.UNPROCESSABLE_ENTITY;
      return response.status(status).json({
        statusCode: status,
        message: 'Referenced resource does not exist',
        error: 'Unprocessable Entity',
      });
    }

    if (this.isError(driver, 'foreignKeyViolationDependency', errorCode)) {
      const status = HttpStatus.CONFLICT;
      return response.status(status).json({
        statusCode: status,
        message: 'Cannot delete/update because record is in use by others',
        error: 'Conflict',
      });
    }

    // Fallback para errores no mapeados
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Database Error',
    });
  }

  private isError(
    driver: keyof typeof this.errorCodes,
    type: keyof (typeof this.errorCodes)['mysql'],
    code: number | string | undefined,
  ): boolean {
    if (!code) return false;
    // Compara casteando a string para ser seguro (1062 == '1062')
    return this.errorCodes[driver][type].some(
      (c) => c.toString() === code.toString(),
    );
  }
}
