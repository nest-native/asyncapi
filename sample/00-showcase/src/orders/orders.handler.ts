import { Controller } from '@nestjs/common';
import { AsyncApiChannel, AsyncApiPub, AsyncApiSub } from '@nest-native/asyncapi';

/**
 * A single channel handler that showcases the milestone 3 decorators.
 *
 * `@AsyncApiChannel` declares the channel this class operates on. Each method
 * declares an AsyncAPI 3.0 operation: `@AsyncApiPub` produces a `send`
 * operation and `@AsyncApiSub` produces a `receive` operation. Message payload,
 * headers, transport bindings, and the docs route arrive in later milestones;
 * this handler intentionally stays focused on channels and operations.
 */
@Controller()
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  title: 'Orders',
  description: 'Lifecycle events for customer orders.',
})
export class OrdersHandler {
  /**
   * The application publishes an `order placed` event onto the orders channel.
   */
  @AsyncApiPub({
    operationId: 'orderPlaced',
    summary: 'A customer placed an order.',
  })
  publishOrderPlaced(): void {
    // Transport is out of scope for @nest-native/asyncapi; a real application
    // emits through @nestjs/microservices or @nest-native/kafka here.
  }

  /**
   * The application receives `order shipped` events from the orders channel.
   */
  @AsyncApiSub({
    operationId: 'onOrderShipped',
    summary: 'React to an order being shipped.',
  })
  handleOrderShipped(): void {
    // A real subscriber would update read models or notify the customer here.
  }
}
