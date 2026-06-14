import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { orderShippedMessage } from './shipment.schema';

/**
 * A channel handler showcasing the Zod validation world. The payload schema is
 * supplied as pre-computed JSON Schema (converted from Zod), proving the
 * generator is agnostic to the validation library producing the schema.
 */
@Controller()
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
  handleOrderShipped(): void {
    // A real subscriber would update tracking state here.
  }
}
