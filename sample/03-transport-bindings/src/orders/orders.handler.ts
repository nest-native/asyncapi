import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiChannelBindings,
  AsyncApiMessage,
  AsyncApiMessageBindings,
  AsyncApiMessageBindingsMap,
  AsyncApiOperationBindings,
  AsyncApiPub,
  AsyncApiServer,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { OrderPlacedDto } from './order.dto';

/**
 * Wire-format bindings for the `OrderPlaced` message. A message binding
 * describes the message itself, so the publisher and subscriber attach the same
 * map — the generator registers a single reusable `OrderPlaced` message.
 */
const orderPlacedMessageBindings: AsyncApiMessageBindingsMap = {
  kafka: { schemaIdLocation: 'payload', bindingVersion: '0.5.0' },
  amqp: {
    contentEncoding: 'gzip',
    messageType: 'order.placed',
    bindingVersion: '0.3.0',
  },
  mqtt: { payloadFormatIndicator: 1, bindingVersion: '0.2.0' },
};

/**
 * A channel handler showcasing transport bindings for all four v1 protocols.
 *
 * `@AsyncApiServer` declares the brokers the application connects to — one per
 * protocol — carrying the transport identity (`protocol`) and connection
 * metadata (server `bindings`). `@AsyncApiChannelBindings` describes the Kafka
 * topic representation of the channel, and the per-method
 * `@AsyncApiOperationBindings` / `@AsyncApiMessageBindings` document the
 * consumer group, delivery semantics, and message-key handling for each
 * operation.
 */
@Controller()
@AsyncApiServer('kafka', 'kafka.example.com:9092', 'kafka', {
  title: 'Kafka cluster',
  description: 'Primary event backbone.',
  bindings: {
    kafka: {
      schemaRegistryUrl: 'https://schema-registry.example.com',
      schemaRegistryVendor: 'confluent',
      bindingVersion: '0.5.0',
    },
  },
})
@AsyncApiServer('nats', 'nats://nats.example.com:4222', 'nats', {
  title: 'NATS server',
})
@AsyncApiServer('mqtt', 'mqtt.example.com:1883', 'mqtt', {
  title: 'MQTT broker',
  bindings: {
    mqtt: { clientId: 'orders-service', cleanSession: true, bindingVersion: '0.2.0' },
  },
})
@AsyncApiServer('rabbit', 'rabbit.example.com:5672', 'amqp', {
  title: 'RabbitMQ broker',
})
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  title: 'Orders',
  description: 'Lifecycle events for customer orders.',
})
@AsyncApiChannelBindings({
  kafka: {
    topic: 'orders.v1',
    partitions: 6,
    replicas: 3,
    bindingVersion: '0.5.0',
  },
  amqp: {
    is: 'routingKey',
    exchange: { name: 'orders', type: 'topic', durable: true },
    bindingVersion: '0.3.0',
  },
})
export class OrdersHandler {
  /**
   * Publish an `order placed` event. The Kafka operation binding documents the
   * producer's client id and the message binding pins schema-id handling.
   */
  @AsyncApiPub({
    operationId: 'publishOrderPlaced',
    summary: 'Publish an order placed event.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  @AsyncApiOperationBindings({
    kafka: {
      clientId: { type: 'string', enum: ['orders-producer'] },
      bindingVersion: '0.5.0',
    },
  })
  @AsyncApiMessageBindings(orderPlacedMessageBindings)
  publishOrderPlaced(): void {
    // Transport is out of scope for @nest-native/asyncapi; a real application
    // emits through @nestjs/microservices or @nest-native/kafka here.
  }

  /**
   * Receive `order placed` events. The operation declares a Kafka consumer
   * group, a NATS queue group, and MQTT delivery semantics — one operation can
   * carry bindings for every transport it is exposed on.
   */
  @AsyncApiSub({
    operationId: 'onOrderPlaced',
    summary: 'React to an order being placed.',
  })
  @AsyncApiMessage(OrderPlacedDto, {
    name: 'OrderPlaced',
    summary: 'A customer placed an order.',
  })
  @AsyncApiOperationBindings({
    kafka: {
      groupId: { type: 'string', enum: ['orders-consumer'] },
      bindingVersion: '0.5.0',
    },
    nats: { queue: 'orders-workers', bindingVersion: '0.1.0' },
    mqtt: { qos: 1, retain: false, bindingVersion: '0.2.0' },
    amqp: { deliveryMode: 2, ack: true, bindingVersion: '0.3.0' },
  })
  @AsyncApiMessageBindings(orderPlacedMessageBindings)
  handleOrderPlaced(): void {
    // A real subscriber would update read models or notify the customer here.
  }
}
