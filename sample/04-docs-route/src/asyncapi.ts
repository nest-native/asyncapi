import { INestApplicationContext } from '@nestjs/common';
import {
  AsyncApiDocument,
  getAsyncApiDocument,
} from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the docs-route sample by walking the
 * running application's NestJS metadata.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Orders Service',
    version: '1.0.0',
    description: 'Order events served through the AsyncAPI docs route.',
  });
}
