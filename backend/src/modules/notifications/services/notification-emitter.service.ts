import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent, NotificationAudience, NOTIFICATION_DISPATCH_EVENT } from '../events/notification.event';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';

@Injectable()
export class NotificationEmitterService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: NotificationEvent): void {
    this.emitter.emit(NOTIFICATION_DISPATCH_EVENT, event);
  }

  projectChanged(
    eventKey: string,
    level: NotificationLevel,
    title: string,
    message: string,
    projectId: string,
    data?: Record<string, any>,
  ): void {
    this.emit(
      new NotificationEvent(
        eventKey,
        NotificationCategory.PROJECTS,
        level,
        title,
        message,
        [{ type: 'project', projectId, includeLeader: true, includeAdmins: true }],
        data,
        null,
      ),
    );
  }

  taskEvent(
    eventKey: string,
    level: NotificationLevel,
    title: string,
    message: string,
    projectId: string | null,
    technicianId: string | null,
    data?: Record<string, any>,
  ): void {
    const audiences: NotificationAudience[] = [];
    if (projectId) {
      audiences.push({ type: 'project', projectId, includeLeader: true, includeTechnicians: true });
    } else if (technicianId) {
      audiences.push({ type: 'users', userIds: [technicianId] });
    }
    if (!audiences.length) return;
    this.emit(
      new NotificationEvent(
        eventKey,
        NotificationCategory.TASKS,
        level,
        title,
        message,
        audiences,
        data,
        null,
      ),
    );
  }

  toAdmins(
    eventKey: string,
    category: NotificationCategory,
    level: NotificationLevel,
    title: string,
    message: string,
    data?: Record<string, any>,
    dedupeKey?: string | null,
  ): void {
    this.emit(
      new NotificationEvent(
        eventKey,
        category,
        level,
        title,
        message,
        { type: 'roles', roles: ['admin'] },
        data,
        dedupeKey ?? null,
      ),
    );
  }
}
