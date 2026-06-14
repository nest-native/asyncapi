import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiPub,
  AsyncApiServer,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { OrderPlacedDto } from './order.dto';

/**
 * A channel handler whose generated document is served by the docs route. It
 * declares a Kafka server, an `orders` channel, and a publish/receive pair for
 * the `OrderPlaced` message so the viewer has servers, channels, operations, and
 * a schema to render.
 */
@Controller()
@AsyncApiServer('kafka', 'kafka.example.com:9092', 'kafka', {
  title: 'Kafka cluster',
  description: 'Primary event backbone.',
})
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  title: 'Orders',
  description: 'Lifecycle events for customer orders.',
})
export class OrdersHandler {
  /**
   * Publish an `order placed` event.
   */
  @AsyncApiPub({
    operationId: 'publishOrderPlaced',
    summary: 'Publish an order placed event.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  publishOrderPlaced(): void {
    // Transport is out of scope for @nest-native/asyncapi.
  }

  /**
   * React to an `order placed` event.
   */
  @AsyncApiSub({
    operationId: 'onOrderPlaced',
    summary: 'React to an order being placed.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  handleOrderPlaced(): void {
    // A real subscriber would update read models or notify the customer here.
  }
}
