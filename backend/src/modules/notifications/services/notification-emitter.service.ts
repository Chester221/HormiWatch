import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotificationEvent,
  NotificationAudience,
  NOTIFICATION_DISPATCH_EVENT,
} from '../events/notification.event';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';

export interface TaskAudienceOptions {
  includeAdmins?: boolean;
  includeLeader?: boolean;
  includeTechnicians?: boolean;
}

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
        [
          {
            type: 'project',
            projectId,
            includeLeader: true,
            includeAdmins: true,
          },
        ],
        data,
        null,
      ),
    );
  }

  projectCreated(
    eventKey: string,
    level: NotificationLevel,
    title: string,
    message: string,
    projectId: string,
    data?: Record<string, any>,
    extraUserIds: string[] = [],
  ): void {
    const audiences: NotificationAudience[] = [
      {
        type: 'project',
        projectId,
        includeLeader: true,
        includeTechnicians: true,
        includeAdmins: true,
      },
    ];
    if (extraUserIds.length) {
      audiences.push({ type: 'users', userIds: extraUserIds });
    }
    this.emit(
      new NotificationEvent(
        eventKey,
        NotificationCategory.PROJECTS,
        level,
        title,
        message,
        audiences,
        data,
        null,
      ),
    );
  }

  projectAssignment(
    projectId: string,
    projectTitle: string,
    managerName: string,
    technicianIds: string[],
  ): void {
    if (!technicianIds.length) return;
    this.emit(
      new NotificationEvent(
        'project.assigned',
        NotificationCategory.PROJECTS,
        NotificationLevel.INFO,
        'Nuevo proyecto asignado',
        `Has sido asignado al proyecto "${projectTitle}" por el Manager ${managerName}.`,
        { type: 'users', userIds: technicianIds },
        { projectId, title: projectTitle },
        `project.assigned:${projectId}`,
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
    options: TaskAudienceOptions = {},
  ): void {
    const includeAdmins = options.includeAdmins ?? false;
    const includeLeader = options.includeLeader ?? true;
    const includeTechnicians = options.includeTechnicians ?? true;
    const audiences: NotificationAudience[] = [];

    if (projectId) {
      audiences.push({
        type: 'project',
        projectId,
        includeLeader,
        includeTechnicians,
        includeAdmins,
      });
    } else {
      if (includeAdmins) {
        audiences.push({ type: 'roles', roles: ['admin'] });
      }
      if (includeTechnicians && technicianId) {
        audiences.push({ type: 'users', userIds: [technicianId] });
      }
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

  toUsers(
    eventKey: string,
    category: NotificationCategory,
    level: NotificationLevel,
    title: string,
    message: string,
    userIds: string[],
    data?: Record<string, any>,
    dedupeKey?: string | null,
  ): void {
    if (!userIds.length) return;
    this.emit(
      new NotificationEvent(
        eventKey,
        category,
        level,
        title,
        message,
        { type: 'users', userIds },
        data,
        dedupeKey ?? null,
      ),
    );
  }
}
