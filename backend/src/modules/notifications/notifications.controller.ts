import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './services/notifications.service';
import { NotificationSettingsService } from './services/notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationEmitterService } from './services/notification-emitter.service';
import { NotificationEvent } from './events/notification.event';
import { NotificationCategory } from './enums/notification-category.enum';
import { NotificationLevel } from './enums/notification-level.enum';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { IActiveUser } from '../auth/interface/payload.interface';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { RolesGuard } from '../auth/guard/authorization.guard';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly settings: NotificationSettingsService,
    private readonly emitter: NotificationEmitterService,
  ) {}

  @Get()
  async mine(
    @CurrentUser() user: IActiveUser,
    @Query('unread') unread?: string,
  ) {
    return this.notifications.getMine(user, unread === 'true');
  }

  @Get('unread-count')
  async count(@CurrentUser() user: IActiveUser) {
    return { count: await this.notifications.getUnreadCount(user) };
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markRead(@Param('id') id: string, @CurrentUser() user: IActiveUser) {
    await this.notifications.markRead(id, user);
    return { ok: true };
  }

  @Patch('read-all')
  @HttpCode(200)
  async markAllRead(@CurrentUser() user: IActiveUser) {
    await this.notifications.markAllRead(user);
    return { ok: true };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string, @CurrentUser() user: IActiveUser) {
    await this.notifications.deleteMine(id, user);
    return { ok: true };
  }

  @Get('settings')
  async getSettings() {
    return this.settings.get();
  }

  @Put('settings')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  async updateSettings(@Body() dto: UpdateNotificationSettingsDto) {
    return this.settings.update(dto);
  }

  /**
   * Prueba real del pipeline: settings -> dispatcher -> DiscordService.
   * No crea notificaciones in-app, emails ni WhatsApp (testOnly).
   */
  @Post('test-discord')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  async testDiscord() {
    const event = new NotificationEvent(
      'system.test.discord',
      NotificationCategory.SYSTEM,
      NotificationLevel.INFO,
      'Prueba de Discord',
      'Si ves este mensaje, las notificaciones automáticas están llegando correctamente.',
      { type: 'roles', roles: ['admin'] },
      {
        path: '/api/v1/notifications/test-discord',
        method: 'POST',
        description: 'Prueba manual del pipeline de notificaciones',
        testOnly: true,
      },
      null,
    );

    const [result] = await this.emitter.emitAsync(event);
    return (
      result ?? {
        ok: false,
        eventKey: event.key,
        category: event.category,
        discordSent: false,
        error: 'El dispatcher no devolvió resultado',
      }
    );
  }
}
