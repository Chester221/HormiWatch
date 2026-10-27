import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './services/notifications.service';
import { NotificationSettingsService } from './services/notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
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
  ) {}

  @Get()
  async mine(@CurrentUser() user: IActiveUser, @Query('unread') unread?: string) {
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

  @Get('settings')
  async getSettings() {
    console.log('[NOTIF][CTRL] GET /notifications/settings called');
    const res = await this.settings.get();
    console.log('[NOTIF][CTRL] GET /notifications/settings OK');
    return res;
  }

  @Put('settings')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  async updateSettings(@Body() dto: UpdateNotificationSettingsDto) {
    return this.settings.update(dto);
  }
}
