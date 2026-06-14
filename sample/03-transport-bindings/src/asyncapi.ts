import { INestApplicationContext } from '@nestjs/common';
import {
  AsyncApiDocument,
  getAsyncApiDocument,
} from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the transport-bindings sample. It walks
 * the running application and assembles the servers, channel, operations, and
 * messages — each carrying its protocol bindings.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Orders Service',
    version: '1.0.0',
    description: 'Order events documented with Kafka, NATS, MQTT, and AMQP bindings.',
  });
}
