import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent, NOTIFICATION_DISPATCH_EVENT } from '../../modules/notifications/events/notification.event';
import { NotificationCategory } from '../../modules/notifications/enums/notification-category.enum';
import { NotificationLevel } from '../../modules/notifications/enums/notification-level.enum';

@Catch()
export class SystemErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(SystemErrorFilter.name);

  constructor(private readonly emitter: EventEmitter2) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(`System error: ${exception}`, exception instanceof Error ? exception.stack : undefined);
      try {
        const hourBucket = new Date().toISOString().slice(0, 13);
        this.emitter.emit(
          NOTIFICATION_DISPATCH_EVENT,
          new NotificationEvent(
            'system.error',
            NotificationCategory.SYSTEM,
            NotificationLevel.CRITICAL,
            'Error del sistema',
            'Se ha producido un error interno en el sistema',
            { type: 'roles', roles: ['admin'] },
            { path: request.url, method: request.method },
            `system.error:${request.method}:${request.url}:${hourBucket}`,
          ),
        );
      } catch (e) {}
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      response.status(status).json(
        typeof res === 'object' ? res : { message: res },
      );
      return;
    }
    response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    });
  }
}
