import { INestApplicationContext } from '@nestjs/common';
import {
  AsyncApiDocument,
  getAsyncApiDocument,
} from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the showcase application.
 *
 * This mirrors `SwaggerModule.createDocument` from `@nestjs/swagger`: it walks
 * the running application's NestJS metadata and assembles a spec-compliant
 * document from the decorated channel handlers.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Orders Service',
    version: '1.0.0',
    description: 'Event-driven order lifecycle, documented with AsyncAPI 3.0.',
  });
}
