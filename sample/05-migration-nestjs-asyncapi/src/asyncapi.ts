import { INestApplicationContext } from '@nestjs/common';
import {
  AsyncApiDocument,
  getAsyncApiDocument,
} from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the migration sample.
 *
 * This is the `@nest-native/asyncapi` replacement for the original sample's
 * `makeAsyncapiDocument`, which chained `new AsyncApiDocumentBuilder()
 * .setTitle(...).setVersion(...).addServers(...).build()` and then
 * `AsyncApiModule.createDocument(app, options, { include, extraModels })`.
 *
 * Here the document-level metadata is a plain config object, servers are
 * declared with `@AsyncApiServer` on the handler, and there is no `include` /
 * `extraModels` step: discovery walks the running application's modules, and the
 * `@nestjs/swagger` chain pulls in every referenced schema automatically.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  return getAsyncApiDocument(app, {
    title: 'Feline',
    version: '1.0.0',
    description:
      'Feline events, migrated from the nestjs-asyncapi 2.x sample to ' +
      'AsyncAPI 3.0 with @nest-native/asyncapi.',
  });
}
