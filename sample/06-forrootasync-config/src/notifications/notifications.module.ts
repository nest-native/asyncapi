import { Module } from '@nestjs/common';
import { NotificationsHandler } from './notifications.handler';

/**
 * Feature module wiring the notifications channel handler.
 */
@Module({
  controllers: [NotificationsHandler],
})
export class NotificationsModule {}
