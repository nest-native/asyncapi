import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiChannelBindings,
  AsyncApiHeaders,
  AsyncApiMessage,
  AsyncApiOperationBindings,
  AsyncApiPub,
  AsyncApiServer,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { OrderHeadersDto, OrderPlacedDto } from './order.dto';

/**
 * A channel handler showcasing the class-validator validation world and Kafka
 * transport bindings.
 *
 * `@AsyncApiChannel` declares the channel this class operates on. Each method
 * declares an AsyncAPI 3.0 operation: `@AsyncApiPub` produces a `send`
 * operation and `@AsyncApiSub` produces a `receive` operation. `@AsyncApiMessage`
 * and `@AsyncApiHeaders` attach the payload and headers DTOs, which the generator
 * turns into JSON Schema through the same `@nestjs/swagger` chain that documents
 * HTTP bodies. `@AsyncApiServer` declares the Kafka broker and
 * `@AsyncApiChannelBindings` / `@AsyncApiOperationBindings` document the Kafka
 * topic and consumer group.
 */
@Controller()
@AsyncApiServer('kafka', 'kafka.example.com:9092', 'kafka', {
  title: 'Kafka cluster',
  bindings: {
    kafka: { schemaRegistryVendor: 'confluent', bindingVersion: '0.5.0' },
  },
})
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  title: 'Orders',
  description: 'Lifecycle events for customer orders.',
})
@AsyncApiChannelBindings({
  kafka: {
    topic: 'orders.v1',
    partitions: 3,
    replicas: 3,
    bindingVersion: '0.5.0',
  },
})
export class OrdersHandler {
  /**
   * The application publishes an `order placed` event onto the orders channel.
   */
  @AsyncApiPub({
    operationId: 'orderPlaced',
    summary: 'A customer placed an order.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  @AsyncApiHeaders(OrderHeadersDto)
  publishOrderPlaced(): void {
    // Transport is out of scope for @nest-native/asyncapi; a real application
    // emits through @nestjs/microservices or @nest-native/kafka here.
  }

  /**
   * The application receives `order placed` events from the orders channel and
   * reacts to them. It consumes the same `OrderPlaced` message it publishes, so
   * the message and its schemas are defined once and reused.
   */
  @AsyncApiSub({
    operationId: 'onOrderPlaced',
    summary: 'React to an order being placed.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  @AsyncApiHeaders(OrderHeadersDto)
  @AsyncApiOperationBindings({
    kafka: {
      groupId: { type: 'string', enum: ['orders-consumer'] },
      bindingVersion: '0.5.0',
    },
  })
  handleOrderPlaced(): void {
    // A real subscriber would update read models or notify the customer here.
  }
}
