import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiOperationBindings,
  AsyncApiServer,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { orderShippedMessage } from './shipment.schema';

/**
 * A channel handler showcasing the Zod validation world and NATS transport
 * bindings. The payload schema is supplied as pre-computed JSON Schema
 * (converted from Zod), proving the generator is agnostic to the validation
 * library producing the schema. `@AsyncApiServer` declares the NATS server and
 * `@AsyncApiOperationBindings` documents the NATS queue group, showing a second
 * transport alongside the orders channel's Kafka bindings.
 */
@Controller()
@AsyncApiServer('nats', 'nats://nats.example.com:4222', 'nats', {
  title: 'NATS server',
})
@AsyncApiChannel('shipments', {
  address: 'shipments.v1',
  title: 'Shipments',
  description: 'Shipment events for dispatched orders.',
})
export class ShipmentsHandler {
  /**
   * The application receives `order shipped` events from the shipments channel.
   */
  @AsyncApiSub({
    operationId: 'onOrderShipped',
    summary: 'React to an order being shipped.',
  })
  @AsyncApiMessage(orderShippedMessage, {
    summary: 'An order was handed to a carrier.',
  })
  @AsyncApiOperationBindings({
    nats: { queue: 'shipments-workers', bindingVersion: '0.1.0' },
  })
  handleOrderShipped(): void {
    // A real subscriber would update tracking state here.
  }
}
