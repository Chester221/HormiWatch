import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import { IActiveUser } from 'src/modules/auth/interface/payload.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createInApp(params: {
    userId: string;
    category: NotificationCategory;
    level: NotificationLevel;
    title: string;
    message: string;
    data?: Record<string, any>;
    eventKey?: string | null;
    digestSent?: boolean;
  }): Promise<Notification | null> {
    try {
      const entity = this.notificationRepo.create({
        userId: params.userId,
        category: params.category,
        level: params.level,
        title: params.title,
        message: params.message,
        data: params.data || null,
        eventKey: params.eventKey || null,
        digestSent: params.digestSent ?? true,
        readAt: null,
      });
      return await this.notificationRepo.save(entity);
    } catch (err: any) {
      // ignore unique violation
      if (err?.code === '23505') return null;
      this.logger.warn(`Failed to create notification: ${err?.message}`);
      return null;
    }
  }

  async getMine(user: IActiveUser, unreadOnly = false) {
    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :uid', { uid: user.userId })
      .andWhere('n.deletedAt IS NULL')
      .orderBy('n.createdAt', 'DESC')
      .limit(50);
    if (unreadOnly) qb.andWhere('n.readAt IS NULL');
    return qb.getMany();
  }

  async getUnreadCount(user: IActiveUser) {
    return this.notificationRepo.count({
      where: { userId: user.userId, readAt: IsNull(), deletedAt: IsNull() },
    });
  }

  async markRead(id: string, user: IActiveUser) {
    await this.notificationRepo.update(
      { id, userId: user.userId },
      { readAt: () => 'CURRENT_TIMESTAMP' },
    );
  }

  async markAllRead(user: IActiveUser) {
    await this.notificationRepo.update(
      { userId: user.userId, readAt: IsNull() },
      { readAt: () => 'CURRENT_TIMESTAMP' },
    );
  }
}
