import { INestApplicationContext } from '@nestjs/common';
import { AsyncApiDocument, getAsyncApiDocument } from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the metrics sample.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Metrics Service',
    version: '1.0.0',
    description: 'Metric events documented from Zod schemas.',
  });
}
