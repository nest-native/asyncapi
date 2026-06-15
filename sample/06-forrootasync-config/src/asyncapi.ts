import { INestApplicationContext } from '@nestjs/common';
import {
  ASYNC_API_MODULE_OPTIONS,
  AsyncApiDocument,
  AsyncApiModuleOptions,
  getAsyncApiDocument,
} from '@nest-native/asyncapi';

/**
 * Build the AsyncAPI 3.0 document for the `forRootAsync` sample.
 *
 * The document title and version are not hard-coded here: they come from the
 * options that `AsyncApiModule.forRootAsync` resolved asynchronously through the
 * `ConfigService` factory. Reading them back from the DI container under
 * {@link ASYNC_API_MODULE_OPTIONS} proves the async config is what seeds the
 * generated document.
 */
export function createAsyncApiDocument(
  app: INestApplicationContext,
): AsyncApiDocument {
  const options = app.get<AsyncApiModuleOptions>(ASYNC_API_MODULE_OPTIONS);
  const info = options.defaultInfo ?? {};

  return getAsyncApiDocument(app, {
    title: info.title,
    version: info.version,
    description: 'Notification events documented with async-resolved config.',
  });
}
