import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiPub,
} from '@nest-native/asyncapi';
import { NotificationDispatchedDto } from './notification.dto';

/**
 * A notifications channel. Its decorators are independent of how the module was
 * registered — `forRoot` or `forRootAsync` — so the same handler produces the
 * same channels and operations regardless of where the config came from.
 */
@Controller()
@AsyncApiChannel('notifications', {
  address: 'notifications.v1',
  title: 'Notifications',
  description: 'Notification lifecycle events.',
})
export class NotificationsHandler {
  /**
   * The application publishes a `notification dispatched` event.
   */
  @AsyncApiPub({
    operationId: 'notificationDispatched',
    summary: 'A notification was dispatched to a recipient.',
  })
  @AsyncApiMessage(NotificationDispatchedDto, { name: 'NotificationDispatched' })
  publishNotificationDispatched(): void {
    // Transport is out of scope; a real producer emits the event here.
  }
}
