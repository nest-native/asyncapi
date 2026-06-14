import { INestApplicationContext } from '@nestjs/common';
import { AsyncApiDocument, getAsyncApiDocument } from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the payments sample.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Payments Service',
    version: '1.0.0',
    description: 'Payment events documented from class-validator DTOs.',
  });
}
